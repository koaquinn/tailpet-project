from django.db import migrations

def crear_roles_por_defecto(apps, schema_editor):
    """
    Crea los roles predeterminados del sistema
    """
    # Obtenemos el modelo Rol a través de la API de apps para evitar problemas con las migraciones
    Rol = apps.get_model('authentication', 'Rol')
    
    # Definimos los roles predeterminados
    roles = [
        ('ADMIN', 'Administrador'),
        ('VETERINARIO', 'Veterinario'),
        ('RECEPCIONISTA', 'Recepcionista'),
    ]
    
    # Creamos cada rol si no existe
    for nombre, descripcion in roles:
        Rol.objects.get_or_create(nombre=nombre, defaults={'descripcion': descripcion})

def revertir_roles_por_defecto(apps, schema_editor):
    """
    Esta función no hace nada porque no queremos eliminar los roles si se revierte la migración
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_alter_rol_options_alter_usuario_managers_and_more'),  # Asegúrate de que esta sea la migración anterior
    ]

    operations = [
        migrations.RunPython(crear_roles_por_defecto, revertir_roles_por_defecto),
    ]