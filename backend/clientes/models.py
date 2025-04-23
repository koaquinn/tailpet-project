# clientes/models.py
from django.db import models
from core.models import BaseModel

class Cliente(BaseModel):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    rut = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nombre} {self.apellido}"
    
    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        indexes = [
            models.Index(fields=['rut']),
            models.Index(fields=['email']),
        ]

class DireccionCliente(BaseModel):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='direcciones')
    calle = models.CharField(max_length=255)
    numero = models.CharField(max_length=20)
    departamento = models.CharField(max_length=50, blank=True, null=True)
    ciudad = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    codigo_postal = models.CharField(max_length=20, blank=True, null=True)
    es_principal = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.calle} {self.numero}, {self.ciudad}"
    
    class Meta:
        verbose_name = "Dirección de Cliente"
        verbose_name_plural = "Direcciones de Clientes"