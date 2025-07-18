from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Quickly create a superuser with default credentials if not exists.'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        username = 'skbadmin'
        email = 'shreekrishnabeautyproducts@gmail.com'
        password = 'beauty@987'
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Superuser created: {username} / {password}'))
        else:
            self.stdout.write(self.style.WARNING('Superuser already exists.')) 