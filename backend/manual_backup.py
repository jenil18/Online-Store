#!/usr/bin/env python
"""
Manual Database Backup Script for Neon PostgreSQL

This script:
1. Connects to Neon PostgreSQL database
2. Exports data from specified tables
3. Uploads backup to Google Drive
4. Deletes old data from database to stay within storage limits
5. Logs all operations

Usage: python manual_backup.py
"""

import os
import sys
import json
import logging
import psycopg2
import pandas as pd
from datetime import datetime
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import pickle

# Configuration
SCOPES = ['https://www.googleapis.com/auth/drive.file']
BACKUP_FOLDER_NAME = 'Database_Backups'
EXCLUDED_FROM_BACKUP = ['auth_user', 'auth_group', 'product']  # Tables to exclude from backup
EXCLUDED_FROM_DELETION = ['auth_user', 'auth_group', 'product', 'django_migrations', 'django_content_type', 'django_admin_log']  # Tables to never delete from
RETENTION_DAYS = 30  # Keep data for 30 days

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('manual_backup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def connect_to_database():
    """Connect to Neon PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT', '5432')
        )
        logger.info("✅ Successfully connected to Neon database")
        return conn
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        raise

def get_table_list(conn):
    """Get list of all tables in the database"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cursor.fetchall()]
        cursor.close()
        logger.info(f"📋 Found {len(tables)} tables in database")
        return tables
    except Exception as e:
        logger.error(f"❌ Failed to get table list: {e}")
        raise

def export_table_to_csv(conn, table_name, backup_dir):
    """Export a single table to CSV format"""
    try:
        query = f"SELECT * FROM {table_name}"
        df = pd.read_sql_query(query, conn)
        
        csv_file = os.path.join(backup_dir, f"{table_name}.csv")
        df.to_csv(csv_file, index=False)
        
        logger.info(f"📊 Exported {table_name}: {len(df)} rows")
        return csv_file
    except Exception as e:
        logger.error(f"❌ Failed to export {table_name}: {e}")
        return None

def export_table_to_sql(conn, table_name, backup_dir):
    """Export a single table to SQL format"""
    try:
        cursor = conn.cursor()
        
        # Get table structure
        cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}' ORDER BY ordinal_position")
        columns = cursor.fetchall()
        
        # Get table data
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        sql_file = os.path.join(backup_dir, f"{table_name}.sql")
        with open(sql_file, 'w') as f:
            f.write(f"-- Table: {table_name}\n")
            f.write(f"-- Exported on: {datetime.now()}\n\n")
            
            if rows:
                # Create INSERT statements
                column_names = [col[0] for col in columns]
                placeholders = ', '.join(['%s'] * len(column_names))
                insert_sql = f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({placeholders});\n"
                
                for row in rows:
                    f.write(insert_sql % row)
        
        cursor.close()
        logger.info(f"📄 Exported {table_name} to SQL: {len(rows)} rows")
        return sql_file
    except Exception as e:
        logger.error(f"❌ Failed to export {table_name} to SQL: {e}")
        return None

def backup_data():
    """Backup data from all tables except excluded ones"""
    logger.info("🔄 Starting database backup...")
    
    conn = connect_to_database()
    tables = get_table_list(conn)
    
    # Create backup directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_{timestamp}"
    os.makedirs(backup_dir, exist_ok=True)
    
    backup_files = []
    
    try:
        for table in tables:
            if table not in EXCLUDED_FROM_BACKUP:
                # Export to CSV
                csv_file = export_table_to_csv(conn, table, backup_dir)
                if csv_file:
                    backup_files.append(csv_file)
                
                # Export to SQL
                sql_file = export_table_to_sql(conn, table, backup_dir)
                if sql_file:
                    backup_files.append(sql_file)
            else:
                logger.info(f"⏭️ Skipping {table} (excluded from backup)")
        
        # Create backup manifest
        manifest = {
            'timestamp': timestamp,
            'tables_backed_up': [t for t in tables if t not in EXCLUDED_FROM_BACKUP],
            'tables_excluded': EXCLUDED_FROM_BACKUP,
            'total_files': len(backup_files)
        }
        
        manifest_file = os.path.join(backup_dir, 'backup_manifest.json')
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        backup_files.append(manifest_file)
        
        logger.info(f"✅ Backup completed: {len(backup_files)} files created")
        return backup_dir, backup_files
        
    finally:
        conn.close()

def authenticate_google_drive():
    """Authenticate with Google Drive API"""
    creds = None
    
    # Check if token file exists
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If no valid credentials, get new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Load credentials from environment variable
            creds_json = os.getenv('GOOGLE_CREDENTIALS_JSON')
            if creds_json:
                import tempfile
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    f.write(creds_json)
                    creds_file = f.name
                
                flow = InstalledAppFlow.from_client_secrets_file(creds_file, SCOPES)
                creds = flow.run_local_server(port=0)
                
                # Clean up temp file
                os.unlink(creds_file)
            else:
                raise ValueError("GOOGLE_CREDENTIALS_JSON environment variable not set")
        
        # Save credentials for next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    drive_service = build('drive', 'v3', credentials=creds)
    logger.info("✅ Authenticated with Google Drive")
    return drive_service

def get_or_create_backup_folder(drive_service):
    """Get or create the backup folder in Google Drive"""
    # Search for existing folder
    results = drive_service.files().list(
        q=f"name='{BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces='drive'
    ).execute()
    
    if results['files']:
        backup_folder_id = results['files'][0]['id']
        logger.info(f"📁 Found existing backup folder: {BACKUP_FOLDER_NAME}")
    else:
        # Create new folder
        folder_metadata = {
            'name': BACKUP_FOLDER_NAME,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = drive_service.files().create(
            body=folder_metadata,
            fields='id'
        ).execute()
        backup_folder_id = folder.get('id')
        logger.info(f"📁 Created new backup folder: {BACKUP_FOLDER_NAME}")
    
    return backup_folder_id

def upload_to_drive(backup_dir, backup_files):
    """Upload backup files to Google Drive"""
    logger.info("☁️ Starting upload to Google Drive...")
    
    drive_service = authenticate_google_drive()
    backup_folder_id = get_or_create_backup_folder(drive_service)
    
    uploaded_files = []
    
    for file_path in backup_files:
        try:
            file_name = os.path.basename(file_path)
            
            # Create file metadata
            file_metadata = {
                'name': f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file_name}",
                'parents': [backup_folder_id]
            }
            
            # Upload file
            media = drive_service.files().create(
                body=file_metadata,
                media_body=file_path,
                fields='id,name'
            ).execute()
            
            uploaded_files.append(media)
            logger.info(f"📤 Uploaded: {file_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to upload {file_path}: {e}")
            raise
    
    logger.info(f"✅ Upload completed: {len(uploaded_files)} files uploaded")
    return uploaded_files

def delete_old_data(conn):
    """Delete old data from tables to stay within storage limits"""
    logger.info("🗑️ Starting cleanup of old data...")
    
    try:
        cursor = conn.cursor()
        
        # Get tables that can be cleaned
        tables = get_table_list(conn)
        cleanable_tables = [t for t in tables if t not in EXCLUDED_FROM_DELETION]
        
        deleted_counts = {}
        
        for table in cleanable_tables:
            try:
                # Delete data older than RETENTION_DAYS
                # Adjust the date column based on your table structure
                if table == 'cart_order':
                    delete_query = f"""
                        DELETE FROM {table} 
                        WHERE created_at < NOW() - INTERVAL '{RETENTION_DAYS} days'
                    """
                elif table == 'authentication_user':
                    # Don't delete users, just logins
                    delete_query = f"""
                        DELETE FROM {table} 
                        WHERE last_login < NOW() - INTERVAL '{RETENTION_DAYS} days'
                        AND is_superuser = false
                    """
                else:
                    # For other tables, use a generic approach
                    delete_query = f"""
                        DELETE FROM {table} 
                        WHERE id IN (
                            SELECT id FROM {table} 
                            ORDER BY id 
                            LIMIT (SELECT COUNT(*) FROM {table}) / 2
                        )
                    """
                
                cursor.execute(delete_query)
                deleted_count = cursor.rowcount
                deleted_counts[table] = deleted_count
                
                if deleted_count > 0:
                    logger.info(f"🗑️ Deleted {deleted_count} rows from {table}")
                else:
                    logger.info(f"ℹ️ No rows deleted from {table}")
                    
            except Exception as e:
                logger.warning(f"⚠️ Could not clean table {table}: {e}")
        
        conn.commit()
        cursor.close()
        
        total_deleted = sum(deleted_counts.values())
        logger.info(f"✅ Cleanup completed: {total_deleted} total rows deleted")
        return deleted_counts
        
    except Exception as e:
        logger.error(f"❌ Failed to delete old data: {e}")
        conn.rollback()
        raise

def main():
    """Main function to run the complete backup and cleanup process"""
    logger.info("🚀 Starting manual database backup and cleanup...")
    print("=" * 60)
    print("🔄 Manual Database Backup Started")
    print("=" * 60)
    
    try:
        # Step 1: Backup data
        backup_dir, backup_files = backup_data()
        
        # Step 2: Upload to Google Drive
        uploaded_files = upload_to_drive(backup_dir, backup_files)
        
        # Step 3: Delete old data (only if upload was successful)
        if uploaded_files:
            conn = connect_to_database()
            deleted_counts = delete_old_data(conn)
            conn.close()
            
            logger.info("🎉 Backup and cleanup process completed successfully!")
            print("=" * 60)
            print("✅ MANUAL BACKUP COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            
            # Clean up local backup files
            import shutil
            shutil.rmtree(backup_dir)
            logger.info(f"🧹 Cleaned up local backup directory: {backup_dir}")
            
            print(f"📊 Summary:")
            print(f"   - Backup files created: {len(backup_files)}")
            print(f"   - Files uploaded to Google Drive: {len(uploaded_files)}")
            print(f"   - Tables cleaned: {len(deleted_counts)}")
            print(f"   - Total rows deleted: {sum(deleted_counts.values())}")
            print("=" * 60)
            
            return {
                'status': 'success',
                'backup_files': len(backup_files),
                'uploaded_files': len(uploaded_files),
                'deleted_counts': deleted_counts,
                'timestamp': datetime.now().isoformat()
            }
        else:
            logger.error("❌ Upload failed, skipping data deletion")
            print("=" * 60)
            print("❌ BACKUP FAILED - Upload to Google Drive failed")
            print("=" * 60)
            return {'status': 'failed', 'reason': 'upload_failed'}
            
    except Exception as e:
        logger.error(f"❌ Backup and cleanup process failed: {e}")
        print("=" * 60)
        print(f"❌ BACKUP FAILED - {str(e)}")
        print("=" * 60)
        return {'status': 'failed', 'reason': str(e)}

if __name__ == "__main__":
    result = main()
    
    if result['status'] == 'success':
        print("🎉 Manual backup completed successfully!")
        sys.exit(0)
    else:
        print(f"❌ Manual backup failed: {result.get('reason', 'unknown')}")
        sys.exit(1) 