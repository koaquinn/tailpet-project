# backend/citas/serializers.py (actualizado)
from rest_framework import serializers
from .models import Consulta

class ConsultaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.ReadOnlyField(source='mascota.nombre')
    cliente_nombre = serializers.ReadOnlyField(source='mascota.cliente.nombre') # Asegurando que haya cliente_nombre
    veterinario_nombre = serializers.ReadOnlyField(source='veterinario.get_full_name')
    
    class Meta:
        model = Consulta
        fields = '__all__'
        # Especificamos los nombres de los campos explícitamente para asegurar consistencia
        fields = [
            'id', 'mascota', 'mascota_nombre', 'cliente_nombre', 'veterinario', 
            'veterinario_nombre', 'fecha', 'motivo', 'diagnostico', 'observaciones',
            'estado', 'tipo', 'duracion_estimada', 
            # Campos clínicos - importante que estos coincidan con los del frontend
            'temperatura', 'peso', 'sintomas', 'tratamiento'
        ]
        
    def to_representation(self, instance):
        """
        Modificar la representación para manejar los campos de forma específica.
        Asegurándonos de que los nombres de los campos coincidan con el frontend.
        """
        data = super().to_representation(instance)
        
        # Mapear 'peso' a 'peso_actual' para el frontend
        if 'peso' in data and data['peso'] is not None:
            data['peso_actual'] = data['peso']
            
        return data
        
    def to_internal_value(self, data):
        """
        Procesar los datos recibidos del frontend antes de validarlos.
        Manejar la conversión de nombres de campos específicamente.
        """
        internal_data = data.copy()
        
        # Si viene 'peso_actual' del frontend, mapearlo a 'peso' del modelo
        if 'peso_actual' in internal_data and internal_data['peso_actual'] is not None:
            internal_data['peso'] = internal_data.pop('peso_actual')
        
        return super().to_internal_value(internal_data)