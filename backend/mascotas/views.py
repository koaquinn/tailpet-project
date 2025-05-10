# mascotas/views.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from historial_medico.serializers import ConsultaSerializer, TratamientoSerializer, MascotaVacunaSerializer

from .models import Especie, Raza, Mascota, FotoMascota, RegistroPeso
from .serializers import (EspecieSerializer, RazaSerializer, MascotaSerializer, 
                          FotoMascotaSerializer, RegistroPesoSerializer)
from django_filters.rest_framework import DjangoFilterBackend
from .filters import MascotaFilter, RegistroPesoFilter


class EspecieViewSet(viewsets.ModelViewSet):
    queryset = Especie.objects.all()
    serializer_class = EspecieSerializer

class RazaViewSet(viewsets.ModelViewSet):
    queryset = Raza.objects.all()
    serializer_class = RazaSerializer
    filterset_fields = ['especie']

class MascotaViewSet(viewsets.ModelViewSet):
    queryset = Mascota.objects.all()
    serializer_class = MascotaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MascotaFilter
    search_fields = ['nombre', 'microchip', 'cliente__nombre', 'cliente__apellido']
    ordering_fields = ['nombre', 'fecha_nacimiento', 'cliente__nombre']

    @action(detail=True, methods=['get'])
    def historial_completo(self, request, pk=None):
        """
        Devuelve el historial médico completo de una mascota
        """
        mascota = self.get_object()
        try:
            historial = mascota.historial
            data = {
                'mascota': self.get_serializer(mascota).data,
                'consultas': ConsultaSerializer(historial.consultas.all(), many=True).data,
                'tratamientos': TratamientoSerializer(historial.tratamientos.all(), many=True).data,
                'vacunaciones': MascotaVacunaSerializer(mascota.vacunaciones.all(), many=True).data,
                'registros_peso': RegistroPesoSerializer(mascota.registros_peso.all(), many=True).data,
            }
            return Response(data)
        except:
            return Response({'error': 'Esta mascota no tiene historial médico'}, status=404)
    
    @action(detail=True, methods=['get'])
    def foto_principal(self, request, pk=None):
        """
        Devuelve la foto principal de una mascota
        """
        mascota = self.get_object()
        foto = mascota.fotos.filter(es_principal=True).first()
        if foto:
            return Response(FotoMascotaSerializer(foto).data)
        return Response({'error': 'No hay foto principal'}, status=404)
    
    @action(detail=True, methods=['post'], url_path='registrar-peso')
    def registrar_peso(self, request, pk=None):
        """
        Registra un nuevo peso para la mascota
        """
        mascota = self.get_object()
        data = request.data.copy()
        data['mascota'] = mascota.id
        
        serializer = RegistroPesoSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=201)

class FotoMascotaViewSet(viewsets.ModelViewSet):
    queryset = FotoMascota.objects.all()
    serializer_class = FotoMascotaSerializer
    
class RegistroPesoViewSet(viewsets.ModelViewSet):
    queryset = RegistroPeso.objects.all()
    serializer_class = RegistroPesoSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = RegistroPesoFilter
    ordering_fields = ['fecha_registro', 'peso']