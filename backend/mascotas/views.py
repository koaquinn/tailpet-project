# mascotas/views.py
from rest_framework import viewsets
from .models import Especie, Raza, Mascota, FotoMascota, RegistroPeso
from .serializers import (EspecieSerializer, RazaSerializer, MascotaSerializer, 
                          FotoMascotaSerializer, RegistroPesoSerializer)

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
    filterset_fields = ['cliente', 'especie', 'raza', 'activo']
    search_fields = ['nombre', 'microchip']

class FotoMascotaViewSet(viewsets.ModelViewSet):
    queryset = FotoMascota.objects.all()
    serializer_class = FotoMascotaSerializer
    
class RegistroPesoViewSet(viewsets.ModelViewSet):
    queryset = RegistroPeso.objects.all()
    serializer_class = RegistroPesoSerializer
    filterset_fields = ['mascota']