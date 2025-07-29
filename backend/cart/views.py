from django.shortcuts import render
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from .models import CartItem, Order
from .serializers import CartItemSerializer, OrderSerializer
from product.models import Product
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import action
import razorpay
from django.conf import settings
from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
import json
import hmac
import hashlib
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
import logging

# Get logger for this module
logger = logging.getLogger(__name__)

# Create your views here.

def remove_non_ascii(text):
    return ''.join(i if ord(i) < 128 else ' ' for i in text)

class CartListCreateView(generics.ListCreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CartItemUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)

class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Get order items from request data
        order_items = self.request.data.get('items', [])
        discounted_total = self.request.data.get('discounted_total')
        print(f"Received order items: {order_items}")
        print(f"Received discounted total: {discounted_total}")
        
        if not order_items:
            raise serializers.ValidationError("No items provided. Please add items to your order.")
        
        # Calculate total and validate products
        total = 0
        cart_items_to_create = []
        
        for item_data in order_items:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity', 1)
            
            try:
                product = Product.objects.get(id=product_id)
                item_total = product.price * quantity
                total += item_total
                
                # Create cart item for this order
                cart_item = CartItem(
                    user=self.request.user,
                    product=product,
                    quantity=quantity
                )
                cart_items_to_create.append(cart_item)
                
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID {product_id} does not exist.")
        
        # Use discounted total if provided, otherwise use calculated total
        final_total = discounted_total if discounted_total is not None else total
        print(f"Calculated total: {total}")
        print(f"Final total (with discount): {final_total}")
        
        # Get user's address
        address_parts = []
        if self.request.user.address:
            address_parts.append(self.request.user.address)
        if self.request.user.city:
            address_parts.append(self.request.user.city)
        
        user_address = ", ".join(address_parts) if address_parts else "Address not provided"
        print(f"User address: {user_address}")
        
        # Check if THIS USER already has a pending order (not other users)
        existing_pending = Order.objects.filter(user=self.request.user, status='pending').first()
        if existing_pending:
            raise serializers.ValidationError("You already have a pending order. Please wait for admin approval or rejection before placing a new order.")
        
        try:
            with transaction.atomic():
                # Create the order with the final total (including discount)
                order = serializer.save(
                    user=self.request.user, 
                    total=final_total,
                    status='pending',
                    address=user_address
                )
                
                # Save cart items and associate with order
                for cart_item in cart_items_to_create:
                    cart_item.save()
                
                order.items.set(cart_items_to_create)
                print(f"Order created successfully: {order.id} with {len(cart_items_to_create)} items")
                
                return order
        except Exception as e:
            print(f"Error creating order: {e}")
            raise serializers.ValidationError(f"Failed to create order: {str(e)}")

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

# Admin approval views
class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admin users
        if not self.request.user.is_staff and self.request.user.username != 'skadmin':
            return Order.objects.none()
        
        # Get all pending orders with related data
        pending_orders = Order.objects.filter(status='pending').select_related('user').prefetch_related('items__product').order_by('-created_at')
        print(f"Found {pending_orders.count()} pending orders for admin")
        return pending_orders

class AdminOrderApprovalView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id):
        # Only allow admin users
        if not request.user.is_staff and request.user.username != 'skadmin':
            return Response({"error": "Unauthorized. Admin access required."}, status=status.HTTP_403_FORBIDDEN)
        
        order = get_object_or_404(Order, id=order_id)
        action = request.data.get('action')  # 'approve' or 'reject'
        comment = request.data.get('comment', '')
        shipping_charge = request.data.get('shipping_charge', None)
        
        if action not in ['approve', 'reject']:
            return Response({"error": "Invalid action. Must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                if action == 'approve':
                    # Check stock availability (but don't decrement yet)
                    for cart_item in order.items.all():
                        if cart_item.product.stock < cart_item.quantity:
                            return Response({
                                "error": f"Insufficient stock for {cart_item.product.name}. Available: {cart_item.product.stock}, Requested: {cart_item.quantity}"
                            }, status=status.HTTP_400_BAD_REQUEST)
                    
                    # Don't decrement stock here - wait for payment completion
                    order.status = 'approved'
                    comment = comment or "Order approved. Stock will be reserved after payment."
                    if shipping_charge is not None:
                        try:
                            order.shipping_charge = float(shipping_charge)
                        except Exception:
                            order.shipping_charge = 0
                    else:
                        order.shipping_charge = 0
                else:
                    order.status = 'rejected'
                    comment = comment or "Order rejected."
                
                order.admin_comment = comment
                order.decision_time = timezone.now()
                order.save()
            
            return Response({
                "message": f"Order {action}d successfully",
                "order_id": order.id,
                "status": order.status,
                "comment": comment
            })
        except Exception as e:
            return Response({"error": f"Failed to {action} order: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# User order status view
class UserOrderStatusView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        # Get the latest pending/approved/rejected order for the user (exclude completed orders)
        return Order.objects.filter(
            user=self.request.user,
            status__in=['pending', 'approved', 'rejected']
        ).order_by('-created_at').first()

# Checkout view (only for approved orders)
class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if order.status != 'approved':
            return Response({"error": "Order must be approved before checkout"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Clear cart items for this order
            order.items.all().delete()
            
            return Response({
                "message": "Order ready for payment",
                "order_id": order.id,
                "total": order.total
            })
        except Exception as e:
            return Response({"error": f"Failed to process checkout: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RazorpayOrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id):
        print(f"🔍 RazorpayOrderCreateView called with order_id: {order_id}")
        print(f"🔍 Request path: {request.path}")
        print(f"🔍 Request method: {request.method}")
        print(f"🔍 User: {request.user.username}")
        
        # Check if order exists
        try:
            order = Order.objects.get(id=order_id)
            print(f"🔍 Order found: {order.id}, status: {order.status}, user: {order.user.username}")
        except Order.DoesNotExist:
            print(f"🔍 Order {order_id} does not exist")
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if order belongs to user
        if order.user != request.user:
            print(f"🔍 Order {order_id} does not belong to user {request.user.username}")
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if order.status != 'approved':
            return Response({"error": "Order must be approved before payment."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Initialize Razorpay client
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            
            # Calculate total amount (order total + shipping charge)
            total_amount = float(order.total)
            if order.shipping_charge:
                total_amount += float(order.shipping_charge)
            
            # Convert to paise (Razorpay expects amount in paise)
            amount_in_paise = int(total_amount * 100)
            
            # Create Razorpay order data
            data = {
                'amount': amount_in_paise,
                'currency': 'INR',
                'receipt': f'order_{order.id}',
                'notes': {
                    'order_id': str(order.id),
                    'user_id': str(request.user.id)
                }
            }
            
            # Create Razorpay order
            razorpay_order = client.order.create(data=data)
            
            return Response({
                'razorpay_order_id': razorpay_order['id'],
                'amount': razorpay_order['amount'],
                'currency': razorpay_order['currency'],
                'key_id': settings.RAZORPAY_KEY_ID,
                'order_id': order.id,
                'total_amount': total_amount
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to create Razorpay order: {str(e)}',
                'details': 'Please check your Razorpay credentials and try again'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PaymentCompletionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id):
        print(f"[PaymentCompletionView] Called for order_id: {order_id}, user: {request.user}")
        order = get_object_or_404(Order, id=order_id, user=request.user)
        print(f"[PaymentCompletionView] Found order: {order.id}, status: {order.status}, payment_status: {order.payment_status}")
        
        if order.status != 'approved':
            print(f"[PaymentCompletionView] Order status is not 'approved', it is: {order.status}")
            return Response({"error": f"Order must be approved before payment completion. Current status: {order.status}"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Check stock availability one more time before payment completion
                for cart_item in order.items.all():
                    if cart_item.product.stock < cart_item.quantity:
                        print(f"[PaymentCompletionView] Insufficient stock for {cart_item.product.name}")
                        return Response({
                            "error": f"Insufficient stock for {cart_item.product.name}. Available: {cart_item.product.stock}, Requested: {cart_item.quantity}"
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                # Decrement stock only after successful payment
                for cart_item in order.items.all():
                    cart_item.product.stock -= cart_item.quantity
                    cart_item.product.save()
                
                # Mark order as completed
                order.status = 'completed'
                order.payment_status = 'success'
                order.transaction_id = request.data.get('razorpay_payment_id', '')
                order.save()
                print(f"[PaymentCompletionView] Order updated: status={order.status}, payment_status={order.payment_status}, transaction_id={order.transaction_id}")

                # Send payment success email
                user_email = order.user.email
                if user_email:
                    # Sanitize product names and all user-generated fields
                    def safe(val):
                        return remove_non_ascii(str(val))
                    item_lines = "".join([
                        f"<tr><td style='padding:8px;border:1px solid #eee;'>{safe(item.product.name)}</td><td style='padding:8px;border:1px solid #eee;'>{item.quantity}</td><td style='padding:8px;border:1px solid #eee;'>₹{item.product.price}</td><td style='padding:8px;border:1px solid #eee;'>₹{item.product.price * item.quantity}</td></tr>"
                        for item in order.items.all()
                    ])
                    order_address = safe(order.address)
                    order_id = safe(order.id)
                    order_total = safe(order.total)
                    shipping_charge = safe(order.shipping_charge or 0)
                    total_paid = safe(order.total + (order.shipping_charge or 0))
                    order_date = safe(order.created_at.strftime('%d %b %Y, %I:%M %p'))

                    html_message = f"""
                    <div style='font-family:sans-serif;background:#f7fafc;padding:32px;'>
                        <div style='max-width:600px;margin:auto;background:white;border-radius:16px;box-shadow:0 4px 24px #0001;padding:32px;'>
                            <h1 style='color:#22c55e;text-align:center;font-size:2.5rem;margin-bottom:8px;'>Payment Successful!</h1>
                            <p style='text-align:center;font-size:1.2rem;color:#555;margin-bottom:24px;'>Thank you for your purchase from <b>Shree Krishna Beauty Products</b>!</p>
                            <div style='background:#e0f7fa;padding:16px 24px;border-radius:12px;margin-bottom:24px;'>
                                <h2 style='color:#0ea5e9;margin:0 0 8px 0;'>Order #{order_id}</h2>
                                <p style='margin:0;color:#555;'>Placed on: {order_date}
                            </div>
                            <table style='width:100%;border-collapse:collapse;margin-bottom:24px;'>
                                <thead>
                                    <tr style='background:#f3f4f6;'>
                                        <th style='padding:8px;border:1px solid #eee;'>Product</th>
                                        <th style='padding:8px;border:1px solid #eee;'>Qty</th>
                                        <th style='padding:8px;border:1px solid #eee;'>Price</th>
                                        <th style='padding:8px;border:1px solid #eee;'>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item_lines}
                                </tbody>
                            </table>
                            <div style='margin-bottom:24px;'>
                                <p style='font-size:1.1rem;'><b>Subtotal:</b> ₹{order_total}</p>
                                <p style='font-size:1.1rem;'><b>Shipping:</b> ₹{shipping_charge}</p>
                                <p style='font-size:1.3rem;color:#22c55e;'><b>Total Paid:</b> ₹{total_paid}</p>
                            </div>
                            <div style='background:#fef9c3;padding:16px 24px;border-radius:12px;margin-bottom:24px;'>
                                <h3 style='color:#eab308;margin:0 0 8px 0;'>Delivery Address</h3>
                                <p style='margin:0;color:#555;'>{order_address}
                            </div>
                            <div style='text-align:center;margin-top:32px;'>
                                <p style='font-size:1.1rem;color:#555;'>We hope you enjoy your products!<br/>If you have any questions, reply to this email.</p>
                                <p style='font-size:1.5rem;margin-top:16px;'>Thank you for shopping with us!</p>
                            </div>
                        </div>
                    </div>
                    """
                    subject = safe('Payment Successful - Shree Krishna Beauty Products')
                    text_content = safe(f'Thank you for your purchase! Your order #{order_id} was successful.')
                    html_content = safe(html_message.replace('\xa0', ' '))

                    email = EmailMultiAlternatives(
                        subject=subject,
                        body=text_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        to=[user_email],
                    )
                    email.attach_alternative(html_content, "text/html")
                    email.encoding = 'utf-8'
                    email.send(fail_silently=True)
                
                # Return the updated order for debugging
                from .serializers import OrderSerializer
                return Response({
                    "message": "Payment completed successfully and stock updated",
                    "order_id": order.id,
                    "status": order.status,
                    "payment_status": order.payment_status,
                    "order": OrderSerializer(order).data
                })
        except Exception as e:
            print(f"[PaymentCompletionView] Exception: {str(e)}")
            return Response({"error": f"Failed to complete payment: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrderHistoryView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get all orders for the user, limited to 20 most recent
        return Order.objects.filter(
            user=self.request.user
        ).order_by('-created_at')[:20]

@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """
    Handle Razorpay webhooks for payment events
    """
    permission_classes = [permissions.AllowAny]  # Allow webhooks without authentication
    
    def post(self, request):
        logger.info("=== RAZORPAY WEBHOOK RECEIVED ===")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Request URL: {request.build_absolute_uri()}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"Content-Length: {len(request.body)}")
        logger.debug(f"All headers: {dict(request.headers)}")
        
        # Get the webhook signature
        signature = request.headers.get('X-Razorpay-Signature')
        if not signature:
            logger.error("❌ No X-Razorpay-Signature found in webhook headers")
            logger.error(f"Available headers: {list(request.headers.keys())}")
            return HttpResponse(status=400)
        
        logger.info(f"✅ Webhook signature found: {signature[:20]}...")
        
        # Get the webhook body
        webhook_body = request.body
        logger.debug(f"Webhook body length: {len(webhook_body)}")
        logger.debug(f"Webhook body preview: {webhook_body[:200]}...")
        
        try:
            # Initialize Razorpay client
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            logger.info(f"✅ Razorpay client initialized with key: {settings.RAZORPAY_KEY_ID[:10]}...")
            
            # Verify webhook signature
            client.utility.verify_webhook_signature(
                webhook_body, signature, settings.RAZORPAY_WEBHOOK_SECRET
            )
            logger.info("✅ Webhook signature verification successful")
            
            # Parse the webhook data
            webhook_data = json.loads(webhook_body)
            event = webhook_data.get('event')
            payload = webhook_data.get('payload', {})
            
            logger.info(f"🎯 Processing webhook event: {event}")
            logger.debug(f"📦 Webhook payload: {json.dumps(payload, indent=2)}")
            
            # Handle different events
            if event == 'payment.captured':
                logger.info("💰 Handling payment.captured event")
                self.handle_payment_captured(payload)
            elif event == 'payment.failed':
                logger.info("❌ Handling payment.failed event")
                self.handle_payment_failed(payload)
            elif event == 'order.paid':
                logger.info("✅ Handling order.paid event")
                self.handle_order_paid(payload)
            else:
                logger.warning(f"⚠️ Unhandled webhook event: {event}")
                logger.warning(f"Available events in payload: {list(webhook_data.keys())}")
            
            logger.info("✅ Webhook processed successfully")
            return HttpResponse(status=200)
            
        except Exception as e:
            logger.error(f"❌ Error processing webhook: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return HttpResponse(status=400)
    
    def handle_payment_captured(self, payload):
        """Handle successful payment capture"""
        try:
            payment_entity = payload['payment']['entity']
            payment_id = payment_entity['id']
            order_id = payment_entity.get('notes', {}).get('order_id')
            
            logger.info(f"Payment captured - Payment ID: {payment_id}, Order ID: {order_id}")
            
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.payment_status = 'success'
                    order.transaction_id = payment_id
                    order.status = 'completed'
                    order.save()
                    
                    logger.info(f"Order {order_id} updated to completed status")
                    
                    # Send success email
                    self.send_payment_success_email(order)
                    
                except Order.DoesNotExist:
                    logger.error(f"Order {order_id} not found in database")
                    
        except Exception as e:
            logger.error(f"Error handling payment captured: {str(e)}")
    
    def handle_payment_failed(self, payload):
        """Handle failed payment"""
        try:
            payment_entity = payload['payment']['entity']
            payment_id = payment_entity['id']
            order_id = payment_entity.get('notes', {}).get('order_id')
            
            logger.info(f"Payment failed - Payment ID: {payment_id}, Order ID: {order_id}")
            
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.payment_status = 'failed'
                    order.save()
                    
                    logger.info(f"Order {order_id} updated to failed status")
                    
                    # Send failure email
                    self.send_payment_failure_email(order)
                    
                except Order.DoesNotExist:
                    logger.error(f"Order {order_id} not found in database")
                    
        except Exception as e:
            logger.error(f"Error handling payment failed: {str(e)}")
    
    def handle_order_paid(self, payload):
        """Handle order paid event"""
        try:
            order_entity = payload['order']['entity']
            order_id = order_entity.get('notes', {}).get('order_id')
            
            logger.info(f"Order paid - Order ID: {order_id}")
            
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    order.payment_status = 'success'
                    order.status = 'completed'
                    order.save()
                    
                    logger.info(f"Order {order_id} updated to completed status")
                    
                except Order.DoesNotExist:
                    logger.error(f"Order {order_id} not found in database")
                    
        except Exception as e:
            logger.error(f"Error handling order paid: {str(e)}")
    
    def send_payment_success_email(self, order):
        """Send payment success email"""
        try:
            user_email = order.user.email
            if user_email:
                subject = f"Payment Successful - Order #{order.id}"
                html_message = f"""
                <div style='font-family:sans-serif;background:#f7fafc;padding:32px;'>
                    <div style='max-width:600px;margin:auto;background:white;border-radius:16px;box-shadow:0 4px 24px #0001;padding:32px;'>
                        <h1 style='color:#22c55e;text-align:center;font-size:2.5rem;margin-bottom:8px;'>Payment Successful!</h1>
                        <p style='text-align:center;font-size:1.2rem;color:#555;margin-bottom:24px;'>Thank you for your purchase!</p>
                        <div style='background:#e0f7fa;padding:16px 24px;border-radius:12px;margin-bottom:24px;'>
                            <h2 style='color:#0ea5e9;margin:0 0 8px 0;'>Order #{order.id}</h2>
                            <p style='margin:0;color:#555;'>Transaction ID: {order.transaction_id}</p>
                        </div>
                        <p style='text-align:center;color:#555;'>Your order has been confirmed and will be processed soon.</p>
                    </div>
                </div>
                """
                
                send_mail(
                    subject=subject,
                    message="",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user_email],
                    html_message=html_message
                )
                logger.info(f"Payment success email sent to {user_email}")
                
        except Exception as e:
            logger.error(f"Error sending payment success email: {str(e)}")
    
    def send_payment_failure_email(self, order):
        """Send payment failure email"""
        try:
            user_email = order.user.email
            if user_email:
                subject = f"Payment Failed - Order #{order.id}"
                html_message = f"""
                <div style='font-family:sans-serif;background:#f7fafc;padding:32px;'>
                    <div style='max-width:600px;margin:auto;background:white;border-radius:16px;box-shadow:0 4px 24px #0001;padding:32px;'>
                        <h1 style='color:#ef4444;text-align:center;font-size:2.5rem;margin-bottom:8px;'>Payment Failed</h1>
                        <p style='text-align:center;font-size:1.2rem;color:#555;margin-bottom:24px;'>We couldn't process your payment.</p>
                        <div style='background:#fef2f2;padding:16px 24px;border-radius:12px;margin-bottom:24px;'>
                            <h2 style='color:#dc2626;margin:0 0 8px 0;'>Order #{order.id}</h2>
                            <p style='margin:0;color:#555;'>Please try again or contact support.</p>
                        </div>
                        <p style='text-align:center;color:#555;'>You can retry the payment from your order history.</p>
                    </div>
                </div>
                """
                
                send_mail(
                    subject=subject,
                    message="",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[user_email],
                    html_message=html_message
                )
                logger.info(f"Payment failure email sent to {user_email}")
                
        except Exception as e:
            logger.error(f"Error sending payment failure email: {str(e)}")
