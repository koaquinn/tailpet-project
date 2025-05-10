from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q  # Importar Q para consultas OR
from .models import Rol

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    rol = serializers.CharField(source='rol.nombre', read_only=True)
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
        rol = validated_data.pop('rol')
        password = validated_data.pop('password')
        user = User(**validated_data, rol=rol)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
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
    # Cambiamos el campo username por credential
    username_field = 'credential'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['rol'] = user.rol.nombre
        return token

    def validate(self, attrs):
        # Renombramos credential a username para la autenticación estándar
        credential = attrs.get('credential')
        password = attrs.get('password')

        # Buscamos usuario por email o username
        user = User.objects.filter(
            Q(username=credential) | Q(email=credential))
        
        if not user.exists():
            raise serializers.ValidationError(
                {'detail': 'Credenciales inválidas'})
            
        user = user.first()
        
        if not user.check_password(password):
            raise serializers.ValidationError(
                {'detail': 'Credenciales inválidas'})

        # Generamos el token
        refresh = self.get_token(user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol.nombre,
            }
        }

        return data