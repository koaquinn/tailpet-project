# inventario/views.py
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Proveedor, DireccionProveedor, Medicamento, LoteMedicamento, MovimientoInventario
from .serializers import (ProveedorSerializer, DireccionProveedorSerializer, 
                          MedicamentoSerializer, LoteMedicamentoSerializer, 
                          MovimientoInventarioSerializer)
from django_filters.rest_framework import DjangoFilterBackend
from .filters import MedicamentoFilter, LoteMedicamentoFilter

class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MedicamentoFilter
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'precio_venta', 'stock_minimo']

    @action(detail=True, methods=['get'])
    def stock_disponible(self, request, pk=None):
        """
        Devuelve el stock disponible de un medicamento por lotes
        """
        medicamento = self.get_object()
        lotes = medicamento.lotes.filter(cantidad__gt=0).order_by('fecha_vencimiento')
        
        total_stock = lotes.aggregate(total=models.Sum('cantidad'))['total'] or 0
        
        data = {
            'medicamento': self.get_serializer(medicamento).data,
            'stock_total': total_stock,
            'lotes': LoteMedicamentoSerializer(lotes, many=True).data,
            'alerta_stock': total_stock <= medicamento.stock_minimo
        }
        
        return Response(data)
    
    @action(detail=True, methods=['post'], url_path='registrar-entrada')
    def registrar_entrada(self, request, pk=None):
        """
        Registra una entrada de inventario para este medicamento
        """
        medicamento = self.get_object()
        data = request.data.copy()
        
        # Validar datos
        if 'lote_id' not in data and ('numero_lote' not in data or 'fecha_vencimiento' not in data):
            return Response({
                'error': 'Debe proporcionar lote_id o información para un nuevo lote'
            }, status=400)
        
        with transaction.atomic():
            # Determinar lote a actualizar o crear
            if 'lote_id' in data:
                try:
                    lote = LoteMedicamento.objects.get(id=data['lote_id'])
                except LoteMedicamento.DoesNotExist:
                    return Response({'error': 'Lote no encontrado'}, status=404)
            else:
                # Crear nuevo lote
                lote_data = {
                    'medicamento': medicamento.id,
                    'numero_lote': data['numero_lote'],
                    'fecha_vencimiento': data['fecha_vencimiento'],
                    'cantidad': 0,  # Inicialmente sin stock
                    'fecha_ingreso': timezone.now().date(),
                    'proveedor': data['proveedor_id'],
                    'precio_compra': data['precio_compra']
                }
                lote_serializer = LoteMedicamentoSerializer(data=lote_data)
                lote_serializer.is_valid(raise_exception=True)
                lote = lote_serializer.save()
            
            # Registrar movimiento de inventario
            movimiento_data = {
                'medicamento': medicamento.id,
                'lote': lote.id,
                'tipo': 'ENTRADA',
                'cantidad': data['cantidad'],
                'fecha': timezone.now(),
                'usuario': request.user.id,
                'motivo': data.get('motivo', 'Entrada de inventario'),
                'afecta_stock': True
            }
            
            movimiento_serializer = MovimientoInventarioSerializer(data=movimiento_data)
            movimiento_serializer.is_valid(raise_exception=True)
            movimiento_serializer.save()
            
            # El stock se actualiza automáticamente por el signal
            
        return Response({'status': 'Entrada registrada correctamente'})

class LoteMedicamentoViewSet(viewsets.ModelViewSet):
    queryset = LoteMedicamento.objects.all()
    serializer_class = LoteMedicamentoSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = LoteMedicamentoFilter
    ordering_fields = ['fecha_vencimiento', 'cantidad']

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    filterset_fields = ['tipo', 'activo']
    search_fields = ['nombre', 'email']

class DireccionProveedorViewSet(viewsets.ModelViewSet):
    queryset = DireccionProveedor.objects.all()
    serializer_class = DireccionProveedorSerializer
    filterset_fields = ['proveedor', 'ciudad', 'es_principal']

class MedicamentoViewSet(viewsets.ModelViewSet):
    queryset = Medicamento.objects.all()
    serializer_class = MedicamentoSerializer
    filterset_fields = ['tipo', 'proveedor', 'activo', 'requiere_receta']
    search_fields = ['nombre', 'descripcion']

class LoteMedicamentoViewSet(viewsets.ModelViewSet):
    queryset = LoteMedicamento.objects.all()
    serializer_class = LoteMedicamentoSerializer
    filterset_fields = ['medicamento', 'proveedor']

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    filterset_fields = ['medicamento', 'tipo', 'fecha', 'usuario']