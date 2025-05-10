# mascotas/filters.py
from django_filters import rest_framework as filters
from .models import Mascota, RegistroPeso

class MascotaFilter(filters.FilterSet):
    nombre_contiene = filters.CharFilter(field_name="nombre", lookup_expr='icontains')
    edad_min = filters.NumberFilter(method='filter_edad_min')
    edad_max = filters.NumberFilter(method='filter_edad_max')
    
    class Meta:
        model = Mascota
        fields = ['nombre_contiene', 'edad_min', 'edad_max', 'cliente', 'especie', 'raza', 'sexo', 'activo']
    
    def filter_edad_min(self, queryset, name, value):
        import datetime
        fecha_limite = datetime.date.today() - datetime.timedelta(days=365 * value)
        return queryset.filter(fecha_nacimiento__lte=fecha_limite)
    
    def filter_edad_max(self, queryset, name, value):
        import datetime
        fecha_limite = datetime.date.today() - datetime.timedelta(days=365 * value)
        return queryset.filter(fecha_nacimiento__gte=fecha_limite)

class RegistroPesoFilter(filters.FilterSet):
    peso_min = filters.NumberFilter(field_name="peso", lookup_expr='gte')
    peso_max = filters.NumberFilter(field_name="peso", lookup_expr='lte')
    fecha_desde = filters.DateFilter(field_name="fecha_registro", lookup_expr='gte')
    fecha_hasta = filters.DateFilter(field_name="fecha_registro", lookup_expr='lte')
    
    class Meta:
        model = RegistroPeso
        fields = ['peso_min', 'peso_max', 'fecha_desde', 'fecha_hasta', 'mascota']