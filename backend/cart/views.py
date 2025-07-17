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

# Create your views here.

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
                    item_lines = "".join([
                        f"<tr><td style='padding:8px;border:1px solid #eee;'>{item.product.name}</td><td style='padding:8px;border:1px solid #eee;'>{item.quantity}</td><td style='padding:8px;border:1px solid #eee;'>₹{item.product.price}</td><td style='padding:8px;border:1px solid #eee;'>₹{item.product.price * item.quantity}</td></tr>"
                        for item in order.items.all()
                    ])
                    html_message = f"""
                    <div style='font-family:sans-serif;background:#f7fafc;padding:32px;'>
                        <div style='max-width:600px;margin:auto;background:white;border-radius:16px;box-shadow:0 4px 24px #0001;padding:32px;'>
                            <h1 style='color:#22c55e;text-align:center;font-size:2.5rem;margin-bottom:8px;'>Payment Successful!</h1>
                            <p style='text-align:center;font-size:1.2rem;color:#555;margin-bottom:24px;'>Thank you for your purchase from <b>Shree Krishna Beauty Products</b>!</p>
                            <div style='background:#e0f7fa;padding:16px 24px;border-radius:12px;margin-bottom:24px;'>
                                <h2 style='color:#0ea5e9;margin:0 0 8px 0;'>Order #{order.id}</h2>
                                <p style='margin:0;color:#555;'>Placed on: {order.created_at.strftime('%d %b %Y, %I:%M %p')}</p>
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
                                <p style='font-size:1.1rem;'><b>Subtotal:</b> ₹{order.total}</p>
                                <p style='font-size:1.1rem;'><b>Shipping:</b> ₹{order.shipping_charge or 0}</p>
                                <p style='font-size:1.3rem;color:#22c55e;'><b>Total Paid:</b> ₹{order.total + (order.shipping_charge or 0)}</p>
                            </div>
                            <div style='background:#fef9c3;padding:16px 24px;border-radius:12px;margin-bottom:24px;'>
                                <h3 style='color:#eab308;margin:0 0 8px 0;'>Delivery Address</h3>
                                <p style='margin:0;color:#555;'>{order.address}</p>
                            </div>
                            <div style='text-align:center;margin-top:32px;'>
                                <p style='font-size:1.1rem;color:#555;'>We hope you enjoy your products!<br/>If you have any questions, reply to this email.</p>
                                <p style='font-size:1.5rem;margin-top:16px;'>Thank you for shopping with us!</p>
                            </div>
                        </div>
                    </div>
                    """
                    send_mail(
                        subject='Payment Successful - Shree Krishna Beauty Products',
                        message=f'Thank you for your purchase! Your order #{order.id} was successful.',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user_email],
                        fail_silently=True,
                        html_message=html_message
                    )
                
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
