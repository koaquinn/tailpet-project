# inventario/filters.py
from django_filters import rest_framework as filters
from .models import Medicamento, LoteMedicamento

class MedicamentoFilter(filters.FilterSet):
    precio_min = filters.NumberFilter(field_name="precio_venta", lookup_expr='gte')
    precio_max = filters.NumberFilter(field_name="precio_venta", lookup_expr='lte')
    nombre_contiene = filters.CharFilter(field_name="nombre", lookup_expr='icontains')
    
    class Meta:
        model = Medicamento
        fields = ['precio_min', 'precio_max', 'tipo', 'proveedor', 'activo', 'requiere_receta']

class LoteMedicamentoFilter(filters.FilterSet):
    vence_antes_de = filters.DateFilter(field_name="fecha_vencimiento", lookup_expr='lte')
    vence_despues_de = filters.DateFilter(field_name="fecha_vencimiento", lookup_expr='gte')
    stock_min = filters.NumberFilter(field_name="cantidad", lookup_expr='gte')
    stock_max = filters.NumberFilter(field_name="cantidad", lookup_expr='lte')
    
    class Meta:
        model = LoteMedicamento
        fields = ['vence_antes_de', 'vence_despues_de', 'stock_min', 'stock_max', 'medicamento', 'proveedor']