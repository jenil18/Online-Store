#!/usr/bin/env python
"""
Script to export data from Render PostgreSQL and import to Neon database
"""
import os
import sys
import django
import json
from django.core.management import execute_from_command_line

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def export_data_from_render():
    """
    Export data from Render PostgreSQL database
    """
    print("🔄 Starting data export from Render PostgreSQL...")
    
    try:
        # Export all data to JSON, excluding some system tables
        execute_from_command_line([
            'manage.py', 'dumpdata',
            '--exclude', 'contenttypes',
            '--exclude', 'auth.Permission',
            '--exclude', 'admin.LogEntry',
            '--exclude', 'sessions.Session',
            '--indent', '2',
            '-o', 'render_data_backup.json'
        ])
        
        print("✅ Data exported successfully to render_data_backup.json")
        print(f"📁 File size: {os.path.getsize('render_data_backup.json') / 1024:.2f} KB")
        
        return True
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        return False

def import_data_to_neon():
    """
    Import data to Neon database
    """
    print("\n🔄 Starting data import to Neon database...")
    
    try:
        # Import the data
        execute_from_command_line([
            'manage.py', 'loaddata', 'render_data_backup.json'
        ])
        
        print("✅ Data imported successfully to Neon database!")
        return True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def verify_data():
    """
    Verify that data was imported correctly
    """
    print("\n🔍 Verifying imported data...")
    
    try:
        from django.contrib.auth import get_user_model
        from product.models import Product
        from cart.models import Order
        
        User = get_user_model()
        
        # Count records
        user_count = User.objects.count()
        product_count = Product.objects.count()
        order_count = Order.objects.count()
        
        print(f"✅ Users: {user_count}")
        print(f"✅ Products: {product_count}")
        print(f"✅ Orders: {order_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

def main():
    """
    Main migration function
    """
    print("🚀 Starting Render PostgreSQL to Neon migration...")
    print("=" * 50)
    
    # Step 1: Export from Render
    if not export_data_from_render():
        print("❌ Migration failed at export step")
        return False
    
    # Step 2: Import to Neon
    if not import_data_to_neon():
        print("❌ Migration failed at import step")
        return False
    
    # Step 3: Verify data
    if not verify_data():
        print("❌ Migration failed at verification step")
        return False
    
    print("\n🎉 Migration completed successfully!")
    print("=" * 50)
    print("📊 Your data has been successfully migrated from Render to Neon")
    print("🔗 You can now use your application with the new Neon database")
    
    return True

if __name__ == "__main__":
    main() 