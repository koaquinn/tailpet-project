# authentication/admin.py

from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Rol

User = get_user_model()


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)


@admin.register(User)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = (
        'username',
        'email',
        'first_name',
        'last_name',
        'rol',
        'is_active',
        'date_joined',
    )
    list_filter = ('rol', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    readonly_fields = ('date_joined', 'last_login')
