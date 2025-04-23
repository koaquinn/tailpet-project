# clientes/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, DireccionClienteViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'direcciones', DireccionClienteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]