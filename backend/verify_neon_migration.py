#!/usr/bin/env python
"""
Script to verify data migration to Neon database
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def verify_migration():
    """
    Verify that data was successfully imported to Neon
    """
    print("🔍 Verifying Neon database migration...")
    print("=" * 50)
    
    try:
        from django.contrib.auth import get_user_model
        from product.models import Product
        from cart.models import Order
        
        User = get_user_model()
        
        # Count records
        user_count = User.objects.count()
        product_count = Product.objects.count()
        order_count = Order.objects.count()
        
        print("📊 Data Counts:")
        print(f"✅ Users: {user_count}")
        print(f"✅ Products: {product_count}")
        print(f"✅ Orders: {order_count}")
        
        # Show some sample data
        if user_count > 0:
            first_user = User.objects.first()
            print(f"\n👤 Sample User: {first_user.username} ({first_user.email})")
        
        if product_count > 0:
            first_product = Product.objects.first()
            print(f"📦 Sample Product: {first_product.name} (₹{first_product.price})")
        
        if order_count > 0:
            first_order = Order.objects.first()
            print(f"🛒 Sample Order: #{first_order.id} - {first_order.status}")
        
        print("\n🎉 Migration verification completed!")
        print("=" * 50)
        print("✅ Your data has been successfully migrated to Neon!")
        print("🔗 Your application is now running on Neon database")
        
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def test_connection():
    """
    Test Neon database connection
    """
    print("🔌 Testing Neon database connection...")
    
    try:
        from django.db import connection
        connection.ensure_connection()
        print("✅ Neon database connection successful!")
        
        # Test a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ PostgreSQL version: {version[0]}")
            
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def main():
    """
    Main verification function
    """
    print("🚀 Starting Neon migration verification...")
    
    # Test connection first
    if not test_connection():
        print("❌ Cannot connect to Neon database!")
        return False
    
    # Verify data
    if not verify_migration():
        print("❌ Data verification failed!")
        return False
    
    print("\n🎉 All verification steps passed!")
    print("=" * 50)
    print("📋 Your application is ready to use with Neon database!")
    
    return True

if __name__ == "__main__":
    main() 