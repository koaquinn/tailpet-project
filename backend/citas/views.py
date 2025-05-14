# backend/citas/views.py (corregido con manejo de campos inconsistentes)
import logging
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Consulta
from .serializers import ConsultaSerializer
from historial_medico.models import HistorialMedico, Consulta as HistorialConsulta, TipoConsulta
from historial_medico.serializers import ConsultaSerializer as HistorialConsultaSerializer
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all().order_by('-fecha', 'id')
    serializer_class = ConsultaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['mascota', 'veterinario', 'fecha', 'estado', 'tipo']
    search_fields = ['motivo', 'diagnostico']
    ordering_fields = ['fecha', 'id', 'mascota__nombre', 'estado']
    ordering = ['-fecha', 'id']
    
    @transaction.atomic
    @action(detail=True, methods=['patch'], url_path='completar')
    def completar_consulta(self, request, pk=None):
        """
        Completa una consulta y registra automáticamente en el historial médico.
        """
        consulta = self.get_object()
        
        if consulta.estado == 'COMPLETADA':
            return Response(
                {"error": "La consulta ya fue completada anteriormente."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not request.data.get('diagnostico'):
            return Response(
                {"error": "El diagnóstico es obligatorio para completar la consulta."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obtener todos los datos clínicos del request
            diagnostico = request.data.get('diagnostico', '')
            observaciones = request.data.get('observaciones', '')
            
            # Corregir nombre de campos inconsistentes entre frontend y backend
            temperatura = request.data.get('temperatura')
            # El frontend envía 'peso_actual' pero el modelo usa 'peso'
            peso = request.data.get('peso_actual') or request.data.get('peso')
            sintomas = request.data.get('sintomas', '')
            tratamiento = request.data.get('tratamiento', '')
            
            # Crear estructura de datos para actualizar
            update_data = {
                'estado': 'COMPLETADA',
                'diagnostico': diagnostico,
                'observaciones': observaciones,
                'sintomas': sintomas,
                'tratamiento': tratamiento
            }
            
            # Añadir campos numéricos solo si son válidos
            if temperatura is not None:
                update_data['temperatura'] = temperatura
            if peso is not None:
                update_data['peso'] = peso
                
            # Log para debug
            logger.info(f"Actualizando consulta {pk} con datos: {update_data}")
            
            # Actualizar datos de la consulta
            serializer = self.get_serializer(consulta, data=update_data, partial=True)
            serializer.is_valid(raise_exception=True)
            consulta = serializer.save()
            
            # Buscar o crear historial médico para la mascota
            historial, created = HistorialMedico.objects.get_or_create(
                mascota=consulta.mascota,
                defaults={'veterinario': consulta.veterinario}
            )
            
            # Verificar si ya existe una consulta en el historial para esta cita
            consulta_existente = HistorialConsulta.objects.filter(
                historial=historial,
                cita_relacionada=consulta.id
            ).first()
            
            # Buscar o crear tipo de consulta basado en el tipo de cita
            tipo_consulta_mapping = {
                'RUTINA': 'Control de rutina',
                'EMERGENCIA': 'Emergencia',
                'SEGUIMIENTO': 'Seguimiento'
            }
            
            tipo_consulta, _ = TipoConsulta.objects.get_or_create(
                nombre=tipo_consulta_mapping.get(consulta.tipo, 'Control de rutina'),
                defaults={
                    'duracion_estimada': consulta.duracion_estimada,
                    'descripcion': f'Tipo de consulta para {consulta.tipo.lower()}'
                }
            )
            
            # Preparar datos para el historial
            historial_data = {
                'veterinario': consulta.veterinario,
                'tipo_consulta': tipo_consulta,
                'fecha': timezone.now().date(),
                'motivo_consulta': consulta.motivo,
                'diagnostico': diagnostico,
                'observaciones': observaciones,
                'sintomas': sintomas,
                'tratamiento': tratamiento,
            }
            
            # Añadir campos numéricos solo si son válidos
            if temperatura is not None:
                historial_data['temperatura'] = temperatura
            if peso is not None:
                historial_data['peso'] = peso
            
            if consulta_existente:
                # Actualizar la consulta existente
                for key, value in historial_data.items():
                    setattr(consulta_existente, key, value)
                consulta_existente.save()
                
                historial_consulta_data = HistorialConsultaSerializer(consulta_existente).data
                mensaje = "Consulta completada y actualizada en el historial médico."
            else:
                # Crear una nueva entrada en el historial médico
                historial_data['historial'] = historial
                historial_data['cita_relacionada'] = consulta.id
                
                historial_consulta = HistorialConsulta.objects.create(**historial_data)
                historial_consulta_data = HistorialConsultaSerializer(historial_consulta).data
                mensaje = "Consulta completada y registrada en el historial médico."
            
            return Response({
                "consulta": serializer.data,
                "historial_consulta": historial_consulta_data,
                "message": mensaje
            })
            
        except Exception as e:
            logger.error(f"Error al completar consulta {pk}: {str(e)}")
            return Response(
                {"error": f"Error al completar la consulta: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    @action(detail=True, methods=['post'], url_path='medicamentos')
    def registrar_medicamentos(self, request, pk=None):
        """
        Registra medicamentos recetados durante la consulta.
        """
        consulta = self.get_object()
        medicamentos_data = request.data.get('medicamentos', [])
        
        if not medicamentos_data:
            return Response(
                {"error": "No se proporcionaron medicamentos para registrar."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Buscar historial médico
            historial = get_object_or_404(HistorialMedico, mascota=consulta.mascota)
            
            # Buscar la consulta en el historial
            historial_consulta = HistorialConsulta.objects.filter(
                historial=historial,
                cita_relacionada=consulta.id
            ).first()
            
            if not historial_consulta:
                return Response(
                    {"error": "No se encontró la consulta en el historial médico."},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Registrar medicamentos
            from historial_medico.models import Receta, DetalleReceta
            
            # Crear receta
            receta = Receta.objects.create(
                mascota=consulta.mascota,
                veterinario=consulta.veterinario,
                fecha_emision=timezone.now().date(),
                fecha_vencimiento=timezone.now().date() + timezone.timedelta(days=30),
                estado='ACTIVA',
                observaciones=f"Receta generada desde consulta #{consulta.id}"
            )
            
            # Registrar medicamentos
            detalles_creados = []
            for med_data in medicamentos_data:
                detalle = DetalleReceta.objects.create(
                    receta=receta,
                    medicamento_id=med_data['medicamento'],
                    dosis=med_data['dosis'],
                    frecuencia=med_data['frecuencia'],
                    duracion=med_data['duracion'],
                    cantidad=med_data['cantidad'],
                    instrucciones=f"Seguir indicaciones - {med_data['dosis']} {med_data['frecuencia']} por {med_data['duracion']}"
                )
                detalles_creados.append({
                    'id': detalle.id,
                    'medicamento': detalle.medicamento.nombre,
                    'dosis': detalle.dosis,
                    'frecuencia': detalle.frecuencia,
                    'duracion': detalle.duracion,
                    'cantidad': detalle.cantidad
                })
            
            return Response({
                "receta_id": receta.id,
                "medicamentos": detalles_creados,
                "message": "Medicamentos registrados correctamente."
            })
            
        except Exception as e:
            logger.error(f"Error al registrar medicamentos para consulta {pk}: {str(e)}")
            return Response(
                {"error": f"Error al registrar medicamentos: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )