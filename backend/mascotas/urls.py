# mascotas/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (EspecieViewSet, RazaViewSet, MascotaViewSet, 
                    FotoMascotaViewSet, RegistroPesoViewSet)

router = DefaultRouter()
router.register(r'especies', EspecieViewSet)
router.register(r'razas', RazaViewSet)
router.register(r'mascotas', MascotaViewSet)
router.register(r'fotos', FotoMascotaViewSet)
router.register(r'registros-peso', RegistroPesoViewSet, basename='registropeso')

urlpatterns = [
    path('', include(router.urls)),
]