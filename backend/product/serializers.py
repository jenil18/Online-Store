from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'original_price', 'discount_percent', 'discounted_price', 'price', 'image', 'stock', 'description', 'image_url']

    def get_image_url(self, obj):
        return obj.image_url
