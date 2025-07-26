#!/usr/bin/env python
"""
Test script to verify database connection and environment variables
"""
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_connection():
    """Test database connection and show environment variables"""
    print("=== Environment Variables ===")
    print(f"DB_NAME: {os.getenv('DB_NAME', 'NOT SET')}")
    print(f"DB_USER: {os.getenv('DB_USER', 'NOT SET')}")
    print(f"DB_PASSWORD: {'SET' if os.getenv('DB_PASSWORD') else 'NOT SET'}")
    print(f"DB_HOST: {os.getenv('DB_HOST', 'NOT SET')}")
    print(f"DB_PORT: {os.getenv('DB_PORT', 'NOT SET')}")
    
    print("\n=== Database Settings ===")
    db_settings = settings.DATABASES['default']
    print(f"ENGINE: {db_settings['ENGINE']}")
    print(f"NAME: {db_settings['NAME']}")
    print(f"USER: {db_settings['USER']}")
    print(f"HOST: {db_settings['HOST']}")
    print(f"PORT: {db_settings['PORT']}")
    print(f"OPTIONS: {db_settings.get('OPTIONS', {})}")
    
    print("\n=== Testing Connection ===")
    try:
        from django.db import connection
        connection.ensure_connection()
        print("✅ Database connection successful!")
        
        # Test a simple query
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ PostgreSQL version: {version[0]}")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_connection() 