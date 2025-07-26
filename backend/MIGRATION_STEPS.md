# Migration Steps: Render → Neon (Environment Variables)

## Step-by-Step Process

### Step 1: Export from Render (Use Render Credentials)

**Set these environment variables in Render:**
```
DB_NAME=your_render_database_name
DB_USER=your_render_username
DB_PASSWORD=your_render_password
DB_HOST=your_render_host
DB_PORT=5432
```

**Then run the export:**
```bash
cd backend
python manage.py dumpdata --exclude contenttypes --exclude auth.Permission --exclude admin.LogEntry --exclude sessions.Session --indent 2 -o render_data_backup.json
```

### Step 2: Switch to Neon Credentials

**Change environment variables to Neon:**
```
DB_NAME=your_neon_database_name
DB_USER=your_neon_username
DB_PASSWORD=your_neon_password
DB_HOST=your_neon_host.neon.tech
DB_PORT=5432
```

### Step 3: Import to Neon

**Run migrations and import:**
```bash
python manage.py migrate
python manage.py loaddata render_data_backup.json
```

## Automated Script Approach

If you want to automate this process, you can:

1. **Create a temporary script** that switches credentials
2. **Run the migration** with the script
3. **Switch back** to Neon credentials

## Manual Process (Recommended)

### Phase 1: Export from Render
1. **Set Render credentials** in environment variables
2. **Run export command**
3. **Download the backup file** (`render_data_backup.json`)

### Phase 2: Import to Neon
1. **Set Neon credentials** in environment variables
2. **Run migrations**
3. **Import the backup file**

## Environment Variables Checklist

### Render Database (for export):
```
DB_NAME=your_render_db_name
DB_USER=your_render_user
DB_PASSWORD=your_render_password
DB_HOST=your_render_host
DB_PORT=5432
```

### Neon Database (for import):
```
DB_NAME=your_neon_db_name
DB_USER=your_neon_user
DB_PASSWORD=your_neon_password
DB_HOST=your_neon_host.neon.tech
DB_PORT=5432
```

## Quick Commands

### Export from Render:
```bash
# Set Render credentials first, then:
python manage.py dumpdata --exclude contenttypes --exclude auth.Permission --exclude admin.LogEntry --exclude sessions.Session --indent 2 -o render_data_backup.json
```

### Import to Neon:
```bash
# Set Neon credentials first, then:
python manage.py migrate
python manage.py loaddata render_data_backup.json
```

## Verification

After switching to Neon credentials:
```bash
python test_db_connection.py
python manage.py shell -c "from django.contrib.auth import get_user_model; print(f'Users: {get_user_model().objects.count()}')"
```

## Important Notes

- ⚠️ **Never mix credentials** - always use one set at a time
- ✅ **Test connection** after switching credentials
- 📁 **Keep backup file** safe during the process
- 🔄 **Deploy with Neon credentials** for production 