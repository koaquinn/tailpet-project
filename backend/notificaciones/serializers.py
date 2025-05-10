# notificaciones/serializers.py
from rest_framework import serializers
from .models import Notificacion

class NotificacionSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.ReadOnlyField(source='cliente.nombre')
    mascota_nombre = serializers.ReadOnlyField(source='mascota.nombre')
    
    class Meta:
        model = Notificacion
        fields = '__all__'