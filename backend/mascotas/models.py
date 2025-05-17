from django.db import models
from core.models import BaseModel
from clientes.models import Cliente

class Especie(BaseModel):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Especie"
        verbose_name_plural = "Especies"

class Raza(BaseModel):
    nombre = models.CharField(max_length=100)
    especie = models.ForeignKey(Especie, on_delete=models.PROTECT, related_name='razas')
    descripcion = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.nombre} ({self.especie.nombre})"
    
    class Meta:
        verbose_name = "Raza"
        verbose_name_plural = "Razas"
        unique_together = ('nombre', 'especie')

class Mascota(BaseModel):
    SEXO_CHOICES = [
        ('M', 'Macho'),
        ('H', 'Hembra'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='mascotas')
    nombre = models.CharField(max_length=100)
    especie = models.ForeignKey(Especie, on_delete=models.PROTECT, related_name='mascotas')
    raza = models.ForeignKey(Raza, on_delete=models.PROTECT, related_name='mascotas')
    fecha_nacimiento = models.DateField()
    sexo = models.CharField(max_length=1, choices=SEXO_CHOICES)
    esterilizado = models.BooleanField(default=False)
    microchip = models.CharField(max_length=50, blank=True, null=True, unique=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nombre} ({self.cliente.nombre})"
    
    class Meta:
        verbose_name = "Mascota"
        verbose_name_plural = "Mascotas"

class FotoMascota(BaseModel):
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='fotos')
    url_foto = models.ImageField(upload_to='mascotas/')
    fecha_subida = models.DateTimeField(auto_now_add=True)
    es_principal = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Foto de {self.mascota.nombre}"
    
    class Meta:
        verbose_name = "Foto de Mascota"
        verbose_name_plural = "Fotos de Mascotas"

class RegistroPeso(BaseModel): # Asumo que BaseModel tiene campos como created_at, updated_at, etc.
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name='registros_peso')
    peso = models.DecimalField(max_digits=5, decimal_places=2)
    fecha_registro = models.DateField() # <--- ¡AQUÍ ESTÁ LA CLAVE!
    notas = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Peso de {self.mascota.nombre}: {self.peso}kg ({self.fecha_registro})"
    
    class Meta:
        verbose_name = "Registro de Peso"
        verbose_name_plural = "Registros de Peso"