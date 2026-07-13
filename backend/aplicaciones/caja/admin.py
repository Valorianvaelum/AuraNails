from django.contrib import admin

from .models import Caja, GastoCaja, MovimientoCaja


@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = ("id", "propietaria", "estado", "saldo_inicial", "abierta_en", "cerrada_en")
    list_filter = ("estado",)
    search_fields = ("propietaria__email",)
    readonly_fields = ("abierta_en", "cerrada_en", "creado_en", "actualizado_en")


@admin.register(GastoCaja)
class GastoCajaAdmin(admin.ModelAdmin):
    list_display = ("id", "caja", "concepto", "importe", "metodo_pago", "estado", "registrado_en")
    list_filter = ("estado", "metodo_pago")


@admin.register(MovimientoCaja)
class MovimientoCajaAdmin(admin.ModelAdmin):
    list_display = ("id", "caja", "tipo", "importe", "estado", "registrado_en")
    list_filter = ("tipo", "estado")
