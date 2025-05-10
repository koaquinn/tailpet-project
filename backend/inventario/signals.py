from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum  # Importación clave que faltaba
from .models import MovimientoInventario, LoteMedicamento, Medicamento

@receiver(post_save, sender=MovimientoInventario)
def actualizar_stock_medicamento(sender, instance, created, **kwargs):
    """
    Actualiza el stock del lote cuando se registra un movimiento
    """
    if instance.afecta_stock:
        lote = instance.lote
        if lote:
            if instance.tipo == 'ENTRADA':
                lote.cantidad += instance.cantidad
            elif instance.tipo == 'SALIDA':
                if lote.cantidad >= instance.cantidad:  # Validación para evitar stock negativo
                    lote.cantidad -= instance.cantidad
                else:
                    # Aquí podrías manejar la excepción o ajustar la cantidad
                    pass
            elif instance.tipo == 'AJUSTE':
                # El ajuste se aplica directamente
                pass
            lote.save()

@receiver(post_save, sender=LoteMedicamento)
def actualizar_stock_medicamento_desde_lote(sender, instance, **kwargs):
    """
    Actualiza el stock total del medicamento basado en sus lotes
    """
    medicamento = instance.medicamento
    stock_total = LoteMedicamento.objects.filter(
        medicamento=medicamento
    ).aggregate(total=Sum('cantidad'))['total'] or 0
    
    # Actualiza el campo stock_actual si existe en tu modelo Medicamento
    if hasattr(medicamento, 'stock_actual'):
        medicamento.stock_actual = stock_total
        medicamento.save()
