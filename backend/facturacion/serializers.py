# facturacion/serializers.py
from rest_framework import serializers
from .models import MetodoPago, Servicio, Factura, DetalleFactura

class MetodoPagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetodoPago
        fields = '__all__'

class ServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Servicio
        fields = '__all__'

class DetalleFacturaSerializer(serializers.ModelSerializer):
    factura_id = serializers.ReadOnlyField(source='factura.id')
    
    class Meta:
        model = DetalleFactura
        fields = '__all__'

class FacturaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre')
    detalles = DetalleFacturaSerializer(many=True, read_only=True)
    metodo_pago_nombre = serializers.ReadOnlyField(source='metodo_pago.nombre')
    
    class Meta:
        model = Factura
        fields = '__all__'