from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Caja
from .serializers import (
    AnularRegistroSerializer,
    CajaDetailSerializer,
    CajaSerializer,
    CerrarCajaSerializer,
    GastoCajaSerializer,
    MovimientoCajaSerializer,
)
from .services import (
    anular_gasto,
    anular_movimiento,
    cerrar_caja,
    registrar_gasto,
    registrar_movimiento,
)


class CajaViewSet(ModelViewSet):
    serializer_class = CajaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CajaDetailSerializer
        return CajaSerializer

    def get_queryset(self):
        queryset = Caja.objects.filter(propietaria=self.request.user)
        if self.action == "list":
            if estado := self.request.query_params.get("estado"):
                queryset = queryset.filter(estado=estado)
            if fecha := self.request.query_params.get("fecha"):
                queryset = queryset.filter(abierta_en__date=fecha)
        return queryset.order_by("-abierta_en")

    @action(detail=True, methods=["post"])
    def cerrar(self, request, *args, **kwargs):
        datos = CerrarCajaSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        caja = cerrar_caja(
            propietaria=request.user,
            caja_id=self.get_object().id,
            **datos.validated_data,
        )
        return Response(self.get_serializer(caja).data)

    @action(detail=True, methods=["post"], url_path="gastos")
    def registrar_gasto(self, request, *args, **kwargs):
        datos = GastoCajaSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        gasto = registrar_gasto(
            propietaria=request.user,
            caja_id=self.get_object().id,
            **datos.validated_data,
        )
        return Response(GastoCajaSerializer(gasto).data, status=201)

    @action(detail=True, methods=["post"], url_path=r"gastos/(?P<gasto_id>[^/.]+)/anular")
    def anular_gasto(self, request, gasto_id=None, *args, **kwargs):
        datos = AnularRegistroSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        gasto = anular_gasto(
            propietaria=request.user,
            caja_id=self.get_object().id,
            gasto_id=gasto_id,
            motivo=datos.validated_data["motivo"],
        )
        return Response(GastoCajaSerializer(gasto).data)

    @action(detail=True, methods=["post"], url_path="aportes")
    def registrar_aporte(self, request, *args, **kwargs):
        return self._registrar_movimiento(request, tipo="aporte")

    @action(detail=True, methods=["post"], url_path="retiros")
    def registrar_retiro(self, request, *args, **kwargs):
        return self._registrar_movimiento(request, tipo="retiro")

    def _registrar_movimiento(self, request, tipo):
        datos = MovimientoCajaSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        movimiento = registrar_movimiento(
            propietaria=request.user,
            caja_id=self.get_object().id,
            tipo=tipo,
            **datos.validated_data,
        )
        return Response(MovimientoCajaSerializer(movimiento).data, status=201)

    @action(detail=True, methods=["post"], url_path=r"movimientos/(?P<movimiento_id>[^/.]+)/anular")
    def anular_movimiento(self, request, movimiento_id=None, *args, **kwargs):
        datos = AnularRegistroSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        movimiento = anular_movimiento(
            propietaria=request.user,
            caja_id=self.get_object().id,
            movimiento_id=movimiento_id,
            motivo=datos.validated_data["motivo"],
        )
        return Response(MovimientoCajaSerializer(movimiento).data)
