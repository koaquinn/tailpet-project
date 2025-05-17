# historial_medico/admin.py
from django.contrib import admin
from .models import (HistorialMedico, TipoConsulta, Consulta, 
                     Tratamiento, TipoDocumento, Documento, Vacuna, MascotaVacuna, Receta, DetalleReceta)

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

@admin.register(Vacuna)
class VacunaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'especie', 'tipo', 'intervalo_revacunacion')
    list_filter = ('especie', 'tipo')
    search_fields = ('nombre',)

@admin.register(MascotaVacuna)
class MascotaVacunaAdmin(admin.ModelAdmin):
    list_display = ('mascota', 'vacuna', 'fecha_aplicacion', 'fecha_proxima', 'veterinario')
    list_filter = ('vacuna', 'fecha_aplicacion', 'veterinario')
    search_fields = ('mascota__nombre', 'vacuna__nombre', 'veterinario__username')

class DetalleRecetaInline(admin.TabularInline):
    model = DetalleReceta
    extra = 1 
    fields = ('medicamento', 'dosis', 'frecuencia', 'duracion', 'cantidad', 'instrucciones')
    autocomplete_fields = ['medicamento'] 
    # Para que funcione bien autocomplete_fields en inlines, el ModelAdmin del modelo referenciado
    # (en este caso MedicamentoAdmin en inventario/admin.py) debe tener search_fields definidos.
    # También, puede ser necesario definir min_num = 0 si quieres permitir recetas sin detalles inicialmente.
    min_num = 0 
    verbose_name_plural = "Medicamentos de la Receta"


@admin.register(Receta)
class RecetaAdmin(admin.ModelAdmin):
    list_display = ('id', 'mascota', 'veterinario', 'fecha_emision', 'estado', 'created_at')
    list_filter = ('estado', 'fecha_emision', 'veterinario__username', 'mascota__especie')
    search_fields = ('mascota__nombre', 'veterinario__username', 'observaciones', 'detalles__medicamento__nombre')
    date_hierarchy = 'fecha_emision'
    autocomplete_fields = ['mascota', 'veterinario']
    inlines = [DetalleRecetaInline]
    list_select_related = ('mascota', 'veterinario') # Optimización
    readonly_fields = ('created_at', 'updated_at') # Suponiendo que vienen de BaseModel
    
    fieldsets = (
        (None, {
            'fields': ('mascota', 'veterinario', 'estado')
        }),
        ('Fechas de la Receta', {
            'fields': ('fecha_emision', 'fecha_vencimiento')
        }),
        ('Información Adicional', {
            'fields': ('observaciones',),
        }),
         ('Auditoría', { # Si tienes campos de BaseModel como created_at, updated_at
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

@admin.register(DetalleReceta)
class DetalleRecetaAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_receta_info', 'get_medicamento_nombre', 'dosis', 'cantidad')
    list_filter = ('medicamento__nombre', 'receta__mascota__especie', 'receta__fecha_emision')
    search_fields = ('medicamento__nombre', 'receta__mascota__nombre', 'dosis', 'instrucciones')
    autocomplete_fields = ['receta', 'medicamento']
    list_select_related = ('receta__mascota', 'receta__veterinario', 'medicamento') # Optimización

    # fields = ('receta', 'medicamento', ('dosis', 'frecuencia', 'duracion'), 'cantidad', 'instrucciones') # Para el form individual

    def get_receta_info(self, obj):
        return f"ID Rec: {obj.receta.id} ({obj.receta.mascota.nombre} - {obj.receta.fecha_emision.strftime('%d/%m/%Y')})"
    get_receta_info.short_description = 'Receta'
    get_receta_info.admin_order_field = 'receta__fecha_emision'

    def get_medicamento_nombre(self, obj):
        return obj.medicamento.nombre
    get_medicamento_nombre.short_description = 'Medicamento'
    get_medicamento_nombre.admin_order_field = 'medicamento__nombre'