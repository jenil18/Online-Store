from django.core.management.base import BaseCommand
from authentication.models import User
from product.models import Product
from cart.models import CartItem, Order
from django.db import connection

class Command(BaseCommand):
    help = 'Delete all users, products, cart items, and orders, and reset IDs.'

    def handle(self, *args, **kwargs):
        User.objects.all().delete()
        Product.objects.all().delete()
        CartItem.objects.all().delete()
        Order.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('All data deleted.'))

        with connection.cursor() as cursor:
            cursor.execute("ALTER SEQUENCE authentication_user_id_seq RESTART WITH 1;")
            cursor.execute("ALTER SEQUENCE product_product_id_seq RESTART WITH 1;")
            cursor.execute("ALTER SEQUENCE cart_cartitem_id_seq RESTART WITH 1;")
            cursor.execute("ALTER SEQUENCE cart_order_id_seq RESTART WITH 1;")
        self.stdout.write(self.style.SUCCESS('Auto-increment IDs reset.')) 