# historial_medico/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (HistorialMedico, TipoConsulta, Consulta, Tratamiento, 
                     TipoDocumento, Documento, Vacuna, MascotaVacuna, 
                     Receta, DetalleReceta)
from .serializers import (HistorialMedicoSerializer, TipoConsultaSerializer, 
                         ConsultaSerializer, TratamientoSerializer, 
                         TipoDocumentoSerializer, DocumentoSerializer,
                         VacunaSerializer, MascotaVacunaSerializer,
                         RecetaSerializer, DetalleRecetaSerializer)

class HistorialMedicoViewSet(viewsets.ModelViewSet):
    queryset = HistorialMedico.objects.all()
    serializer_class = HistorialMedicoSerializer
    filterset_fields = ['mascota', 'veterinario']

class TipoConsultaViewSet(viewsets.ModelViewSet):
    queryset = TipoConsulta.objects.all()
    serializer_class = TipoConsultaSerializer

class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all()
    serializer_class = ConsultaSerializer
    filterset_fields = ['historial', 'veterinario', 'fecha', 'tipo_consulta']
    search_fields = ['motivo_consulta', 'diagnostico']

class TratamientoViewSet(viewsets.ModelViewSet):
    queryset = Tratamiento.objects.all()
    serializer_class = TratamientoSerializer
    filterset_fields = ['historial', 'inicio_tratamiento']

class TipoDocumentoViewSet(viewsets.ModelViewSet):
    queryset = TipoDocumento.objects.all()
    serializer_class = TipoDocumentoSerializer

class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    filterset_fields = ['mascota', 'historial', 'tipo_documento', 'fecha_subida']

class VacunaViewSet(viewsets.ModelViewSet):
    queryset = Vacuna.objects.all()
    serializer_class = VacunaSerializer
    filterset_fields = ['especie', 'tipo']

class MascotaVacunaViewSet(viewsets.ModelViewSet):
    queryset = MascotaVacuna.objects.all()
    serializer_class = MascotaVacunaSerializer
    filterset_fields = ['mascota', 'vacuna', 'fecha_aplicacion', 'veterinario']

class RecetaViewSet(viewsets.ModelViewSet):
    queryset = Receta.objects.all()
    serializer_class = RecetaSerializer
    filterset_fields = ['mascota', 'veterinario', 'fecha_emision', 'estado']
    @action(detail=True, methods=['post'], url_path='marcar-completada')
    def marcar_completada(self, request, pk=None):
        """
        Marca una receta como completada y registra los movimientos de inventario
        """
        receta = self.get_object()
        if receta.estado == 'COMPLETADA':
            return Response({'error': 'La receta ya está completada'}, status=400)
        
        # Transacción atómica para asegurar que todo se completa o nada
        with transaction.atomic():
            receta.estado = 'COMPLETADA'
            receta.save()
            
            for detalle in receta.detalles.all():
                # Buscar lotes disponibles
                lotes = detalle.medicamento.lotes.filter(
                    cantidad__gte=detalle.cantidad
                ).order_by('fecha_vencimiento')
                
                if not lotes.exists():
                    # Rollback de la transacción
                    raise ValidationError(
                        f'No hay suficiente stock de {detalle.medicamento.nombre}'
                    )
                
                lote = lotes.first()
                
                # Registrar movimiento
                MovimientoInventario.objects.create(
                    medicamento=detalle.medicamento,
                    lote=lote,
                    tipo='SALIDA',
                    cantidad=detalle.cantidad,
                    fecha=timezone.now(),
                    usuario=request.user,
                    motivo=f"Receta #{receta.id} para {receta.mascota.nombre}",
                    afecta_stock=True
                )
        
        return Response({'status': 'La receta ha sido completada'})

class DetalleRecetaViewSet(viewsets.ModelViewSet):
    queryset = DetalleReceta.objects.all()
    serializer_class = DetalleRecetaSerializer
    filterset_fields = ['receta', 'medicamento']