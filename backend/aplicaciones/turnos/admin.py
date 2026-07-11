from django.contrib import admin

from .models import Turno, TurnoServicio


class TurnoServicioInline(admin.TabularInline):
    model = TurnoServicio
    extra = 0


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    list_display = (
        "clienta",
        "propietaria",
        "inicio",
        "fin",
        "estado",
        "duracion_total_minutos",
        "precio_estimado",
    )
    list_filter = ("estado", "inicio")
    search_fields = (
        "clienta__nombre",
        "clienta__apellido",
        "clienta__telefono",
        "propietaria__email",
    )
    inlines = [TurnoServicioInline]
