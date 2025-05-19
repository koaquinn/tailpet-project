# clientes/models.py
from django.db import models
from core.models import BaseModel # Asumiendo que BaseModel existe y está en core.models

class Cliente(BaseModel):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    # Almacenar RUT con guion, ej: "12345678-K".
    # max_length debería ser suficiente (ej. 12 para XX.XXX.XXX-K, o 10 para XXXXXXXX-K)
    rut = models.CharField(max_length=12, unique=True) 
    telefono = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nombre} {self.apellido}"

    def _normalizar_rut_con_guion(self, rut_crudo: str) -> str:
        """
        Limpia un RUT y lo formatea como XXXXXXXX-V (donde V es el dígito verificador).
        Ej: "12.345.678-k" -> "12345678-K"
        Ej: "12345678k" -> "12345678-K"
        Ej: "1.234.567-8" -> "1234567-8"
        """
        if not rut_crudo:
            return ""
        
        # Quitar puntos y guion existente, y convertir a mayúsculas para el DV
        rut_limpio_para_dv = rut_crudo.replace('.', '').replace('-', '').upper()
        
        if not rut_limpio_para_dv: # Si después de limpiar no queda nada
            return ""

        # Separar el cuerpo del dígito verificador potencial
        if len(rut_limpio_para_dv) < 2: # No hay suficiente para cuerpo y DV
            return rut_limpio_para_dv # Devolver lo que hay, probablemente inválido pero save() no es para validar formato

        cuerpo = rut_limpio_para_dv[:-1]
        dv = rut_limpio_para_dv[-1]

        # Asegurarse que el cuerpo solo contenga números
        cuerpo_numerico = ''.join(filter(str.isdigit, cuerpo))
        
        if not cuerpo_numerico: # Si el cuerpo no tiene números
             return rut_limpio_para_dv # Devolver como está, se espera validación previa

        return f"{cuerpo_numerico}-{dv}"

    def save(self, *args, **kwargs):
        # Normalizar el RUT para guardarlo con guion antes del DV
        if self.rut:
            self.rut = self._normalizar_rut_con_guion(self.rut)
        super().save(*args, **kwargs)
    
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
