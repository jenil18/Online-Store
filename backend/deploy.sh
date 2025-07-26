#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

# Test database connection first
echo "Testing database connection..."
python test_db_connection.py

# Fix database schema by adding missing columns
python fix_migrations.py

# Run migrations for Neon database
python manage.py migrate

# Optional: Load data if you have a backup
# python manage.py loaddata render_data_backup.json

# Start the application
gunicorn backend.wsgi:application 