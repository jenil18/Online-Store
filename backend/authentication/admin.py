from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        (None, {'fields': ('name', 'phone', 'altPhone', 'address', 'city', 'salon')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('name', 'phone', 'altPhone', 'address', 'city', 'salon')}),
    )
    list_display = ('username', 'email', 'name', 'phone', 'altPhone', 'address', 'city', 'salon', 'is_staff', 'is_superuser')

admin.site.register(User, UserAdmin)
