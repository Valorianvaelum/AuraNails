from django.contrib import admin

from .models import Cobro


@admin.register(Cobro)
class CobroAdmin(admin.ModelAdmin):
    list_display = ("id", "clienta_nombre_historica", "propietaria", "importe", "metodo_pago", "estado", "creado_en")
    list_filter = ("estado", "metodo_pago", "creado_en")
    search_fields = ("clienta_nombre_historica", "turno__clienta__nombre", "turno__clienta__apellido")
    readonly_fields = (
        "propietaria",
        "turno",
        "importe",
        "clienta_nombre_historica",
        "metodo_pago",
        "detalle_metodo",
        "estado",
        "creado_en",
        "actualizado_en",
        "anulado_en",
        "motivo_anulacion",
        "anulado_por",
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
