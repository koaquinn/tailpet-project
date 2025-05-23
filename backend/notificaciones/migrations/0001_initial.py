# Generated by Django 5.0.6 on 2025-05-14 15:50

import core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("clientes", "0001_initial"),
        ("mascotas", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Notificacion",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "tipo",
                    models.CharField(
                        choices=[
                            ("VACUNA", "Vacuna"),
                            ("CONSULTA", "Consulta"),
                            ("TRATAMIENTO", "Tratamiento"),
                            ("FACTURA", "Factura"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "medio",
                    models.CharField(
                        choices=[("EMAIL", "Email"), ("SMS", "SMS"), ("APP", "App")],
                        max_length=20,
                    ),
                ),
                ("mensaje", models.TextField()),
                ("fecha_envio", models.DateTimeField(blank=True, null=True)),
                (
                    "fecha_programada",
                    models.DateTimeField(
                        validators=[core.validators.validar_fecha_futura]
                    ),
                ),
                (
                    "estado",
                    models.CharField(
                        choices=[
                            ("PENDIENTE", "Pendiente"),
                            ("ENVIADA", "Enviada"),
                            ("LEIDA", "Leída"),
                            ("CANCELADA", "Cancelada"),
                        ],
                        default="PENDIENTE",
                        max_length=20,
                    ),
                ),
                (
                    "cliente",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notificaciones",
                        to="clientes.cliente",
                    ),
                ),
                (
                    "mascota",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notificaciones",
                        to="mascotas.mascota",
                    ),
                ),
            ],
            options={
                "verbose_name": "Notificación",
                "verbose_name_plural": "Notificaciones",
                "indexes": [
                    models.Index(
                        fields=["cliente"], name="notificacio_cliente_a6963d_idx"
                    ),
                    models.Index(
                        fields=["fecha_programada"],
                        name="notificacio_fecha_p_42e0e6_idx",
                    ),
                    models.Index(
                        fields=["estado"], name="notificacio_estado_52a925_idx"
                    ),
                ],
            },
        ),
    ]
