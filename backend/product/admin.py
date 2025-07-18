from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'original_price', 'discount_percent', 'discounted_price', 'price', 'stock')
    search_fields = ('name', 'category')
    list_filter = ('category',)
    fields = ('name', 'category', 'original_price', 'discount_percent', 'discounted_price', 'price', 'image', 'stock', 'description')
 