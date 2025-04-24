import datetime
from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick‑start development settings – unsuitable for production
SECRET_KEY = "django-insecure-unk@n*yf@gghfkp2mrh)77x$kb5@xscxvivn^#ao+*(*qir&8p"
DEBUG = True
ALLOWED_HOSTS = []  # en producción aquí van tus dominios

# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework_simplejwt",

    # Third‑party
    "rest_framework",
    "django_filters",
    "corsheaders",

    # Local
    "core",
    "clientes",
    "mascotas",
    "citas",
    "historial_medico",
    "inventario",
    "facturacion",
    "notificaciones",
    "reportes",
    "authentication",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # debe ir primero
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# CORS (solo para desarrollo)
CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = "tailpet_core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "tailpet_core.wsgi.application"

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tailpet_db',
        'USER': 'admin_tailpet',
        'PASSWORD': 'admin_tailpet',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'client_encoding': 'UTF8',
        },
    }
}

# REST framework
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}

# Configuración de JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': datetime.timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': datetime.timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

AUTH_USER_MODEL = 'authentication.usuario'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "es-cl"
TIME_ZONE = "America/Santiago"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Media files (uploads)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "mediafiles")

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
