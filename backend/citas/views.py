# citas/views.py
from rest_framework import viewsets
from .models import Consulta
from .serializers import ConsultaSerializer

class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all()
    serializer_class = ConsultaSerializer
    filterset_fields = ['mascota', 'veterinario', 'fecha', 'estado', 'tipo']
    search_fields = ['motivo', 'diagnostico']