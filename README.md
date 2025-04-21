# Sistema de Gestión Veterinaria Tailpet

Sistema web integral para la administración de clínicas veterinarias que centraliza la gestión de pacientes (mascotas), clientes, historiales médicos, agendamiento de citas, inventario y facturación.

## Características principales

- 🐾 Gestión de clientes y mascotas
- 📆 Agendamiento de citas con calendario interactivo
- 📋 Historiales médicos digitalizados
- 💊 Control de inventario de medicamentos
- 📱 Notificaciones automáticas (WhatsApp/Email)
- 📊 Reportes y estadísticas

## Tecnologías

- **Backend**: Django + Django REST Framework
- **Frontend**: React + Material UI
- **Base de datos**: PostgreSQL
- **Despliegue**: Render (Backend) + Vercel (Frontend)

## Estructura del proyecto

- `/backend`: API REST en Django
- `/frontend`: SPA en React
- `/docs`: Documentación técnica y de usuario

## Requisitos

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+

## Configuración inicial

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
