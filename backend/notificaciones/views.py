# notificaciones/views.py
from rest_framework import viewsets
from .models import Notificacion
from .serializers import NotificacionSerializer

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    filterset_fields = ['cliente', 'mascota', 'tipo', 'medio', 'estado']
    search_fields = ['mensaje']