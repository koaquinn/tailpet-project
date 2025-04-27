# auth/serializers.py

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Rol

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    # Campo write-only para la contraseña
    password = serializers.CharField(write_only=True)

    # Lectura del nombre del rol (string)
    rol = serializers.CharField(source='rol.nombre', read_only=True)
    # Escritura: recibe un PK de Rol y lo asigna a user.rol
    rol_id = serializers.PrimaryKeyRelatedField(
        queryset=Rol.objects.all(),
        source='rol',
        write_only=True,
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'password',
            'rol',
            'rol_id',
        ]
        read_only_fields = ['id', 'rol']

    def create(self, validated_data):
        # Se extrae el rol y la contraseña del payload
        rol = validated_data.pop('rol')
        password = validated_data.pop('password')
        # Creamos el usuario con el rol
        user = User(**validated_data, rol=rol)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        # Mismos pasos para update: rol y password opcionales
        rol = validated_data.pop('rol', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if rol is not None:
            instance.rol = rol

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Campos personalizados
        token['username']   = user.username
        token['email']      = user.email
        token['first_name'] = user.first_name
        token['last_name']  = user.last_name
        # Rol único
        token['rol']        = user.rol.nombre
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Ajustamos la respuesta para que incluya el rol
        data['user'] = {
            'id':         user.id,
            'username':   user.username,
            'email':      user.email,
            'first_name': user.first_name,
            'last_name':  user.last_name,
            'rol':        user.rol.nombre,
        }
        return data
