from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()

class UsernameOrPhoneBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Try to fetch user by username
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            # If not found, try by phone
            try:
                user = User.objects.get(phone=username)
            except User.DoesNotExist:
                return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None 