from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(_request):
    return JsonResponse({"status": "ok", "project": "AuraNails"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("aplicaciones.usuarios.urls")),
    path("api/clientas/", include("aplicaciones.clientas.urls")),
    path("api/servicios/", include("aplicaciones.servicios.urls")),
]
