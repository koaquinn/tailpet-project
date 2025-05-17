# backend/citas/views.py
import logging
from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Consulta # Modelo de la app 'citas'
from .serializers import ConsultaSerializer # Serializer de la app 'citas'

# Modelos y Serializers de otras apps
from historial_medico.models import (
    HistorialMedico, 
    Consulta as HistorialConsulta, # Modelo Consulta de la app 'historial_medico'
    TipoConsulta,
    Receta,         # <--- IMPORTANTE PARA LA NUEVA ACCIÓN
    DetalleReceta   # <--- IMPORTANTE PARA LA NUEVA ACCIÓN
)
from historial_medico.serializers import ConsultaSerializer as HistorialConsultaSerializer
# Podrías crear un DetalleRecetaSerializer si quieres más control o campos anidados
# from historial_medico.serializers import DetalleRecetaSerializer 

from mascotas.models import RegistroPeso
from mascotas.serializers import RegistroPesoSerializer

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
        # ... (código existente de completar_consulta sin cambios) ...
        # Esta función ya está bien como la teníamos.
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
            diagnostico = request.data.get('diagnostico', '')
            observaciones = request.data.get('observaciones', '')
            temperatura = request.data.get('temperatura')
            peso = request.data.get('peso_actual') or request.data.get('peso') 
            sintomas = request.data.get('sintomas', '')
            tratamiento_texto = request.data.get('tratamiento', '') # Renombrado para evitar confusión con el modelo Tratamiento

            update_data = {
                'estado': 'COMPLETADA',
                'diagnostico': diagnostico,
                'observaciones': observaciones,
                'sintomas': sintomas,
                'tratamiento': tratamiento_texto # Asegúrate que el campo en Consulta (citas) se llame 'tratamiento'
            }
            
            if temperatura is not None:
                update_data['temperatura'] = temperatura
            if peso is not None:
                update_data['peso'] = peso 

            serializer = self.get_serializer(consulta, data=update_data, partial=True)
            serializer.is_valid(raise_exception=True)
            consulta_actualizada = serializer.save() # Guardamos la instancia actualizada

            historial, created = HistorialMedico.objects.get_or_create(
                mascota=consulta_actualizada.mascota,
                defaults={'veterinario': consulta_actualizada.veterinario}
            )

            consulta_existente_en_historial = HistorialConsulta.objects.filter(
                historial=historial,
                cita_relacionada=consulta_actualizada.id
            ).first()

            tipo_consulta_mapping = {
                'RUTINA': 'Control de rutina', 'EMERGENCIA': 'Emergencia', 'SEGUIMIENTO': 'Seguimiento'
            }
            tipo_consulta_obj, _ = TipoConsulta.objects.get_or_create(
                nombre=tipo_consulta_mapping.get(consulta_actualizada.tipo, 'Control de rutina'),
                defaults={
                    'duracion_estimada': getattr(consulta_actualizada, 'duracion_estimada', 30), # Añadir default
                    'descripcion': f'Tipo de consulta para {consulta_actualizada.tipo.lower() if consulta_actualizada.tipo else "desconocido"}'
                }
            )

            historial_data_dict = {
                'veterinario': consulta_actualizada.veterinario,
                'tipo_consulta': tipo_consulta_obj,
                'fecha': timezone.now().date(),
                'motivo_consulta': consulta_actualizada.motivo,
                'diagnostico': diagnostico,
                'observaciones': observaciones,
                'sintomas': sintomas,
                'tratamiento': tratamiento_texto, # Usar el mismo campo que en Consulta (citas)
            }
            if temperatura is not None: historial_data_dict['temperatura'] = temperatura
            if peso is not None: historial_data_dict['peso'] = peso
            
            if consulta_existente_en_historial:
                for key, value in historial_data_dict.items():
                    setattr(consulta_existente_en_historial, key, value)
                consulta_existente_en_historial.save()
                historial_consulta_serializado = HistorialConsultaSerializer(consulta_existente_en_historial).data
                mensaje_historial = "Consulta completada y actualizada en el historial médico."
            else:
                historial_data_dict['historial'] = historial
                historial_data_dict['cita_relacionada'] = consulta_actualizada.id
                nueva_historial_consulta = HistorialConsulta.objects.create(**historial_data_dict)
                historial_consulta_serializado = HistorialConsultaSerializer(nueva_historial_consulta).data
                mensaje_historial = "Consulta completada y registrada en el historial médico."

            if peso is not None and consulta_actualizada.mascota:
                try:
                    rp_data = {'mascota': consulta_actualizada.mascota.id, 'peso': peso, 'fecha_registro': timezone.now().date()}
                    rp_s = RegistroPesoSerializer(data=rp_data)
                    if rp_s.is_valid():
                        rp_s.save()
                        logger.info(f"Peso {peso}kg reg. para mascota {consulta_actualizada.mascota.id} (consulta {pk})")
                    else:
                        logger.error(f"Error serial. RegistroPeso mascota {consulta_actualizada.mascota.id}: {rp_s.errors}")
                except Exception as e_rp:
                    logger.error(f"Error creando RegistroPeso mascota {consulta_actualizada.mascota.id}: {str(e_rp)}")
            
            return Response({
                "consulta": serializer.data, # serializer es de citas.Consulta
                "historial_consulta": historial_consulta_serializado,
                "message": mensaje_historial
            })
        except Exception as e:
            logger.error(f"Error al completar consulta {pk}: {str(e)}")
            return Response({"error": f"Error al completar la consulta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @transaction.atomic
    @action(detail=True, methods=['post'], url_path='medicamentos')
    def registrar_medicamentos(self, request, pk=None):
        # ... (código existente de registrar_medicamentos sin cambios) ...
        # Esta función ya está bien como la teníamos para CREAR recetas.
        consulta = self.get_object()
        medicamentos_data = request.data.get('medicamentos', [])
        
        if not medicamentos_data:
            return Response({"error": "No se proporcionaron medicamentos para registrar."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # No es estrictamente necesario buscar el HistorialMedico o HistorialConsulta aquí
            # si la Receta se va a vincular directamente con la consulta.mascota y consulta.veterinario
            # y usar consulta.id en las observaciones.

            # Crear receta
            receta = Receta.objects.create(
                mascota=consulta.mascota,
                veterinario=consulta.veterinario,
                fecha_emision=timezone.now().date(),
                fecha_vencimiento=timezone.now().date() + timezone.timedelta(days=30), # Ejemplo de vencimiento
                estado='ACTIVA',
                observaciones=f"Receta generada desde consulta #{consulta.id}" # Vínculo importante
            )
            
            detalles_creados_info = []
            for med_data in medicamentos_data:
                # Asumiendo que med_data['medicamento'] es el ID de un inventario.Medicamento
                detalle = DetalleReceta.objects.create(
                    receta=receta,
                    medicamento_id=med_data['medicamento'],
                    dosis=med_data.get('dosis', 'N/A'),
                    frecuencia=med_data.get('frecuencia', 'N/A'),
                    duracion=med_data.get('duracion', 'N/A'),
                    cantidad=med_data.get('cantidad', 1),
                    instrucciones=med_data.get('instrucciones', f"Seguir indicaciones - {med_data.get('dosis','')} {med_data.get('frecuencia','')} por {med_data.get('duracion','')}"),
                )
                detalles_creados_info.append({
                    'id': detalle.id,
                    'medicamento_nombre': detalle.medicamento.nombre, # Asumiendo que el modelo Medicamento tiene 'nombre'
                    'dosis': detalle.dosis,
                    'frecuencia': detalle.frecuencia,
                    'duracion': detalle.duracion,
                    'cantidad': detalle.cantidad
                })
            
            return Response({
                "receta_id": receta.id,
                "medicamentos": detalles_creados_info,
                "message": "Medicamentos registrados correctamente."
            })
        except Exception as e:
            logger.error(f"Error al registrar medicamentos para consulta {pk}: {str(e)}")
            return Response({"error": f"Error al registrar medicamentos: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- NUEVA ACCIÓN PARA OBTENER LA RECETA ---
    @action(detail=True, methods=['get'], url_path='receta-completa')
    def obtener_receta_completa(self, request, pk=None):
        """
        Obtiene la receta completa (con sus detalles) asociada a una consulta (cita) específica.
        El 'pk' aquí es el ID de la 'citas.models.Consulta'.
        """
        consulta_cita = self.get_object() # Obtiene la instancia de citas.models.Consulta

        try:
            # Buscar la Receta. La forma más robusta sería un ForeignKey directo
            # desde historial_medico.Receta a citas.Consulta.
            # Como alternativa, usamos la observación y la mascota/fecha.
            # Esta lógica de búsqueda puede necesitar ajustes finos según tus datos.
            receta_obj = Receta.objects.filter(
                mascota=consulta_cita.mascota,
                # Podrías añadir un filtro de fecha si es relevante, ej:
                # fecha_emision__date=consulta_cita.fecha.date(), 
                observaciones__icontains=f"consulta #{consulta_cita.id}"
            ).order_by('-fecha_emision', '-id').first() # La más reciente que coincida

            if not receta_obj:
                return Response({
                    "id_receta": None,
                    "fecha_emision": None,
                    "observaciones_receta": "No se encontró una receta directamente asociada a esta consulta por su ID en las observaciones.",
                    "medicamentos": []
                }, status=status.HTTP_200_OK) # Devolvemos 200 con medicamentos vacíos si no se encuentra

            detalles_receta = DetalleReceta.objects.filter(receta=receta_obj)
            
            medicamentos_data = []
            for detalle in detalles_receta:
                medicamentos_data.append({
                    "id": detalle.id, # ID del DetalleReceta
                    "medicamento_id_inventario": detalle.medicamento.id, # ID del Medicamento en inventario
                    "nombre": detalle.medicamento.nombre, # Asumiendo que el modelo Medicamento tiene 'nombre'
                    "dosis": detalle.dosis,
                    "frecuencia": detalle.frecuencia,
                    "duracion": detalle.duracion,
                    "cantidad": detalle.cantidad,
                    "instrucciones": detalle.instrucciones
                })
            
            return Response({
                "id_receta": receta_obj.id,
                "fecha_emision": receta_obj.fecha_emision,
                "observaciones_receta": receta_obj.observaciones,
                "medicamentos": medicamentos_data
            })

        except Exception as e:
            logger.error(f"Error al obtener receta completa para consulta {pk}: {str(e)}")
            return Response({"error": f"Error interno al obtener la receta: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
