# Database Backup Script

## Overview
This script provides automated database backup functionality for the Neon PostgreSQL database with the following features:

- **Efficient Data Export**: Uses pandas for optimized CSV export
- **Google Drive Integration**: Automatically uploads backups to Google Drive
- **Data Cleanup**: Removes old data to stay within storage limits
- **Comprehensive Logging**: Detailed logs for all operations

## Features

### ✅ **Efficient Data Processing**
- Uses pandas for fast and reliable data export
- Handles complex data types automatically
- Optimized memory usage

### ✅ **Google Drive Integration**
- Automatic authentication with Google Drive API
- Uses Shared Drives for service account storage
- Creates organized backup folders
- Uploads both CSV and SQL formats

### ✅ **Smart Data Cleanup**
- Configurable retention periods (30 days default)
- Protects critical tables from deletion
- Safe deletion strategies for different table types

### ✅ **Robust Error Handling**
- Comprehensive logging
- Graceful failure handling
- Rollback on errors

## Usage

### Basic Usage
```bash
python backup.py
```

### Environment Variables Required
```bash
DB_HOST=your_neon_host
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432
GOOGLE_CREDENTIALS_JSON=your_service_account_json
```

### Service Account Setup (For Render Deployment)
1. **Create Service Account** in Google Cloud Console
2. **Download Service Account JSON** and set as GOOGLE_CREDENTIALS_JSON
3. **Share your Google Drive folder** with service account email
4. **No browser interaction required** - works on Render

### Configuration
The script can be customized by modifying these variables at the top of the file:

```python
EXCLUDED_FROM_BACKUP = ['auth_user', 'auth_group', 'product']
EXCLUDED_FROM_DELETION = ['auth_user', 'auth_group', 'product', 'django_migrations']
RETENTION_DAYS = 30
```

## Output

### Files Created
- **CSV files**: One per table for easy data analysis
- **SQL files**: INSERT statements for database restoration
- **Manifest file**: JSON summary of backup contents

### Logs
- **backup.log**: Detailed operation logs
- **Console output**: Real-time progress updates

## Safety Features

### 🔒 **Protected Tables**
- `auth_user`: User accounts
- `auth_group`: User groups
- `product`: Product catalog
- `django_migrations`: Django schema
- `django_content_type`: Django content types
- `django_admin_log`: Admin logs

### 🛡️ **Safe Deletion Strategy**
- **Orders**: Delete by creation date
- **Users**: Only delete inactive non-admin users
- **Other tables**: Conservative deletion (50% of oldest records)

## Dependencies

```txt
psycopg[binary]==3.2.9
pandas>=2.0.0
google-api-python-client==2.108.0
google-auth==2.40.3
```

## Testing

Test the database connection:
```bash
python test_connection.py
```

## Troubleshooting

### Common Issues

1. **psycopg2 Import Error**: 
   - ✅ **Fixed**: Updated to psycopg3 for Python 3.13 compatibility

2. **Google Drive Authentication**:
   - Ensure `GOOGLE_CREDENTIALS_JSON` contains service account JSON
   - Service account must have Google Drive API permissions
   - **Share your Google Drive folder** with service account email

3. **Database Connection**:
   - Verify all database environment variables
   - Check Neon database status

### Log Files
- Check `backup.log` for detailed error messages
- Console output shows real-time progress

## Performance

### Optimizations
- **Pandas**: Fast data processing
- **Batch operations**: Efficient database queries
- **Memory management**: Optimized for large datasets

### Expected Performance
- **Small databases** (< 1GB): 2-5 minutes
- **Medium databases** (1-10GB): 5-15 minutes
- **Large databases** (> 10GB): 15+ minutes

## Security

### Data Protection
- **Encrypted connections**: SSL/TLS to database
- **Secure credentials**: Environment variable storage
- **Access control**: Google Drive API permissions

### Backup Security
- **Local cleanup**: Temporary files removed after upload
- **Secure uploads**: Google Drive API authentication
- **Audit trail**: Comprehensive logging 