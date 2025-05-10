# historial_medico/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (HistorialMedicoViewSet, TipoConsultaViewSet, ConsultaViewSet,
                   TratamientoViewSet, TipoDocumentoViewSet, DocumentoViewSet,
                   VacunaViewSet, MascotaVacunaViewSet, RecetaViewSet, DetalleRecetaViewSet)

router = DefaultRouter()
router.register(r'historiales', HistorialMedicoViewSet)
router.register(r'tipos-consulta', TipoConsultaViewSet)
router.register(r'consultas', ConsultaViewSet)
router.register(r'tratamientos', TratamientoViewSet)
router.register(r'tipos-documento', TipoDocumentoViewSet)
router.register(r'documentos', DocumentoViewSet)
router.register(r'vacunas', VacunaViewSet)
router.register(r'vacunaciones', MascotaVacunaViewSet)
router.register(r'recetas', RecetaViewSet)
router.register(r'detalles-receta', DetalleRecetaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]