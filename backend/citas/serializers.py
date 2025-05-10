# citas/serializers.py
from rest_framework import serializers
from .models import Consulta

class ConsultaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.ReadOnlyField(source='mascota.nombre')
    veterinario_nombre = serializers.ReadOnlyField(source='veterinario.get_full_name')
    
    class Meta:
        model = Consulta
        fields = '__all__'