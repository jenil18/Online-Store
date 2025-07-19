#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

# Fix database schema by adding missing columns
python fix_migrations.py

# Run migrations
python manage.py migrate

# Start the application
gunicorn backend.wsgi:application 