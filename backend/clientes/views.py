from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cliente, DireccionCliente
from .serializers import ClienteSerializer, DireccionClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    filterset_fields = ['rut', 'email', 'activo']
    search_fields = ['nombre', 'apellido', 'rut', 'email']

    def _normalizar_rut_view(self, rut_crudo: str) -> str:
        """
        Helper para normalizar RUT en la vista, igual que en el modelo.
        """
        if not rut_crudo:
            return ""
        rut_sin_formato = rut_crudo.replace('.', '').replace('-', '')
        if rut_sin_formato.upper().endswith('K'):
            return rut_sin_formato[:-1].upper() + 'K'
        return rut_sin_formato.upper()

    @action(detail=False, methods=['get'], url_path='verificar-rut')
    def verificar_rut(self, request):
        rut_param = request.query_params.get('rut', None)
        if rut_param is not None:
             # Normalizar el RUT recibido del frontend para la búsqueda
            rut_normalizado_para_db = self._normalizar_rut_view(rut_param)
                
            # Lógica para excluir el cliente actual si se está editando (opcional pero recomendado)
            current_cliente_id = request.query_params.get('current_id', None)
            query = Cliente.objects.filter(rut=rut_normalizado_para_db)
            if current_cliente_id:
                try:
                    query = query.exclude(pk=int(current_cliente_id))
                except ValueError:
                    # current_id no es un entero válido, ignorar o manejar error
                    pass
                
            cliente_exists = query.exists()
            return Response({'exists': cliente_exists}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Parámetro RUT no proporcionado.'}, status=status.HTTP_400_BAD_REQUEST)
    
class DireccionClienteViewSet(viewsets.ModelViewSet):
    queryset = DireccionCliente.objects.all()
    serializer_class = DireccionClienteSerializer