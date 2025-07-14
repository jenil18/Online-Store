# Online Store Backend

This is the Django backend for the Online Store application.

## Environment Setup

### Local Development
1. Copy `env_template.txt` to `.env` in the backend directory
2. Update the values in `.env` with your actual credentials
3. Never commit the `.env` file to version control

### Production (Render)
Set these environment variables in your Render dashboard:

### Prerequisites
- PostgreSQL database (can be external or Render's managed database)
- Render account

### Environment Variables

```
SECRET_KEY=your-secret-key-here
DEBUG=False
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=5432
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Build Commands

Render will automatically run the `build.sh` script which:
1. Installs dependencies from `requirements.txt`
2. Collects static files
3. Runs database migrations

### Start Command

```
gunicorn backend.wsgi:application
```

### Important Notes

1. **Database**: Make sure your PostgreSQL database is accessible from Render
2. **Media Files**: For production, consider using AWS S3 or similar for media file storage
3. **CORS**: Update CORS settings to only allow your frontend domain
4. **Security**: Set DEBUG=False in production and use a strong SECRET_KEY

### Local Development

1. Install dependencies: `pip install -r requirements.txt`
2. Run migrations: `python manage.py migrate`
3. Create superuser: `python manage.py createsuperuser`
4. Run server: `python manage.py runserver` 