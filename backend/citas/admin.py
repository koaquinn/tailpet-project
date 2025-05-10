# citas/admin.py
from django.contrib import admin
from .models import Consulta

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'veterinario', 'fecha', 'tipo', 'estado')
    list_filter = ('estado', 'tipo', 'fecha')
    search_fields = ('mascota__nombre', 'veterinario__first_name', 'veterinario__last_name')
    date_hierarchy = 'fecha'