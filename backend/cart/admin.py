from django.contrib import admin
from .models import CartItem, Order
from django.utils import timezone

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'quantity', 'added_at')
    search_fields = ('user__username', 'product__name')
    list_filter = ('user', 'product')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total', 'status', 'payment_status', 'created_at', 'decision_time')
    search_fields = ('user__username', 'transaction_id', 'address')
    list_filter = ('status', 'payment_status', 'created_at')
    readonly_fields = ('created_at', 'updated_at', 'decision_time')
    
    actions = ['approve_orders', 'reject_orders']
    
    def approve_orders(self, request, queryset):
        updated = queryset.update(
            status='approved',
            decision_time=timezone.now()
        )
        self.message_user(request, f'{updated} orders were successfully approved.')
    approve_orders.short_description = "Approve selected orders"
    
    def reject_orders(self, request, queryset):
        updated = queryset.update(
            status='rejected',
            decision_time=timezone.now()
        )
        self.message_user(request, f'{updated} orders were successfully rejected.')
    reject_orders.short_description = "Reject selected orders"
