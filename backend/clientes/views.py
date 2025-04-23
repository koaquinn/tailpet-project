# clientes/views.py
from rest_framework import viewsets
from .models import Cliente, DireccionCliente
from .serializers import ClienteSerializer, DireccionClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filterset_fields = ['rut', 'email', 'activo']
    search_fields = ['nombre', 'apellido', 'rut', 'email']

class DireccionClienteViewSet(viewsets.ModelViewSet):
    queryset = DireccionCliente.objects.all()
    serializer_class = DireccionClienteSerializer