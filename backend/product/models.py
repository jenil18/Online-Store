from django.db import models

# Create your models here.

class Product(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/')
    description = models.TextField(blank=True, null=True)
    stock = models.PositiveIntegerField(default=0, help_text="Available quantity in stock")
    original_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="MRP (Original Price)")
    discount_percent = models.PositiveIntegerField(help_text="Discount percentage (e.g., 79 for 79%)")
    discounted_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price after discount")

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return ''
 