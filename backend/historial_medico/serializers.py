# historial_medico/serializers.py
from rest_framework import serializers
import uuid
import os
from .models import (HistorialMedico, TipoConsulta, Consulta, Tratamiento, 
                     TipoDocumento, Documento, Vacuna, MascotaVacuna, 
                     Receta, DetalleReceta)

class HistorialMedicoSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.ReadOnlyField(source='mascota.nombre')
    veterinario_nombre = serializers.ReadOnlyField(source='veterinario.get_full_name')
    
    class Meta:
        model = HistorialMedico
        fields = '__all__'

class TipoConsultaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoConsulta
        fields = '__all__'

class ConsultaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.ReadOnlyField(source='historial.mascota.nombre')
    veterinario_nombre = serializers.ReadOnlyField(source='veterinario.get_full_name')
    
    class Meta:
        model = Consulta
        fields = '__all__'

class TratamientoSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.ReadOnlyField(source='historial.mascota.nombre')
    
    class Meta:
        model = Tratamiento
        fields = '__all__'

class TipoDocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumento
        fields = '__all__'

class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = '__all__'
    
    def create(self, validated_data):
        # Procesamiento del archivo
        archivo = validated_data.get('url_archivo')
        if archivo:
            # Obtener la extensión
            _, extension = os.path.splitext(archivo.name)
            
            # Generar nombre único
            nombre_archivo = f"{uuid.uuid4()}{extension}"
            archivo.name = nombre_archivo
            
            # Asignar el nombre del archivo
            validated_data['nombre_archivo'] = os.path.basename(archivo.name)
        
        return super().create(validated_data)

class VacunaSerializer(serializers.ModelSerializer):
    especie_nombre = serializers.ReadOnlyField(source='especie.nombre')
    
    class Meta:
        model = Vacuna
        fields = '__all__'

class MascotaVacunaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.ReadOnlyField(source='mascota.nombre')
    vacuna_nombre = serializers.ReadOnlyField(source='vacuna.nombre')
    veterinario_nombre = serializers.ReadOnlyField(source='veterinario.get_full_name')
    
    class Meta:
        model = MascotaVacuna
        fields = '__all__'

class DetalleRecetaSerializer(serializers.ModelSerializer):
    medicamento_nombre = serializers.ReadOnlyField(source='medicamento.nombre')
    
    class Meta:
        model = DetalleReceta
        fields = '__all__'

class RecetaSerializer(serializers.ModelSerializer):
    mascota_nombre = serializers.ReadOnlyField(source='mascota.nombre')
    veterinario_nombre = serializers.ReadOnlyField(source='veterinario.get_full_name')
    detalles = DetalleRecetaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Receta
        fields = '__all__'