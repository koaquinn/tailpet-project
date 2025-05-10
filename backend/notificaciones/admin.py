# notificaciones/admin.py
from django.contrib import admin
from .models import Notificacion

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'mascota', 'tipo', 'medio', 'fecha_programada', 'estado')
    list_filter = ('tipo', 'medio', 'estado', 'fecha_programada')
    search_fields = ('cliente__nombre', 'cliente__apellido', 'mascota__nombre', 'mensaje')
    date_hierarchy = 'fecha_programada'