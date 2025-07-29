from django.urls import path
from .views import (
    CartListCreateView, CartItemUpdateDeleteView, OrderListCreateView, 
    OrderDetailView, AdminOrderListView, AdminOrderApprovalView, 
    UserOrderStatusView, CheckoutView, RazorpayOrderCreateView, 
    PaymentCompletionView, RazorpayWebhookView
)

urlpatterns = [
    path('cart/', CartListCreateView.as_view(), name='cart-list-create'),
    path('cart/<int:pk>/', CartItemUpdateDeleteView.as_view(), name='cart-item-detail'),
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('admin/orders/', AdminOrderListView.as_view(), name='admin-order-list'),
    path('admin/orders/<int:order_id>/approve/', AdminOrderApprovalView.as_view(), name='admin-order-approval'),
    path('order-status/', UserOrderStatusView.as_view(), name='user-order-status'),
    path('checkout/<int:order_id>/', CheckoutView.as_view(), name='checkout'),
    path('orders/<int:order_id>/razorpay-order/', RazorpayOrderCreateView.as_view(), name='razorpay-order-create'),
    path('orders/<int:order_id>/complete-payment/', PaymentCompletionView.as_view(), name='payment-completion'),
    path('webhook/razorpay/', RazorpayWebhookView.as_view(), name='razorpay-webhook'),
] 