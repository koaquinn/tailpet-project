# tailpet_core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/clientes/', include('clientes.urls')),
    path('api/mascotas/', include('mascotas.urls')),
    path('api/historial-medico/', include('historial_medico.urls')),
    path('api/inventario/', include('inventario.urls')),
    path('api/citas/', include('citas.urls')),
    path('api/facturacion/', include('facturacion.urls')),
    path('api/notificaciones/', include('notificaciones.urls')),
    path('api/reportes/', include('reportes.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)