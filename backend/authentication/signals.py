# authentication/signals.py
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import Rol

@receiver(post_migrate)
def crear_roles_por_defecto(sender, **kwargs):
    roles = [
        (Rol.ADMIN, 'Administrador'),
        (Rol.VETERINARIO, 'Veterinario'),
        (Rol.RECEPCIONISTA, 'Recepcionista'),
    ]
    for nombre, descripcion in roles:
        Rol.objects.get_or_create(nombre=nombre, defaults={'descripcion': descripcion})
