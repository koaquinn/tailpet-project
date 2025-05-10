# facturacion/admin.py
from django.contrib import admin
from .models import MetodoPago, Servicio, Factura, DetalleFactura

@admin.register(MetodoPago)
class MetodoPagoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo')
    list_filter = ('activo',)

@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio', 'duracion_estimada', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre', 'descripcion')

@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'fecha_emision', 'total', 'estado')
    list_filter = ('estado', 'fecha_emision')
    search_fields = ('cliente__nombre', 'cliente__apellido', 'id')
    date_hierarchy = 'fecha_emision'

@admin.register(DetalleFactura)
class DetalleFacturaAdmin(admin.ModelAdmin):
    list_display = ('factura', 'tipo_item', 'cantidad', 'precio_unitario', 'subtotal')
    list_filter = ('tipo_item',)
    search_fields = ('factura__id',)