# backend/citas/models.py (corrección completa)
from django.db import models
from django.conf import settings
from core.models import BaseModel
from mascotas.models import Mascota
from core.validators import validar_fecha_futura, validar_cantidad_positiva

class Consulta(BaseModel):
    ESTADOS = [
        ('PROGRAMADA', 'Programada'),
        ('EN_CURSO', 'En curso'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    TIPOS = [
        ('RUTINA', 'Rutina'),
        ('EMERGENCIA', 'Emergencia'),
        ('SEGUIMIENTO', 'Seguimiento'),
    ]
    
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='consultas_programadas')
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='consultas_asignadas'
    )
    fecha = models.DateTimeField(validators=[validar_fecha_futura])
    duracion_estimada = models.PositiveIntegerField(
        help_text="Duración en minutos",
        validators=[validar_cantidad_positiva]
    )
    motivo = models.TextField()
    diagnostico = models.TextField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PROGRAMADA')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    
    # Campos adicionales para el registro clínico
    temperatura = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True, 
                                      help_text="Temperatura en grados Celsius")
    peso = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True,
                               help_text="Peso en kilogramos")
    sintomas = models.TextField(blank=True, null=True)
    tratamiento = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Consulta para {self.mascota.nombre} - {self.fecha}"
    
    class Meta:
        verbose_name = "Consulta"
        verbose_name_plural = "Consultas"
        indexes = [
            models.Index(fields=['mascota']),
            models.Index(fields=['veterinario']),
            models.Index(fields=['fecha']),
            models.Index(fields=['estado']),
        ]