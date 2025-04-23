# clientes/admin.py
from django.contrib import admin
from .models import Cliente, DireccionCliente

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido', 'rut', 'telefono', 'email', 'activo')
    search_fields = ('nombre', 'apellido', 'rut', 'email')
    list_filter = ('activo',)

@admin.register(DireccionCliente)
class DireccionClienteAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'calle', 'numero', 'ciudad', 'es_principal')
    search_fields = ('cliente__nombre', 'calle', 'ciudad')
    list_filter = ('ciudad', 'es_principal')