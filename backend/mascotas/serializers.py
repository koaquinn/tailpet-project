# mascotas/serializers.py
from rest_framework import serializers
from .models import Especie, Raza, Mascota, FotoMascota, RegistroPeso

class EspecieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especie
        fields = '__all__'

class RazaSerializer(serializers.ModelSerializer):
    especie_nombre = serializers.ReadOnlyField(source='especie.nombre')
    
    class Meta:
        model = Raza
        fields = '__all__'

class RegistroPesoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroPeso
        fields = '__all__'

class FotoMascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoMascota
        fields = '__all__'

class MascotaSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre')
    especie_nombre = serializers.ReadOnlyField(source='especie.nombre')
    raza_nombre = serializers.ReadOnlyField(source='raza.nombre')
    
    class Meta:
        model = Mascota
        fields = '__all__'