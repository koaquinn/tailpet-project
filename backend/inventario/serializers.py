from rest_framework import serializers
from .models import Proveedor, DireccionProveedor, Medicamento, LoteMedicamento, MovimientoInventario
from django.core.validators import MinValueValidator

class DireccionProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = DireccionProveedor
        fields = '__all__'
        extra_kwargs = {
            'proveedor': {'required': True}
        }

class ProveedorSerializer(serializers.ModelSerializer):
    direcciones = DireccionProveedorSerializer(many=True, read_only=True)
    
    class Meta:
        model = Proveedor
        fields = '__all__'
        extra_kwargs = {
            'nombre': {'required': True},
            'telefono': {'required': True},
            'email': {'required': True}
        }

class MedicamentoSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    
    class Meta:
        model = Medicamento
        fields = '__all__'
        extra_kwargs = {
            'nombre': {'required': True},
            'presentacion': {'required': True},
            'proveedor': {'required': True},
            'precio_compra': {
                'required': True,
                'validators': [MinValueValidator(0.01)]
            },
            'precio_venta': {
                'required': True,
                'validators': [MinValueValidator(0.01)]
            },
            'stock_minimo': {
                'required': True,
                'validators': [MinValueValidator(0)]
            }
        }

class LoteMedicamentoSerializer(serializers.ModelSerializer):
    medicamento_nombre = serializers.ReadOnlyField(source='medicamento.nombre')
    proveedor_nombre = serializers.ReadOnlyField(source='proveedor.nombre')
    
    class Meta:
        model = LoteMedicamento
        fields = '__all__'
        extra_kwargs = {
            'medicamento': {'required': True},
            'numero_lote': {'required': True},
            'fecha_vencimiento': {'required': True},
            'cantidad': {
                'required': True,
                'validators': [MinValueValidator(0)]
            },
            'proveedor': {'required': True},
            'precio_compra': {
                'required': True,
                'validators': [MinValueValidator(0.01)]
            }
        }
    
    def validate_cantidad(self, value):
        if value < 0:
            raise serializers.ValidationError("La cantidad debe ser un número positivo")
        return value
    
    def validate_precio_compra(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio de compra debe ser mayor que cero")
        return value

class MovimientoInventarioSerializer(serializers.ModelSerializer):
    medicamento_nombre = serializers.ReadOnlyField(source='medicamento.nombre')
    usuario_nombre = serializers.ReadOnlyField(source='usuario.get_full_name')
    
    class Meta:
        model = MovimientoInventario
        fields = '__all__'
        extra_kwargs = {
            'medicamento': {'required': True},
            'tipo': {'required': True},
            'cantidad': {
                'required': True,
                'validators': [MinValueValidator(0.01)]
            },
            'fecha': {'required': True},
            'usuario': {'required': True},
            'afecta_stock': {'required': True}
        }
    
    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor que cero")
        return value
    
    def validate(self, data):
        if data['tipo'] == 'SALIDA' and data['cantidad'] > data['medicamento'].stock_disponible():
            raise serializers.ValidationError(
                {"cantidad": "No hay suficiente stock disponible para esta salida"}
            )
        return data