# clientes/serializers.py
from rest_framework import serializers
from .models import Cliente, DireccionCliente # Asegúrate de importar DireccionCliente

class DireccionClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DireccionCliente
        fields = '__all__' # O especifica los campos que quieres exponer para la dirección

class ClienteSerializer(serializers.ModelSerializer):
    direcciones = DireccionClienteSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = ['id', 'nombre', 'apellido', 'rut', 'telefono', 'email', 'activo', 'direcciones', 'created_at', 'updated_at']

    def _normalizar_rut_serializer(self, rut_crudo: str) -> str:
       
        if not rut_crudo:
            return ""
        rut_limpio_para_dv = rut_crudo.replace('.', '').replace('-', '').upper()
        if not rut_limpio_para_dv or len(rut_limpio_para_dv) < 2:
            # Si es muy corto o vacío después de limpiar, devolver tal cual para que falle otra validación si es necesario
            return rut_limpio_para_dv 
        
        cuerpo = rut_limpio_para_dv[:-1]
        dv = rut_limpio_para_dv[-1]

        # Asegurarse que el cuerpo solo contenga números
        cuerpo_numerico = ''.join(filter(str.isdigit, cuerpo))
        
        if not cuerpo_numerico: # Si el cuerpo no tiene números después de filtrar
             return rut_limpio_para_dv # Devolver como está, probablemente inválido
        
        return f"{cuerpo_numerico}-{dv}"

    def validate_rut(self, value):
        """
        Valida el formato del RUT y su unicidad usando la forma normalizada.
        """
        if not value: # Chequeo básico, aunque el required=True del modelo debería manejarlo
            raise serializers.ValidationError("El RUT es requerido.")

        # 1. Normalizar el RUT ingresado para la validación de unicidad
        rut_normalizado = self._normalizar_rut_serializer(value)

        # Si después de normalizar queda vacío o es muy corto, podría indicar un problema.
        # La validación de formato previa debería haberlo capturado.
        if not rut_normalizado or len(rut_normalizado) < 3: # ej. "1-K" como mínimo
             raise serializers.ValidationError("RUT inválido después de la normalización.")


        # 2. Comprobar unicidad
        query = Cliente.objects.filter(rut=rut_normalizado)
        if self.instance: # Si estamos actualizando (PUT/PATCH)
            query = query.exclude(pk=self.instance.pk) # Excluir el propio objeto de la búsqueda
        
        if query.exists():
            raise serializers.ValidationError("Este RUT ya está registrado para otro cliente.")
            

        return value
