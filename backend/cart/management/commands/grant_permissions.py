from django.core.management.base import BaseCommand
from django.db import connections
from django.db import connection

class Command(BaseCommand):
    help = 'Grant proper permissions to skadmin user in PostgreSQL'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            try:
                # Grant all privileges on the database
                cursor.execute("GRANT ALL PRIVILEGES ON DATABASE online_store_db TO skadmin;")
                
                # Grant schema permissions
                cursor.execute("GRANT ALL ON SCHEMA public TO skadmin;")
                cursor.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO skadmin;")
                cursor.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO skadmin;")
                
                # Grant future table permissions
                cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO skadmin;")
                cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO skadmin;")
                
                self.stdout.write(
                    self.style.SUCCESS('Successfully granted permissions to skadmin user')
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error granting permissions: {e}')
                ) 