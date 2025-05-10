# reportes/views.py
from django.db.models import Count, Sum, Avg, F, ExpressionWrapper, DecimalField, DateField
from django.db.models.functions import TruncMonth, TruncYear, ExtractMonth
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from mascotas.models import Mascota
from historial_medico.models import Consulta, MascotaVacuna
from facturacion.models import Factura, DetalleFactura
from authentication.permissions import IsVeterinarioOrAdmin, IsAdmin

class DashboardInfoView(APIView):
    """
    Vista para obtener información general para el dashboard
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Estadísticas generales
        total_mascotas = Mascota.objects.filter(activo=True).count()
        total_consultas_mes = Consulta.objects.filter(
            fecha__gte=timezone.now().replace(day=1, hour=0, minute=0, second=0)
        ).count()
        
        # Consultas por mes (últimos 6 meses)
        fecha_6_meses = timezone.now() - timedelta(days=180)
        consultas_por_mes = Consulta.objects.filter(
            fecha__gte=fecha_6_meses
        ).annotate(
            mes=TruncMonth('fecha')
        ).values('mes').annotate(
            total=Count('id')
        ).order_by('mes')
        
        # Ingresos por mes (últimos 6 meses)
        ingresos_por_mes = Factura.objects.filter(
            fecha_emision__gte=fecha_6_meses,
            estado='PAGADA'
        ).annotate(
            mes=TruncMonth('fecha_emision')
        ).values('mes').annotate(
            total=Sum('total')
        ).order_by('mes')
        
        return Response({
            'total_mascotas': total_mascotas,
            'total_consultas_mes': total_consultas_mes,
            'consultas_por_mes': consultas_por_mes,
            'ingresos_por_mes': ingresos_por_mes
        })

class InformesConsultasView(APIView):
    """
    Vista para generar informes de consultas
    """
    permission_classes = [IsVeterinarioOrAdmin]
    
    def get(self, request):
        # Periodo de consulta (por defecto, último año)
        fecha_inicio = request.query_params.get('fecha_inicio', None)
        fecha_fin = request.query_params.get('fecha_fin', None)
        
        if not fecha_inicio:
            fecha_inicio = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not fecha_fin:
            fecha_fin = timezone.now().strftime('%Y-%m-%d')
        
        # Consultas por veterinario
        consultas_por_veterinario = Consulta.objects.filter(
            fecha__range=[fecha_inicio, fecha_fin]
        ).values(
            'veterinario__first_name',
            'veterinario__last_name'
        ).annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Consultas por tipo
        consultas_por_tipo = Consulta.objects.filter(
            fecha__range=[fecha_inicio, fecha_fin]
        ).values(
            'tipo'
        ).annotate(
            total=Count('id')
        ).order_by('-total')
        
        # Días con más consultas
        consultas_por_dia = Consulta.objects.filter(
            fecha__range=[fecha_inicio, fecha_fin]
        ).annotate(
            dia=F('fecha')
        ).values(
            'dia'
        ).annotate(
            total=Count('id')
        ).order_by('-total')[:10]
        
        return Response({
            'consultas_por_veterinario': consultas_por_veterinario,
            'consultas_por_tipo': consultas_por_tipo,
            'consultas_por_dia': consultas_por_dia
        })

class InformesFacturacionView(APIView):
    """
    Vista para generar informes de facturación
    """
    permission_classes = [IsAdmin]
    
    def get(self, request):
        # Periodo de consulta (por defecto, último año)
        fecha_inicio = request.query_params.get('fecha_inicio', None)
        fecha_fin = request.query_params.get('fecha_fin', None)
        
        if not fecha_inicio:
            fecha_inicio = (timezone.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        if not fecha_fin:
            fecha_fin = timezone.now().strftime('%Y-%m-%d')
        
        # Facturación total por mes
        facturacion_por_mes = Factura.objects.filter(
            fecha_emision__range=[fecha_inicio, fecha_fin],
            estado='PAGADA'
        ).annotate(
            mes=TruncMonth('fecha_emision')
        ).values(
            'mes'
        ).annotate(
            total=Sum('total'),
            cantidad=Count('id')
        ).order_by('mes')
        
        # Tipos de servicios más facturados
        servicios_facturados = DetalleFactura.objects.filter(
            factura__fecha_emision__range=[fecha_inicio, fecha_fin],
            factura__estado='PAGADA'
        ).values(
            'tipo_item'
        ).annotate(
            total_dinero=Sum(F('precio_unitario') * F('cantidad')),
            cantidad=Sum('cantidad')
        ).order_by('-total_dinero')
        
        # Promedio de factura por cliente
        promedio_por_cliente = Factura.objects.filter(
            fecha_emision__range=[fecha_inicio, fecha_fin],
            estado='PAGADA'
        ).values(
            'cliente'
        ).annotate(
            total=Sum('total'),
            cantidad=Count('id'),
            promedio=ExpressionWrapper(
                F('total') / F('cantidad'),
                output_field=DecimalField()
            )
        ).order_by('-promedio')
        
        return Response({
            'facturacion_por_mes': facturacion_por_mes,
            'servicios_facturados': servicios_facturados,
            'promedio_por_cliente': promedio_por_cliente
        })