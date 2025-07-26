#!/usr/bin/env python
"""
Test script to verify psycopg3 connection works
"""

import os
import psycopg
from decouple import config

def test_connection():
    """Test database connection with psycopg3"""
    try:
        print("Testing psycopg3 connection for backup script...")
        
        conn = psycopg.connect(
            host=config('DB_HOST'),
            dbname=config('DB_NAME'),
            user=config('DB_USER'),
            password=config('DB_PASSWORD'),
            port=config('DB_PORT', default='5432')
        )
        
        print("✅ Successfully connected to database with psycopg3!")
        
        # Test a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"📊 Database version: {version[0]}")
        
        cursor.close()
        conn.close()
        
        print("✅ Connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection() 