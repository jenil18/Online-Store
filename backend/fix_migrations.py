#!/usr/bin/env python
import os
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def add_missing_columns():
    """Add missing columns to the product table"""
    with connection.cursor() as cursor:
        # Check if columns exist and add them if they don't
        try:
            # Add brand column
            cursor.execute("""
                ALTER TABLE product_product 
                ADD COLUMN IF NOT EXISTS brand VARCHAR(50) DEFAULT 'Orane'
            """)
            
            # Add original_price column
            cursor.execute("""
                ALTER TABLE product_product 
                ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT 0
            """)
            
            # Add discount_percent column
            cursor.execute("""
                ALTER TABLE product_product 
                ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0
            """)
            
            # Add discounted_price column
            cursor.execute("""
                ALTER TABLE product_product 
                ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10,2) DEFAULT 0
            """)
            
            print("✅ Successfully added missing columns to product table")
            
        except Exception as e:
            print(f"❌ Error adding columns: {e}")

if __name__ == "__main__":
    add_missing_columns() 