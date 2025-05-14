# core/validators.py
from django.utils import timezone
from django.core.exceptions import ValidationError

def validar_fecha_futura(value):
    """
    Valida que una fecha sea en el futuro
    """
    # Convertir value a date si es un datetime
    if hasattr(value, 'date'):
        value_date = value.date()
    else:
        value_date = value
    
    if value_date < timezone.now().date():
        raise ValidationError('La fecha debe ser futura')
    
def validar_fecha_pasada(value):
    """
    Valida que una fecha sea en el pasado
    """
    if value > timezone.now().date():
        raise ValidationError('La fecha debe ser pasada')

def validar_rut_chileno(value):
    """
    Valida el formato de un RUT chileno
    """
    import re
    if not re.match(r'^\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]$', value):
        raise ValidationError('Formato de RUT inválido. Use formato XX.XXX.XXX-X')
    
    # Aquí podríamos añadir la validación del dígito verificador

def validar_cantidad_positiva(value):
    """
    Valida que una cantidad sea positiva
    """
    if value <= 0:
        raise ValidationError('La cantidad debe ser positiva')

def validar_precio_positivo(value):
    """
    Valida que un precio sea positivo
    """
    if value <= 0:
        raise ValidationError('El precio debe ser positivo')