# inventario/models.py
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.validators import validar_precio_positivo, validar_cantidad_positiva, validar_fecha_futura

class Proveedor(BaseModel):
    TIPOS = [
        ('MEDICAMENTOS', 'Medicamentos'),
        ('ALIMENTOS', 'Alimentos'),
        ('EQUIPOS', 'Equipos'),
        ('SERVICIOS', 'Servicios'),
    ]
    
    nombre = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20)
    email = models.EmailField()
    activo = models.BooleanField(default=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['email']),
        ]

class DireccionProveedor(BaseModel):
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='direcciones')
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
        verbose_name = "Dirección de Proveedor"
        verbose_name_plural = "Direcciones de Proveedores"

class Medicamento(BaseModel):
    TIPOS = [
        ('ORAL', 'Oral'),
        ('INYECTABLE', 'Inyectable'),
        ('TOPICO', 'Tópico'),
        ('OTRO', 'Otro'),
    ]
    
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    presentacion = models.CharField(max_length=100)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='medicamentos')
    precio_compra = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[validar_precio_positivo]
    )    
    precio_venta = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[validar_precio_positivo]
    )
    stock_minimo = models.PositiveIntegerField(validators=[validar_cantidad_positiva])
    activo = models.BooleanField(default=True)
    requiere_receta = models.BooleanField(default=False)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Medicamento"
        verbose_name_plural = "Medicamentos"
        indexes = [
            models.Index(fields=['nombre']),
        ]

class LoteMedicamento(BaseModel):
    medicamento = models.ForeignKey(Medicamento, on_delete=models.CASCADE, related_name='lotes')
    numero_lote = models.CharField(max_length=50)
    fecha_vencimiento = models.DateField(validators=[validar_fecha_futura])
    cantidad = models.PositiveIntegerField(validators=[validar_cantidad_positiva])
    fecha_ingreso = models.DateField()
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='lotes')
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"Lote {self.numero_lote} - {self.medicamento.nombre}"
    
    class Meta:
        verbose_name = "Lote de Medicamento"
        verbose_name_plural = "Lotes de Medicamentos"
        unique_together = ('medicamento', 'numero_lote')

class MovimientoInventario(BaseModel):
    TIPOS = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
    ]
    
    medicamento = models.ForeignKey(Medicamento, on_delete=models.PROTECT, related_name='movimientos')
    lote = models.ForeignKey(LoteMedicamento, on_delete=models.PROTECT, related_name='movimientos', null=True, blank=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    cantidad = models.IntegerField()
    fecha = models.DateTimeField()
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='movimientos_registrados')
    documento_referencia = models.CharField(max_length=100, blank=True, null=True)
    motivo = models.TextField()
    afecta_stock = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.get_tipo_display()} de {self.medicamento.nombre} - {self.cantidad}"
    
    class Meta:
        verbose_name = "Movimiento de Inventario"
        verbose_name_plural = "Movimientos de Inventario"