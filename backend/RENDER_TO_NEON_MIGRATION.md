# Migration Guide: Render PostgreSQL to Neon

## Overview
This guide will help you migrate your data from Render's PostgreSQL database to Neon PostgreSQL.

## Prerequisites
- ✅ Neon database is set up and connected
- ✅ Your application is running with Neon database
- ✅ Access to your Render database

## Step-by-Step Migration Process

### Step 1: Prepare Your Environment

Make sure your environment variables are set to connect to **Neon** database:

```bash
DB_NAME=your_neon_database_name
DB_USER=your_neon_username
DB_PASSWORD=your_neon_password
DB_HOST=your_neon_host.neon.tech
DB_PORT=5432
```

### Step 2: Export Data from Render

**Option A: Using the Migration Script (Recommended)**

1. **Temporarily switch to Render database** in your environment variables
2. **Run the export script:**
   ```bash
   cd backend
   python export_to_neon.py
   ```

**Option B: Manual Export**

1. **Connect to your Render database**
2. **Export data:**
   ```bash
   python manage.py dumpdata --exclude contenttypes --exclude auth.Permission --exclude admin.LogEntry --exclude sessions.Session --indent 2 -o render_data_backup.json
   ```

### Step 3: Import Data to Neon

1. **Switch back to Neon database** in your environment variables
2. **Run migrations on Neon:**
   ```bash
   python manage.py migrate
   ```
3. **Import the data:**
   ```bash
   python manage.py loaddata render_data_backup.json
   ```

### Step 4: Verify Migration

1. **Check data counts:**
   ```bash
   python manage.py shell
   ```
   ```python
   from django.contrib.auth import get_user_model
   from product.models import Product
   from cart.models import Order
   
   User = get_user_model()
   print(f"Users: {User.objects.count()}")
   print(f"Products: {Product.objects.count()}")
   print(f"Orders: {Order.objects.count()}")
   ```

2. **Test your application** to ensure everything works correctly

## Automated Migration Script

The `export_to_neon.py` script will:

1. ✅ Export all data from Render PostgreSQL
2. ✅ Import data to Neon database
3. ✅ Verify the migration was successful
4. ✅ Show data counts for verification

## What Data Gets Migrated

- ✅ **Users** (authentication data)
- ✅ **Products** (all product information)
- ✅ **Orders** (cart and order data)
- ✅ **Custom user fields** (phone, name, etc.)
- ✅ **All related data** (foreign keys, etc.)

## Excluded Data

- ❌ **Content types** (Django system tables)
- ❌ **Permissions** (Django system tables)
- ❌ **Admin logs** (Django system tables)
- ❌ **Sessions** (temporary data)

## Troubleshooting

### Common Issues:

1. **"No such table" error:**
   - Make sure migrations are run on Neon first
   - Run: `python manage.py migrate`

2. **"Duplicate key" error:**
   - Clear the Neon database first
   - Run: `python manage.py flush` (⚠️ This will clear all data)

3. **"Connection refused" error:**
   - Check your environment variables
   - Verify Neon database is active

4. **"SSL connection" error:**
   - Ensure `sslmode=require` is set in database options

### Verification Commands:

```bash
# Test database connection
python test_db_connection.py

# Check migrations
python manage.py showmigrations

# Count records
python manage.py shell -c "from django.contrib.auth import get_user_model; print(f'Users: {get_user_model().objects.count()}')"
```

## Post-Migration Checklist

- ✅ [ ] All users are migrated
- ✅ [ ] All products are migrated
- ✅ [ ] All orders are migrated
- ✅ [ ] User authentication works
- ✅ [ ] Admin panel works
- ✅ [ ] Application functions normally
- ✅ [ ] Performance is acceptable

## Rollback Plan

If something goes wrong:

1. **Keep your Render database active** (don't delete it yet)
2. **Switch back to Render environment variables**
3. **Deploy with Render database**
4. **Your data will still be available**

## Benefits After Migration

- 🚀 **Better performance** with Neon's serverless architecture
- 🔄 **Automatic scaling** based on usage
- 💾 **Automatic backups** and point-in-time recovery
- 🌿 **Database branching** for development
- 💰 **Cost optimization** with pay-per-use model

## Support

- Neon Documentation: https://neon.tech/docs
- Django Documentation: https://docs.djangoproject.com/
- Render Documentation: https://render.com/docs 