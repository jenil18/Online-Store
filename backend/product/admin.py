from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'category', 'original_price', 'discount_percent', 'discounted_price', 'price', 'stock')
    search_fields = ('name', 'category', 'brand')
    list_filter = ('brand', 'category')
    fields = ('name', 'brand', 'category', 'original_price', 'discount_percent', 'discounted_price', 'price', 'image', 'stock', 'description')
    readonly_fields = ('discounted_price', 'price')
 