# historial_medico/models.py
from django.db import models
from django.conf import settings
from core.models import BaseModel
from mascotas.models import Mascota

class HistorialMedico(BaseModel):
    mascota = models.OneToOneField(
        Mascota,
        on_delete=models.CASCADE,
        related_name='historial'
    )
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='historiales_asignados'
    )
    fecha = models.DateField(auto_now_add=True)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Historial de {self.mascota.nombre}"

    class Meta:
        verbose_name = "Historial Médico"
        verbose_name_plural = "Historiales Médicos"


class TipoConsulta(BaseModel):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    duracion_estimada = models.IntegerField(help_text='Duración en minutos')

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Tipo de Consulta"
        verbose_name_plural = "Tipos de Consulta"


class Consulta(BaseModel):
    historial = models.ForeignKey(
        HistorialMedico,
        on_delete=models.CASCADE,
        related_name='consultas'
    )
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='consultas_realizadas'
    )
    tipo_consulta = models.ForeignKey(
        TipoConsulta,
        on_delete=models.PROTECT
    )
    fecha = models.DateField()
    motivo_consulta = models.TextField()
    diagnostico = models.TextField()
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Consulta de {self.historial.mascota.nombre} - {self.fecha}"

    class Meta:
        verbose_name = "Consulta"
        verbose_name_plural = "Consultas"


class Tratamiento(BaseModel):
    historial = models.ForeignKey(
        HistorialMedico,
        on_delete=models.CASCADE,
        related_name='tratamientos'
    )
    descripcion = models.TextField()
    duracion = models.CharField(max_length=100)
    inicio_tratamiento = models.DateField()
    fin_tratamiento = models.DateField(blank=True, null=True)
    instrucciones = models.TextField()

    def __str__(self):
        return f"Tratamiento para {self.historial.mascota.nombre}"

    class Meta:
        verbose_name = "Tratamiento"
        verbose_name_plural = "Tratamientos"


class TipoDocumento(BaseModel):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Tipo de Documento"
        verbose_name_plural = "Tipos de Documento"


class Documento(BaseModel):
    mascota = models.ForeignKey(
        Mascota,
        on_delete=models.CASCADE,
        related_name='documentos'
    )
    historial = models.ForeignKey(
        HistorialMedico,
        on_delete=models.CASCADE,
        related_name='documentos',
        null=True,
        blank=True
    )
    tipo_documento = models.ForeignKey(
        TipoDocumento,
        on_delete=models.PROTECT
    )
    nombre_archivo = models.CharField(max_length=255)
    url_archivo = models.FileField(upload_to='documentos/')
    fecha_subida = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='documentos_subidos'
    )
    notas = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.tipo_documento.nombre} - {self.mascota.nombre}"

    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"

# historial_medico/models.py (añadir al final del archivo)

class Vacuna(BaseModel):
    TIPOS = [
        ('OBLIGATORIA', 'Obligatoria'),
        ('OPCIONAL', 'Opcional'),
    ]
    
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    intervalo_revacunacion = models.PositiveIntegerField(help_text="Intervalo en días")
    especie = models.ForeignKey('mascotas.Especie', on_delete=models.PROTECT, related_name='vacunas')
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Vacuna"
        verbose_name_plural = "Vacunas"

class MascotaVacuna(BaseModel):
    mascota = models.ForeignKey('mascotas.Mascota', on_delete=models.CASCADE, related_name='vacunaciones')
    vacuna = models.ForeignKey(Vacuna, on_delete=models.PROTECT, related_name='aplicaciones')
    fecha_aplicacion = models.DateField()
    fecha_proxima = models.DateField(null=True, blank=True)
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='vacunaciones_realizadas'
    )
    lote = models.ForeignKey('inventario.LoteMedicamento', on_delete=models.PROTECT, related_name='vacunaciones')
    observaciones = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.vacuna.nombre} para {self.mascota.nombre} ({self.fecha_aplicacion})"
    
    class Meta:
        verbose_name = "Vacuna Aplicada"
        verbose_name_plural = "Vacunas Aplicadas"

# historial_medico/models.py (añadir al final del archivo)

class Receta(BaseModel):
    ESTADOS = [
        ('ACTIVA', 'Activa'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    ]
    
    mascota = models.ForeignKey('mascotas.Mascota', on_delete=models.CASCADE, related_name='recetas')
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name='recetas_emitidas'
    )
    fecha_emision = models.DateField()
    fecha_vencimiento = models.DateField()
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='ACTIVA')
    
    def __str__(self):
        return f"Receta para {self.mascota.nombre} ({self.fecha_emision})"
    
    class Meta:
        verbose_name = "Receta"
        verbose_name_plural = "Recetas"

class DetalleReceta(BaseModel):
    receta = models.ForeignKey(Receta, on_delete=models.CASCADE, related_name='detalles')
    medicamento = models.ForeignKey('inventario.Medicamento', on_delete=models.PROTECT, related_name='recetas')
    dosis = models.CharField(max_length=100)
    frecuencia = models.CharField(max_length=100)
    duracion = models.CharField(max_length=100)
    cantidad = models.PositiveIntegerField()
    instrucciones = models.TextField()
    
    def __str__(self):
        return f"{self.medicamento.nombre} - {self.dosis}"
    
    class Meta:
        verbose_name = "Detalle de Receta"
        verbose_name_plural = "Detalles de Recetas"