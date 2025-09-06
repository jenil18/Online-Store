from rest_framework import serializers
from .models import CartItem, Order
from product.models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'price', 'image', 'stock']

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'added_at']

class OrderSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    shipping_charge = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'user_username','user_name', 'user_phone', 'items', 'total', 'payment_status', 'transaction_id', 'created_at', 'status', 'address', 'admin_comment', 'decision_time', 'shipping_charge']
        read_only_fields = ['user','user_name', 'user_phone', 'total', 'payment_status', 'transaction_id', 'created_at', 'status', 'admin_comment', 'decision_time' , 'shipping_charge'] 