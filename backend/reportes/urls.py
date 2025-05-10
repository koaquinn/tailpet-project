# reportes/urls.py
from django.urls import path
from .views import DashboardInfoView, InformesConsultasView, InformesFacturacionView

urlpatterns = [
    path('dashboard/', DashboardInfoView.as_view(), name='dashboard-info'),
    path('consultas/', InformesConsultasView.as_view(), name='informes-consultas'),
    path('facturacion/', InformesFacturacionView.as_view(), name='informes-facturacion'),
]