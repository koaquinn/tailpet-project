# historial_medico/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import MascotaVacuna, Receta, DetalleReceta
from inventario.models import MovimientoInventario

@receiver(post_save, sender=MascotaVacuna)
def registrar_movimiento_vacuna(sender, instance, created, **kwargs):
    """
    Registra un movimiento de inventario cuando se aplica una vacuna
    """
    if created:
        # Asumimos que la vacuna sale del inventario
        MovimientoInventario.objects.create(
            medicamento=instance.lote.medicamento,
            lote=instance.lote,
            tipo='SALIDA',
            cantidad=1,  # Asumimos 1 dosis por vacuna
            fecha=timezone.now(),
            usuario=instance.veterinario,
            motivo=f"Vacunación {instance.vacuna.nombre} a {instance.mascota.nombre}",
            afecta_stock=True
        )

@receiver(post_save, sender=DetalleReceta)
def registrar_movimiento_receta(sender, instance, created, **kwargs):
    """
    Registra un movimiento de inventario cuando se dispensa un medicamento en una receta
    si la receta está en estado 'COMPLETADA'
    """
    if created and instance.receta.estado == 'COMPLETADA':
        # Asumimos que el medicamento sale del inventario
        # Necesitaríamos lógica adicional para seleccionar el lote adecuado
        lotes_disponibles = instance.medicamento.lotes.filter(
            cantidad__gte=instance.cantidad
        ).order_by('fecha_vencimiento')
        
        if lotes_disponibles.exists():
            lote = lotes_disponibles.first()
            MovimientoInventario.objects.create(
                medicamento=instance.medicamento,
                lote=lote,
                tipo='SALIDA',
                cantidad=instance.cantidad,
                fecha=timezone.now(),
                usuario=instance.receta.veterinario,
                motivo=f"Receta {instance.receta.id} para {instance.receta.mascota.nombre}",
                afecta_stock=True
            )