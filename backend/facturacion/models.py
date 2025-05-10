# facturacion/models.py
from django.db import models
from django.conf import settings
from core.models import BaseModel
from clientes.models import Cliente

class MetodoPago(BaseModel):
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Método de Pago"
        verbose_name_plural = "Métodos de Pago"

class Servicio(BaseModel):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    duracion_estimada = models.PositiveIntegerField(help_text="Duración en minutos", null=True, blank=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"

class Factura(BaseModel):
    ESTADOS = [
        ('PENDIENTE', 'Pendiente'),
        ('PAGADA', 'Pagada'),
        ('ANULADA', 'Anulada'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='facturas')
    fecha_emision = models.DateField()
    fecha_pago = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='PENDIENTE')
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.PROTECT, related_name='facturas', null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    impuesto = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    notas = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Factura #{self.id} - {self.cliente.nombre} {self.cliente.apellido}"
    
    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        indexes = [
            models.Index(fields=['cliente']),
            models.Index(fields=['fecha_emision']),
            models.Index(fields=['estado']),
        ]

class DetalleFactura(BaseModel):
    TIPOS_ITEM = [
        ('CONSULTA', 'Consulta'),
        ('TRATAMIENTO', 'Tratamiento'),
        ('MEDICAMENTO', 'Medicamento'),
        ('SERVICIO', 'Servicio'),
    ]
    
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='detalles')
    tipo_item = models.CharField(max_length=20, choices=TIPOS_ITEM)
    item_id = models.PositiveIntegerField()
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    descuento_porcentaje = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    motivo_descuento = models.CharField(max_length=255, blank=True, null=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"Detalle de factura #{self.factura.id} - {self.get_tipo_item_display()}"
    
    class Meta:
        verbose_name = "Detalle de Factura"
        verbose_name_plural = "Detalles de Facturas"