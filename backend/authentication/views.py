# auth/views.py
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Rol
from .serializers import (
    UserSerializer,
    RolSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()


class IsAdminOrSelf(permissions.BasePermission):
    """
    Permite solo a administradores o al propio usuario.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False

        # Admin
        if getattr(user, 'rol', None) and user.rol.nombre == Rol.ADMIN:
            return True

        # O al mismo usuario
        return obj == user


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    /auth/users/
      - list    → solo ADMIN
      - create  → solo ADMIN
      - retrieve/update/partial_update/destroy → ADMIN o mismo user
      - me (GET /auth/users/me/) → cualquier user autenticado
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ('list', 'create'):
            perms = [permissions.IsAdminUser]
        elif self.action in ('retrieve', 'update', 'partial_update', 'destroy'):
            perms = [IsAdminOrSelf]
        else:  # incluye 'me'
            perms = [permissions.IsAuthenticated]
        return [p() for p in perms]

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """
        Devuelve el perfil del usuario autenticado.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class RolViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Proporciona lectura de roles. Solo ADMIN puede consultar.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [permissions.IsAdminUser]