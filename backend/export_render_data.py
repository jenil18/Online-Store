#!/usr/bin/env python
"""
Script to export data from Render PostgreSQL database
"""
import os
import sys
import django
import json
from django.core.management import execute_from_command_line

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def export_render_data():
    """
    Export data from Render PostgreSQL database
    """
    print("🔄 Starting data export from Render PostgreSQL...")
    print("=" * 50)
    
    try:
        # Test database connection first
        from django.db import connection
        connection.ensure_connection()
        print("✅ Database connection successful!")
        
        # Export all data to JSON, excluding some system tables
        print("📤 Exporting data...")
        execute_from_command_line([
            'manage.py', 'dumpdata',
            '--exclude', 'contenttypes',
            '--exclude', 'auth.Permission',
            '--exclude', 'admin.LogEntry',
            '--exclude', 'sessions.Session',
            '--indent', '2',
            '-o', 'render_data_backup.json'
        ])
        
        # Check if file was created
        if os.path.exists('render_data_backup.json'):
            file_size = os.path.getsize('render_data_backup.json')
            print(f"✅ Data exported successfully to render_data_backup.json")
            print(f"📁 File size: {file_size / 1024:.2f} KB")
            print(f"📍 File location: {os.path.abspath('render_data_backup.json')}")
            
            # Show file contents preview
            with open('render_data_backup.json', 'r') as f:
                content = f.read()
                print(f"📄 File contains {len(content)} characters")
                print(f"📊 First 200 characters: {content[:200]}...")
        else:
            print("❌ Export file was not created")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        return False

def main():
    """
    Main export function
    """
    print("🚀 Starting Render data export...")
    
    if export_render_data():
        print("\n🎉 Export completed successfully!")
        print("=" * 50)
        print("📋 Next steps:")
        print("1. Download render_data_backup.json from your deployment")
        print("2. Switch to Neon credentials in environment variables")
        print("3. Import the data to Neon database")
    else:
        print("\n❌ Export failed!")
        print("=" * 50)
        print("🔍 Troubleshooting:")
        print("1. Check your database connection")
        print("2. Verify environment variables are set correctly")
        print("3. Check if you have data to export")
        sys.exit(1)

if __name__ == "__main__":
    main() 