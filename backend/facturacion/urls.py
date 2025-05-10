# facturacion/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MetodoPagoViewSet, ServicioViewSet, FacturaViewSet, DetalleFacturaViewSet

router = DefaultRouter()
router.register(r'metodos-pago', MetodoPagoViewSet)
router.register(r'servicios', ServicioViewSet)
router.register(r'facturas', FacturaViewSet)
router.register(r'detalles', DetalleFacturaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]