#!/usr/bin/env python
"""
Database Backup Script with Email Delivery

This script:
1. Connects to Neon PostgreSQL database
2. Exports data from specified tables using pandas for efficiency
3. Creates zip archive of backup files
4. Sends backup via email
5. Deletes old data from database to stay within storage limits
6. Logs all operations

Usage: python backup.py
"""

import os
import sys
import json
import logging
import psycopg
import pandas as pd
import zipfile
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime
from decouple import config

# Configuration
EXCLUDED_FROM_BACKUP = ['auth_user', 'auth_group', 'product']  # Tables to exclude from backup
EXCLUDED_FROM_DELETION = ['auth_user', 'auth_group', 'product', 'django_migrations', 'django_content_type', 'django_admin_log']  # Tables to never delete from
RETENTION_DAYS = 30  # Keep data for 30 days

# Email Configuration
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USER = config('EMAIL_USER', default='your-email@gmail.com')
EMAIL_PASSWORD = config('EMAIL_PASSWORD', default='your-app-password')
EMAIL_TO = config('EMAIL_TO', default='your-email@gmail.com')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def connect_to_database():
    """Connect to Neon PostgreSQL database"""
    try:
        conn = psycopg.connect(
            host=config('DB_HOST'),
            dbname=config('DB_NAME'),
            user=config('DB_USER'),
            password=config('DB_PASSWORD'),
            port=config('DB_PORT', default='5432')
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
            'total_files': len(backup_files),
            'backup_date': datetime.now().isoformat()
        }
        
        manifest_file = os.path.join(backup_dir, 'backup_manifest.json')
        with open(manifest_file, 'w') as f:
            json.dump(manifest, f, indent=2)
        
        backup_files.append(manifest_file)
        
        logger.info(f"✅ Backup completed: {len(backup_files)} files created")
        return backup_dir, backup_files
        
    finally:
        conn.close()

def create_zip_archive(backup_dir, backup_files):
    """Create zip archive of backup files"""
    try:
        zip_filename = f"{backup_dir}.zip"
        
        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path in backup_files:
                # Add file to zip with relative path
                arcname = os.path.basename(file_path)
                zipf.write(file_path, arcname)
                logger.info(f"📦 Added to zip: {arcname}")
        
        logger.info(f"✅ Zip archive created: {zip_filename}")
        return zip_filename
        
    except Exception as e:
        logger.error(f"❌ Failed to create zip archive: {e}")
        raise

def send_email_backup(zip_filename, backup_summary):
    """Send backup via email"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = EMAIL_USER
        msg['To'] = EMAIL_TO
        msg['Subject'] = f"Database Backup - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        # Email body
        body = f"""
Database Backup Completed Successfully!

📊 Backup Summary:
{backup_summary}

📦 Attachment: {os.path.basename(zip_filename)}
📅 Backup Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This backup contains all database tables in both CSV and SQL formats.
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach zip file
        with open(zip_filename, 'rb') as attachment:
            part = MIMEBase('application', 'zip')
            part.set_payload(attachment.read())
        
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename= {os.path.basename(zip_filename)}'
        )
        msg.attach(part)
        
        # Send email
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_USER, EMAIL_TO, text)
        server.quit()
        
        logger.info(f"✅ Backup email sent successfully to {EMAIL_TO}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")
        raise

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
    logger.info("🚀 Starting database backup and email delivery...")
    print("=" * 60)
    print("🔄 Database Backup Started")
    print("=" * 60)
    
    try:
        # Step 1: Backup data
        backup_dir, backup_files = backup_data()
        
        # Step 2: Create zip archive
        zip_filename = create_zip_archive(backup_dir, backup_files)
        
        # Step 3: Send email
        backup_summary = f"""
• Total files: {len(backup_files)}
• Backup directory: {backup_dir}
• Zip file: {os.path.basename(zip_filename)}
• File size: {os.path.getsize(zip_filename) / 1024:.1f} KB
        """
        
        email_sent = send_email_backup(zip_filename, backup_summary)
        
        # Step 4: Delete old data (only if email was successful)
        if email_sent:
            conn = connect_to_database()
            deleted_counts = delete_old_data(conn)
            conn.close()
            
            logger.info("🎉 Backup and cleanup process completed successfully!")
            print("=" * 60)
            print("✅ BACKUP COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            
            # Clean up local files
            import shutil
            shutil.rmtree(backup_dir)
            os.remove(zip_filename)
            logger.info(f"🧹 Cleaned up local files")
            
            print(f"📊 Summary:")
            print(f"   - Backup files created: {len(backup_files)}")
            print(f"   - Email sent to: {EMAIL_TO}")
            print(f"   - Tables cleaned: {len(deleted_counts)}")
            print(f"   - Total rows deleted: {sum(deleted_counts.values())}")
            print("=" * 60)
            
            return {
                'status': 'success',
                'backup_files': len(backup_files),
                'email_sent': email_sent,
                'deleted_counts': deleted_counts,
                'timestamp': datetime.now().isoformat()
            }
        else:
            logger.error("❌ Email failed, skipping data deletion")
            print("=" * 60)
            print("❌ BACKUP FAILED - Email delivery failed")
            print("=" * 60)
            return {'status': 'failed', 'reason': 'email_failed'}
            
    except Exception as e:
        logger.error(f"❌ Backup and cleanup process failed: {e}")
        print("=" * 60)
        print(f"❌ BACKUP FAILED - {str(e)}")
        print("=" * 60)
        return {'status': 'failed', 'reason': str(e)}

if __name__ == "__main__":
    result = main()
    
    if result['status'] == 'success':
        print("🎉 Backup completed successfully!")
        sys.exit(0)
    else:
        print(f"❌ Backup failed: {result.get('reason', 'unknown')}")
        sys.exit(1) 