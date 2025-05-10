
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ProveedorViewSet, DireccionProveedorViewSet, MedicamentoViewSet,
                    LoteMedicamentoViewSet, MovimientoInventarioViewSet)

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet)
router.register(r'direcciones-proveedor', DireccionProveedorViewSet)
router.register(r'medicamentos', MedicamentoViewSet)
router.register(r'lotes', LoteMedicamentoViewSet)
router.register(r'movimientos', MovimientoInventarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
]