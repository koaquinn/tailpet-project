# clientes/serializers.py
from rest_framework import serializers
from .models import Cliente, DireccionCliente

class DireccionClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DireccionCliente
        fields = '__all__'

class ClienteSerializer(serializers.ModelSerializer):
    direcciones = DireccionClienteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Cliente
        fields = '__all__'