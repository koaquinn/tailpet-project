# auth/permissions.py

from rest_framework import permissions
from .models import Rol

class IsVeterinario(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con rol de Veterinario
    """
    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated and
            getattr(user, 'rol', None) is not None and
            user.rol.nombre == Rol.VETERINARIO
        )


class IsRecepcionista(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con rol de Recepcionista
    """
    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated and
            getattr(user, 'rol', None) is not None and
            user.rol.nombre == Rol.RECEPCIONISTA
        )


class IsAdmin(permissions.BasePermission):
    """
    Permite acceso solo a usuarios con rol de Administrador
    """
    def has_permission(self, request, view):
        user = request.user
        return (
            user.is_authenticated and
            getattr(user, 'rol', None) is not None and
            user.rol.nombre == Rol.ADMIN
        )


class IsVeterinarioOrAdmin(permissions.BasePermission):
    """
    Permite acceso a usuarios con rol de Veterinario o Administrador
    """
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated or getattr(user, 'rol', None) is None:
            return False
        return user.rol.nombre in {Rol.VETERINARIO, Rol.ADMIN}
