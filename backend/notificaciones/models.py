# notificaciones/models.py
from django.db import models
from core.models import BaseModel
from clientes.models import Cliente
from mascotas.models import Mascota
from core.validators import validar_fecha_futura

class Notificacion(BaseModel):
    TIPOS = [
        ('VACUNA', 'Vacuna'),
        ('CONSULTA', 'Consulta'),
        ('TRATAMIENTO', 'Tratamiento'),
        ('FACTURA', 'Factura'),
    ]
    
    MEDIOS = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('APP', 'App'),
    ]
    
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('ENVIADA', 'Enviada'),
        ('LEIDA', 'Leída'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='notificaciones')
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='notificaciones', null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    medio = models.CharField(max_length=20, choices=MEDIOS)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(null=True, blank=True)
    fecha_programada = models.DateTimeField(validators=[validar_fecha_futura])
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    
    def __str__(self):
        return f"Notificación {self.get_tipo_display()} para {self.cliente.nombre} {self.cliente.apellido}"
    
    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        indexes = [
            models.Index(fields=['cliente']),
            models.Index(fields=['fecha_programada']),
            models.Index(fields=['estado']),
        ]