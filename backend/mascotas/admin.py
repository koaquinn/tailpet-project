# mascotas/admin.py
from django.contrib import admin
from .models import Especie, Raza, Mascota, FotoMascota, RegistroPeso

@admin.register(Especie)
class EspecieAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    search_fields = ('nombre',)

@admin.register(Raza)
class RazaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'especie')
    search_fields = ('nombre',)
    list_filter = ('especie',)

@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'cliente', 'especie', 'raza', 'sexo', 'activo')
    search_fields = ('nombre', 'cliente__nombre', 'cliente__apellido')
    list_filter = ('especie', 'raza', 'sexo', 'activo')

@admin.register(FotoMascota)
class FotoMascotaAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'es_principal', 'fecha_subida')
    list_filter = ('es_principal',)

@admin.register(RegistroPeso)
class RegistroPesoAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'peso', 'fecha_registro')
    search_fields = ('mascota__nombre',)
    list_filter = ('fecha_registro',)