# inventario/admin.py
from django.contrib import admin
from .models import (Proveedor, DireccionProveedor, Medicamento, 
                    LoteMedicamento, MovimientoInventario)

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'telefono', 'email', 'tipo', 'activo')
    list_filter = ('tipo', 'activo')
    search_fields = ('nombre', 'email')

@admin.register(DireccionProveedor)
class DireccionProveedorAdmin(admin.ModelAdmin):
    list_display = ('proveedor', 'calle', 'numero', 'ciudad', 'es_principal')
    list_filter = ('ciudad', 'es_principal')
    search_fields = ('proveedor__nombre', 'calle', 'ciudad')

@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'proveedor', 'precio_venta', 'activo')
    list_filter = ('tipo', 'activo', 'requiere_receta')
    search_fields = ('nombre', 'descripcion')

@admin.register(LoteMedicamento)
class LoteMedicamentoAdmin(admin.ModelAdmin):
    list_display = ('medicamento', 'numero_lote', 'fecha_vencimiento', 'cantidad', 'proveedor')
    list_filter = ('fecha_vencimiento',)
    search_fields = ('medicamento__nombre', 'numero_lote')
    date_hierarchy = 'fecha_vencimiento'

@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ('medicamento', 'lote', 'tipo', 'cantidad', 'fecha', 'usuario')
    list_filter = ('tipo', 'fecha', 'afecta_stock')
    search_fields = ('medicamento__nombre', 'motivo', 'documento_referencia')
    date_hierarchy = 'fecha'