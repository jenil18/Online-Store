# Email Backup Setup Guide

## Overview
This backup script exports your database and sends it via email as a zip attachment.

## Features
- ✅ **Database Export**: Exports all tables to CSV and SQL formats
- ✅ **Zip Archive**: Creates compressed backup file
- ✅ **Email Delivery**: Sends backup to your email
- ✅ **IST Timezone**: All timestamps in Indian Standard Time
- ✅ **Automatic Cleanup**: Removes old data after successful backup
- ✅ **No External Dependencies**: Works with any Gmail account

## Setup Instructions

### Step 1: Create Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. **Security** → **2-Step Verification** (enable if not already)
3. **Security** → **App passwords**
4. **Select app**: "Mail"
5. **Select device**: "Other (Custom name)"
6. **Enter name**: "Backup Script"
7. **Generate** and copy the 16-character password

### Step 2: Set Environment Variables
Add these to your Render environment variables:

```bash
# Database Configuration
DB_HOST=your_neon_host
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432

# Email Configuration
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
EMAIL_TO=your_gmail@gmail.com
```

### Step 3: Test the Backup
```bash
python backup.py
```

## How It Works

### Backup Process:
1. **Connect** to Neon PostgreSQL database
2. **Export** all tables to CSV and SQL formats
3. **Create** zip archive of all backup files
4. **Send** email with zip attachment
5. **Clean** old data from database
6. **Remove** local backup files

### Email Features:
- 📧 **Subject**: "Database Backup - [Date Time IST]"
- 📦 **Attachment**: Compressed zip file
- 📊 **Summary**: Backup details in email body
- 📅 **Timestamp**: Exact backup time (IST timezone)

### File Size Limits:
- ✅ **Gmail limit**: 25 MB per email
- ✅ **Typical backup**: 1-5 MB (well within limits)
- ✅ **Automatic compression**: Reduces file size

## Configuration Options

### Excluded Tables (Not Backed Up):
```python
EXCLUDED_FROM_BACKUP = ['auth_user', 'auth_group', 'product']
```

### Excluded Tables (Not Cleaned):
```python
EXCLUDED_FROM_DELETION = ['auth_user', 'auth_group', 'product', 'django_migrations']
```

### Retention Period:
```python
RETENTION_DAYS = 30  # Keep data for 30 days
```

## Troubleshooting

### Common Issues:

1. **Authentication Error**:
   - Ensure 2-Step Verification is enabled
   - Use App Password (not regular password)
   - Check EMAIL_USER and EMAIL_PASSWORD

2. **Database Connection Error**:
   - Verify all database environment variables
   - Check Neon database status

3. **Email Not Received**:
   - Check spam folder
   - Verify EMAIL_TO address
   - Check email size limits

### Log Files:
- **backup.log**: Detailed operation logs
- **Console output**: Real-time progress

## Security

### Data Protection:
- ✅ **Encrypted SMTP**: TLS/SSL connection
- ✅ **Secure credentials**: Environment variables
- ✅ **Local cleanup**: Files removed after email

### Email Security:
- ✅ **App passwords**: More secure than regular passwords
- ✅ **No browser interaction**: Works on server environments
- ✅ **Automatic cleanup**: No files left on server

## Performance

### Expected Performance:
- **Small databases** (< 1GB): 1-3 minutes
- **Medium databases** (1-10GB): 3-8 minutes
- **Large databases** (> 10GB): 8+ minutes

### File Size Estimates:
- **CSV files**: ~1-2 MB per 1000 rows
- **SQL files**: ~0.5-1 MB per 1000 rows
- **Zip compression**: 60-80% size reduction 