# facturacion/views.py
from rest_framework import viewsets
from .models import MetodoPago, Servicio, Factura, DetalleFactura
from .serializers import MetodoPagoSerializer, ServicioSerializer, FacturaSerializer, DetalleFacturaSerializer

class MetodoPagoViewSet(viewsets.ModelViewSet):
    queryset = MetodoPago.objects.all()
    serializer_class = MetodoPagoSerializer
    filterset_fields = ['activo']

class ServicioViewSet(viewsets.ModelViewSet):
    queryset = Servicio.objects.all()
    serializer_class = ServicioSerializer
    filterset_fields = ['activo']
    search_fields = ['nombre']

class FacturaViewSet(viewsets.ModelViewSet):
    queryset = Factura.objects.all()
    serializer_class = FacturaSerializer
    filterset_fields = ['cliente', 'fecha_emision', 'estado']
    search_fields = ['cliente__nombre', 'cliente__apellido']

class DetalleFacturaViewSet(viewsets.ModelViewSet):
    queryset = DetalleFactura.objects.all()
    serializer_class = DetalleFacturaSerializer
    filterset_fields = ['factura', 'tipo_item']