from rest_framework import serializers
from .models import Proveedor, DireccionProveedor, Medicamento, LoteMedicamento, MovimientoInventario

class DireccionProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DireccionProveedor
        fields = '__all__'

class ProveedorSerializer(serializers.ModelSerializer):
    direcciones = DireccionProveedorSerializer(many=True, read_only=True)
    
    class Meta:
        model = Proveedor
        fields = '__all__'

class MedicamentoSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    
    class Meta:
        model = Medicamento
        fields = '__all__'

class LoteMedicamentoSerializer(serializers.ModelSerializer):
    medicamento_nombre = serializers.ReadOnlyField(source='medicamento.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    
    class Meta:
        model = LoteMedicamento
        fields = '__all__'

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    medicamento_nombre = serializers.ReadOnlyField(source='medicamento.nombre')
    usuario_nombre = serializers.ReadOnlyField(source='usuario.get_full_name')
    
    class Meta:
        model = MovimientoInventario
        fields = '__all__'