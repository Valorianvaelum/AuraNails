from django.contrib import admin
from .models import Servicio


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ("nombre", "propietaria", "duracion_minutos", "precio", "activo", "orden", "creado_en")
    list_filter = ("activo",)
    search_fields = ("nombre", "descripcion", "propietaria__email")
    list_select_related = ("propietaria",)
