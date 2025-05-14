from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from django.utils import timezone
from .models import Proveedor, DireccionProveedor, Medicamento, LoteMedicamento, MovimientoInventario
from .serializers import (ProveedorSerializer, DireccionProveedorSerializer, 
                          MedicamentoSerializer, LoteMedicamentoSerializer, 
                          MovimientoInventarioSerializer)
from django_filters.rest_framework import DjangoFilterBackend
from .filters import MedicamentoFilter, LoteMedicamentoFilter

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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MedicamentoFilter
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'precio_venta', 'stock_minimo']
    filterset_fields = ['tipo', 'proveedor', 'activo', 'requiere_receta']

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
    
    @action(detail=True, methods=['post'], url_path='registrar-entrada', url_name='registrar-entrada')
    def registrar_entrada(self, request, pk=None):
        """
        Registra una entrada de inventario para este medicamento
        """
        try:
            medicamento = self.get_object()
            data = request.data.copy()

            # Validación básica de datos requeridos
            required_fields = ['cantidad', 'numero_lote', 'fecha_vencimiento', 'proveedor_id', 'precio_compra']
            if not all(field in data for field in required_fields):
                return Response(
                    {'error': f'Faltan campos requeridos: {", ".join(required_fields)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validación de la cantidad
            cantidad = int(data.get('cantidad', 0))
            if cantidad <= 0:
                return Response(
                    {'error': 'La cantidad debe ser positiva y mayor a cero.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            with transaction.atomic():
                # Crear nuevo lote
                lote_data = {
                    'medicamento': medicamento.id,
                    'numero_lote': data['numero_lote'],
                    'fecha_vencimiento': data['fecha_vencimiento'],
                    'cantidad': 0,  # Se actualizará con el movimiento
                    'fecha_ingreso': timezone.now().date(),
                    'proveedor': data['proveedor_id'],
                    'precio_compra': data['precio_compra']
                }
                
                lote_serializer = LoteMedicamentoSerializer(data=lote_data)
                lote_serializer.is_valid(raise_exception=True)
                lote = lote_serializer.save()
                
                # Registrar movimiento
                movimiento_data = {
                    'medicamento': medicamento.id,
                    'lote': lote.id,
                    'tipo': 'ENTRADA',
                    'cantidad': cantidad,
                    'fecha': timezone.now(),
                    'usuario': request.user.id,
                    'motivo': data.get('motivo', 'Entrada de inventario'),
                    'afecta_stock': True
                }
                
                movimiento_serializer = MovimientoInventarioSerializer(data=movimiento_data)
                movimiento_serializer.is_valid(raise_exception=True)
                movimiento_serializer.save()
                
                # Actualizar cantidad en lote (podría hacerse con signal)
                lote.cantidad += cantidad
                lote.save()
                
            return Response(
                {'status': 'Entrada registrada correctamente', 'lote_id': lote.id},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class LoteMedicamentoViewSet(viewsets.ModelViewSet):
    queryset = LoteMedicamento.objects.all()
    serializer_class = LoteMedicamentoSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = LoteMedicamentoFilter
    filterset_fields = ['medicamento', 'proveedor']
    ordering_fields = ['fecha_vencimiento', 'cantidad']

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    queryset = MovimientoInventario.objects.all()
    serializer_class = MovimientoInventarioSerializer
    filterset_fields = ['medicamento', 'tipo', 'fecha', 'usuario']
