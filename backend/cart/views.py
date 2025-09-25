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
    """Remove non-ASCII characters from text, but preserve important symbols like ₹"""
    # Define characters to preserve
    preserve_chars = {'₹'}  # Rupee symbol
    
    result = ''
    for char in text:
        # Keep ASCII characters (ord < 128)
        if ord(char) < 128:
            result += char
        # Keep specific important Unicode characters
        elif char in preserve_chars:
            result += char
        # Replace other non-ASCII characters with space
        else:
            result += ' '
    return result

def send_order_approval_email(order):
    """Send order approval email"""
    try:
        user_email = order.user.email
        if user_email:
            # Sanitize fields
            def safe(val):
                return remove_non_ascii(str(val))
            
            order_id = safe(order.id)
            # Convert UTC to IST (UTC+5:30)
            ist_time = order.created_at + timezone.timedelta(hours=5, minutes=30)
            order_date = safe(ist_time.strftime('%d %b %Y, %I:%M %p'))
            
            # Calculate product total and shipping charge
            product_total = safe(order.total)
            shipping_charge = safe(order.shipping_charge if order.shipping_charge else 0)
            order_total = float(order.total) + float(order.shipping_charge if order.shipping_charge else 0)
            order_total = safe(str(order_total))
            
            subject = safe(f'Order Approved - Order #{order_id}')
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Approved</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Order Approved!</h1>
                        <p style="color: #ffffff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">Your order has been approved by our team.</p>
                    </div>
                    
                    <!-- Order Details -->
                    <div style="padding: 30px; background-color: #f0f9ff; margin: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                        <h2 style="color: #0ea5e9; font-size: 20px; margin: 0 0 8px 0; font-weight: 600;">Order #{order_id}</h2>
                        <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Placed on:</strong> {order_date}</p>
                        <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; margin: 10px 0;">
                            <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Product Total:</strong> ₹{product_total}</p>
                            <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Shipping Charge:</strong> ₹{shipping_charge}</p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 8px 0;">
                            <p style="color: #0ea5e9; margin: 5px 0; font-size: 16px; font-weight: 600;"><strong>Total Amount:</strong> ₹{order_total}</p>
                        </div>
                    </div>
                    
                    <!-- Approval Message -->
                    <div style="padding: 0 30px 20px 30px;">
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
                            <h3 style="color: #16a34a; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">✅ Order Approved!</h3>
                            <p style="color: #374151; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
                                Great news! Your order has been reviewed and approved by our team. 
                                All items are in stock and ready for processing.
                            </p>
                            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                                <strong>Next Step:</strong> Please complete your payment as soon as possible to proceed with your order.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Payment Instructions -->
                    <div style="padding: 0 30px 20px 30px;">
                        <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; border: 1px solid #fde047;">
                            <h3 style="color: #eab308; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">💳 Complete Your Payment</h3>
                            <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center;">
                                <span style="color: #374151; font-size: 16px; line-height: 1.6; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                                    <strong>1.</strong> Visit "Orders" page
                                </span>
                                <span style="color: #374151; font-size: 16px; line-height: 1.6; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                                    <strong>2.</strong> Complete your payment
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="padding: 30px; text-align: center; background-color: #f8fafc;">
                        <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
                            Thank you for choosing <strong>Shree Krishna Beauty Products</strong>!
                        </p>
                        <p style="color: #0ea5e9; font-size: 20px; font-weight: 700; margin: 0;">
                            We're excited to fulfill your order!
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = safe(f'Your order #{order_id} has been approved! Please complete your payment to proceed.')
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
            
            logger.info(f"Order approval email sent to {user_email}")
            
    except Exception as e:
        logger.error(f"Error sending order approval email: {str(e)}")

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
                
                print(f"🔍 Order created with ID: {order.id}")
                
                # Create NEW cart items specifically for this order (copies, not references)
                order_cart_items = []
                for i, cart_item in enumerate(cart_items_to_create):
                    # Create a new cart item specifically for this order
                    order_cart_item = CartItem(
                        user=self.request.user,
                        product=cart_item.product,
                        quantity=cart_item.quantity
                    )
                    order_cart_item.save()
                    order_cart_items.append(order_cart_item)
                    print(f"🔍 Order CartItem {i+1} saved with ID: {order_cart_item.id}, Product: {order_cart_item.product.name}, Qty: {order_cart_item.quantity}")
                
                # Associate the order-specific cart items with the order
                order.items.set(order_cart_items)
                print(f"🔍 Associated {len(order_cart_items)} order cart items with order {order.id}")
                
                # Verify the association
                associated_items = order.items.all()
                print(f"🔍 Order {order.id} now has {associated_items.count()} associated items")
                for item in associated_items:
                    print(f"🔍 Associated item: {item.product.name} x {item.quantity}")
                
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
                    
                    # Send approval email
                    # send_order_approval_email(order)
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
                    # Convert UTC to IST (UTC+5:30)
                    ist_time = order.created_at + timezone.timedelta(hours=5, minutes=30)
                    order_date = safe(ist_time.strftime('%d %b %Y, %I:%M %p'))
                    transaction_id = safe(order.transaction_id or 'N/A')

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
                                <p style='font-size:1.1rem;'><b>Subtotal : </b> ₹{order_total}</p>
                                <p style='font-size:1.1rem;'><b>Shipping : </b> ₹{shipping_charge}</p>
                                <p style='font-size:1.3rem;color:#22c55e;'><b>Total Paid : </b> ₹{total_paid}</p>
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
            
            # Convert webhook body to string for signature verification
            webhook_body_str = webhook_body.decode('utf-8')
            
            # Verify webhook signature
            client.utility.verify_webhook_signature(
                webhook_body_str, signature, settings.RAZORPAY_WEBHOOK_SECRET
            )
            logger.info("✅ Webhook signature verification successful")
            
            # Parse the webhook data
            webhook_data = json.loads(webhook_body_str)
            event = webhook_data.get('event')
            payload = webhook_data.get('payload', {})
            
            logger.info(f"🎯 Processing webhook event: {event}")
            logger.info(f"📦 Event ID: {webhook_data.get('id', 'N/A')}")
            logger.info(f"📦 Account ID: {webhook_data.get('account_id', 'N/A')}")
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
            elif event == 'payment.authorized':
                logger.info("🔐 Handling payment.authorized event")
                self.handle_payment_authorized(payload)
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
    
    def handle_payment_authorized(self, payload):
        """Handle payment authorization (payment is authorized but not yet captured)"""
        try:
            payment_entity = payload['payment']['entity']
            payment_id = payment_entity['id']
            order_id = payment_entity.get('notes', {}).get('order_id')
            
            logger.info(f"Payment authorized - Payment ID: {payment_id}, Order ID: {order_id}")
            
            if order_id:
                try:
                    order = Order.objects.get(id=order_id)
                    # Don't change order status yet, just log the authorization
                    logger.info(f"Order {order_id} payment authorized but not yet captured")
                    
                except Order.DoesNotExist:
                    logger.error(f"Order {order_id} not found in database")
                    
        except Exception as e:
            logger.error(f"Error handling payment authorized: {str(e)}")
    
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
                    # self.send_payment_success_email(order)
                    
                    # Clear cart items for the order
                    order.items.all().delete()
                    logger.info(f"Cart items for order {order_id} cleared.")
                    
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
                    # self.send_payment_failure_email(order)
                    
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
                    
                    # No email sent for order.paid event
                    # Email is only sent on payment.captured event
                    
                except Order.DoesNotExist:
                    logger.error(f"Order {order_id} not found in database")
                    
        except Exception as e:
            logger.error(f"Error handling order paid: {str(e)}")
    
    def send_payment_success_email(self, order):
        """Send payment success email"""
        try:
            user_email = order.user.email
            if user_email:
                # Sanitize product names and all user-generated fields
                def safe(val):
                    return remove_non_ascii(str(val))
                
                # Get order items through the ManyToMany relationship
                order_items = order.items.all()
                
                # Debug logging
                logger.info(f"🔍 Order {order.id} has {order_items.count()} items")
                logger.info(f"🔍 Order status: {order.status}, payment_status: {order.payment_status}")
                logger.info(f"🔍 Order user: {order.user.username}")
                
                for item in order_items:
                    logger.info(f"🔍 Item: {item.product.name} x {item.quantity} = ₹{item.product.price * item.quantity}")
                
                # If no items found through ManyToMany, try alternative approach
                if not order_items.exists():
                    logger.warning(f"⚠️ No items found through ManyToMany for order {order.id}, trying alternative approach")
                    
                    # First, let's check if there are any cart items for this user
                    user_cart_items = CartItem.objects.filter(user=order.user)
                    logger.info(f"🔍 User {order.user.username} has {user_cart_items.count()} total cart items")
                    
                    # Try to get cart items directly for this user that might be associated with this order
                    from django.db import connection
                    with connection.cursor() as cursor:
                        cursor.execute("""
                            SELECT ci.id, ci.quantity, p.name, p.price 
                            FROM cart_cartitem ci 
                            JOIN product_product p ON ci.product_id = p.id 
                            JOIN cart_order_items oi ON ci.id = oi.cartitem_id 
                            WHERE oi.order_id = %s
                        """, [order.id])
                        items_data = cursor.fetchall()
                        logger.info(f"🔍 Found {len(items_data)} items through direct query")
                        
                        # Also check the junction table directly
                        cursor.execute("SELECT cartitem_id FROM cart_order_items WHERE order_id = %s", [order.id])
                        junction_items = cursor.fetchall()
                        logger.info(f"🔍 Junction table has {len(junction_items)} entries for order {order.id}")
                        
                        # Create item lines from direct query results
                        item_lines = "".join([
                            f"<tr><td style='padding:12px;border:1px solid #e5e7eb;text-align:left;'>{safe(item_data[2])}</td><td style='padding:12px;border:1px solid #e5e7eb;text-align:center;'>{item_data[1]}</td><td style='padding:12px;border:1px solid #e5e7eb;text-align:right;'>₹{item_data[3]}</td><td style='padding:12px;border:1px solid #e5e7eb;text-align:right;'>₹{item_data[3] * item_data[1]}</td></tr>"
                            for item_data in items_data
                        ])
                else:
                    item_lines = "".join([
                        f"<tr><td style='padding:12px;border:1px solid #e5e7eb;text-align:left;'>{safe(cart_item.product.name)}</td><td style='padding:12px;border:1px solid #e5e7eb;text-align:center;'>{cart_item.quantity}</td><td style='padding:12px;border:1px solid #e5e7eb;text-align:right;'>₹{cart_item.product.price}</td><td style='padding:12px;border:1px solid #e5e7eb;text-align:right;'>₹{cart_item.product.price * cart_item.quantity}</td></tr>"
                        for cart_item in order_items
                    ])
                
                # Debug logging for item_lines
                logger.info(f"🔍 Generated item_lines length: {len(item_lines)}")
                logger.info(f"🔍 Item_lines content: {item_lines[:200]}...")
                
                order_address = safe(order.address)
                order_id = safe(order.id)
                order_total = safe(order.total)
                shipping_charge = safe(order.shipping_charge or 0)
                total_paid = safe(order.total + (order.shipping_charge or 0))
                # Convert UTC to IST (UTC+5:30)
                ist_time = order.created_at + timezone.timedelta(hours=5, minutes=30)
                order_date = safe(ist_time.strftime('%d %b %Y, %I:%M %p'))
                transaction_id = safe(order.transaction_id or 'N/A')

                html_message = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Payment Successful</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Payment Successful!</h1>
                            <p style="color: #ffffff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">Thank you for your purchase from <strong>Shree Krishna Beauty Products</strong>!</p>
                        </div>
                        
                        <!-- Order Details -->
                        <div style="padding: 30px; background-color: #f0f9ff; margin: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                            <h2 style="color: #0ea5e9; font-size: 20px; margin: 0 0 8px 0; font-weight: 600;">Order #{order_id}</h2>
                            <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Placed on:</strong> {order_date}</p>
                            <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Transaction ID:</strong> {transaction_id}</p>
                        </div>
                        
                        <!-- Products Table -->
                        <div style="padding: 0 30px;">
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                                <thead>
                                    <tr style="background-color: #f9fafb;">
                                        <th style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; font-weight: 600; color: #374151; font-size: 14px;">Product</th>
                                        <th style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #374151; font-size: 14px;">Qty</th>
                                        <th style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Price</th>
                                        <th style="padding: 15px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #374151; font-size: 14px;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item_lines}
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Cost Summary -->
                        <div style="padding: 0 30px 20px 30px;">
                            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: #374151; font-size: 16px;">Subtotal : </span>
                                    <span style="color: #374151; font-size: 16px; font-weight: 600;">₹{order_total}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="color: #374151; font-size: 16px;">Shipping : </span>
                                    <span style="color: #374151; font-size: 16px; font-weight: 600;">₹{shipping_charge}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #e5e7eb; margin-top: 12px;">
                                    <span style="color: #22c55e; font-size: 18px; font-weight: 700;">Total Paid : </span>
                                    <span style="color: #22c55e; font-size: 18px; font-weight: 700;">₹{total_paid}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Delivery Address -->
                        <div style="padding: 0 30px 20px 30px;">
                            <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; border-left: 4px solid #eab308;">
                                <h3 style="color: #eab308; font-size: 18px; margin: 0 0 10px 0; font-weight: 600;">Delivery Address</h3>
                                <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.5;">{order_address}</p>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="padding: 30px; text-align: center; background-color: #f8fafc;">
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">We hope you enjoy your products!<br>If you have any questions, reply to this email.</p>
                            <p style="color: #22c55e; font-size: 24px; font-weight: 700; margin: 0;">Thank you for shopping with us!</p>
                        </div>
                    </div>
                </body>
                </html>
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
                
                logger.info(f"Payment success email sent to {user_email}")
                
        except Exception as e:
            logger.error(f"Error sending payment success email: {str(e)}")
    
    def send_payment_failure_email(self, order):
        """Send payment failure email"""
        try:
            user_email = order.user.email
            if user_email:
                # Sanitize fields
                def safe(val):
                    return remove_non_ascii(str(val))
                
                order_id = safe(order.id)
                # Convert UTC to IST (UTC+5:30)
                ist_time = order.created_at + timezone.timedelta(hours=5, minutes=30)
                order_date = safe(ist_time.strftime('%d %b %Y, %I:%M %p IST'))
                order_total = safe(order.total)
                
                subject = safe(f'Payment Failed - Order #{order_id}')
                html_message = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Payment Failed</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Payment Failed</h1>
                            <p style="color: #ffffff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9;">We couldn't process your payment for this order.</p>
                        </div>
                        
                        <!-- Order Details -->
                        <div style="padding: 30px; background-color: #fef2f2; margin: 20px; border-radius: 8px; border-left: 4px solid #dc2626;">
                            <h2 style="color: #dc2626; font-size: 20px; margin: 0 0 8px 0; font-weight: 600;">Order #{order_id}</h2>
                            <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Placed on:</strong> {order_date}</p>
                            <p style="color: #374151; margin: 5px 0; font-size: 14px;"><strong>Order Total:</strong> ₹{order_total}</p>
                        </div>
                        
                        <!-- Failure Message -->
                        <div style="padding: 0 30px 20px 30px;">
                            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca;">
                                <h3 style="color: #dc2626; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">What happened?</h3>
                                <p style="color: #374151; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
                                    Your payment could not be processed. This could be due to:
                                </p>
                                <ul style="color: #374151; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                                    <li>Insufficient funds in your account</li>
                                    <li>Card details entered incorrectly</li>
                                    <li>Network connectivity issues</li>
                                    <li>Bank declined the transaction</li>
                                </ul>
                                <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                                    <strong>Don't worry!</strong> Your order is still saved and you can retry the payment.
                                </p>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div style="padding: 0 30px 20px 30px;">
                            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border: 1px solid #0ea5e9;">
                                <h3 style="color: #0ea5e9; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">What can you do?</h3>
                                <div style="display: flex; flex-direction: column; gap: 10px;">
                                    <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                                        <strong>1.</strong> Check your payment method and try again
                                    </p>
                                    <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                                        <strong>2.</strong> Visit your order history to retry payment
                                    </p>
                                    <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
                                        <strong>3.</strong> Contact our support team if the issue persists
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="padding: 30px; text-align: center; background-color: #f8fafc;">
                            <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0; line-height: 1.6;">
                                Need help? Reply to this email or contact our support team.
                            </p>
                            <p style="color: #0ea5e9; font-size: 20px; font-weight: 700; margin: 0;">
                                We're here to help!
                            </p>
                        </div>
                    </div>
                </body>
                </html>
                """
                
                text_content = safe(f'Your payment for order #{order_id} failed. Please try again or contact support.')
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
                
                logger.info(f"Payment failure email sent to {user_email}")
                
        except Exception as e:
            logger.error(f"Error sending payment failure email: {str(e)}")
