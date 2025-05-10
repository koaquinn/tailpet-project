# historial_medico/apps.py
from django.apps import AppConfig

class HistorialMedicoConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "historial_medico"
    
    def ready(self):
        import historial_medico.signals