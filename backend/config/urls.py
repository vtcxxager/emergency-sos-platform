"""
URL configuration for Community Emergency Response Platform project.

Includes health-check endpoint, OpenAPI 3 schema, Swagger UI, and modular API routers.
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Health Check API (Health of application, PostgreSQL connection, Celery/Redis)
    path('api/v1/health/', include('core.urls')),

    # Auth & Account Management
    path('api/v1/auth/', include('accounts.urls')),

    # Societies, Blocks, Towers & Flats Hierarchy
    path('api/v1/', include('societies.urls')),

    # SOS Alerting, Incidents & Notifications
    path('api/v1/', include('incidents.urls')),

    # OpenAPI 3.0 Documentation & Interactive Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
