# authentication/models.py

from django.db import models
from django.conf import settings
from django.apps import apps
from django.contrib.auth.models import AbstractUser, BaseUserManager
from core.models import BaseModel

class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, username, email, password, **extra_fields):
        """
        Crea y guarda un usuario con username, email, password y extra_fields.
        """
        if not username:
            raise ValueError('El username es obligatorio')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        """
        Crea un superuser y le asigna de oficio el rol ADMIN.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        # Recupera el modelo Rol y el objeto ADMIN
        Rol = apps.get_model('authentication', 'Rol')
        try:
            admin_role = Rol.objects.get(nombre=Rol.ADMIN)
        except Rol.DoesNotExist:
            raise ValueError('No existe el rol ADMIN. Crea primero tus roles.')

        # Si no pasaron rol explícito, lo asignamos ahora
        extra_fields.setdefault('rol', admin_role)

        if extra_fields.get('rol') != admin_role:
            raise ValueError('El superusuario debe tener rol ADMIN.')

        return self._create_user(username, email, password, **extra_fields)


class Rol(BaseModel):
    ADMIN         = 'ADMIN'
    VETERINARIO   = 'VETERINARIO'
    RECEPCIONISTA = 'RECEPCIONISTA'
    ROL_CHOICES = [
        (ADMIN, 'Administrador'),
        (VETERINARIO, 'Veterinario'),
        (RECEPCIONISTA, 'Recepcionista'),
    ]
    nombre      = models.CharField(max_length=20, choices=ROL_CHOICES, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'rol'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.get_nombre_display()


class Usuario(AbstractUser, BaseModel):
    """
    Tu CustomUser, con FK obligatorio a Rol.
    db_table='usuario' para coincidir con tu ERD.
    """
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        related_name='usuarios',
        db_column='rol_id'
    )

    objects = UsuarioManager()

    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return self.get_full_name() or self.username
