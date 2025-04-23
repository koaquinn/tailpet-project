# historial_medico/admin.py
from django.contrib import admin
from .models import (HistorialMedico, TipoConsulta, Consulta, 
                     Tratamiento, TipoDocumento, Documento)

@admin.register(HistorialMedico)
class HistorialMedicoAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'veterinario', 'fecha')
    search_fields = ('mascota__nombre',)

@admin.register(TipoConsulta)
class TipoConsultaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'duracion_estimada')

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ('historial', 'veterinario', 'tipo_consulta', 'fecha')
    search_fields = ('historial__mascota__nombre', 'veterinario__username')
    list_filter = ('fecha', 'tipo_consulta')

@admin.register(Tratamiento)
class TratamientoAdmin(admin.ModelAdmin):
    list_display = ('historial', 'inicio_tratamiento', 'fin_tratamiento')
    search_fields = ('historial__mascota__nombre',)
    list_filter = ('inicio_tratamiento',)

@admin.register(TipoDocumento)
class TipoDocumentoAdmin(admin.ModelAdmin):
    list_display = ('nombre',)

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'tipo_documento', 'nombre_archivo', 'fecha_subida')
    search_fields = ('mascota__nombre', 'nombre_archivo')
    list_filter = ('tipo_documento', 'fecha_subida')