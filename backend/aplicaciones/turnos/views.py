from django.db.models import Case, IntegerField, Prefetch, Q, Value, When
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from aplicaciones.cobros.models import Cobro

from .models import Turno
from .serializers import ReprogramarTurnoSerializer, TurnoSerializer


class TurnoViewSet(ModelViewSet):
    serializer_class = TurnoSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = (
            Turno.objects.filter(propietaria=self.request.user)
            .select_related("clienta")
            .prefetch_related(
                "turno_servicios",
                Prefetch(
                    "cobros",
                    queryset=Cobro.objects.filter(estado=Cobro.Estado.REGISTRADO),
                    to_attr="cobros_activos",
                ),
            )
        )
        params = self.request.query_params

        if params.get("fecha"):
            queryset = queryset.filter(inicio__date=params["fecha"])
        if params.get("desde"):
            queryset = queryset.filter(inicio__date__gte=params["desde"])
        if params.get("hasta"):
            queryset = queryset.filter(inicio__date__lte=params["hasta"])
        if params.get("estado"):
            queryset = queryset.filter(estado__in=params["estado"].split(","))
        if params.get("search"):
            queryset = queryset.filter(
                Q(clienta__nombre__icontains=params["search"])
                | Q(clienta__apellido__icontains=params["search"])
                | Q(clienta__telefono__icontains=params["search"])
            )

        if params.get("ordering") == "-inicio":
            return queryset.order_by("-inicio")

        if not any(params.get(name) for name in ("fecha", "desde", "hasta")):
            proximidad = Case(
                When(inicio__gte=timezone.now(), then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
            return queryset.order_by(proximidad, "inicio")

        return queryset.order_by("inicio")

    def _cambiar_estado(self, turno, estados_permitidos, nuevo_estado):
        if turno.estado not in estados_permitidos:
            return Response(
                {"detail": "Esta acción no está disponible para el turno."},
                status=400,
            )

        turno.estado = nuevo_estado
        turno.save(update_fields=["estado", "actualizado_en"])
        return Response(self.get_serializer(turno).data)

    @staticmethod
    def _turno_ya_inicio(turno):
        return turno.inicio <= timezone.now()

    @action(detail=True, methods=["post"])
    def confirmar(self, request, *args, **kwargs):
        return self._cambiar_estado(
            self.get_object(),
            [Turno.Estado.PENDIENTE, Turno.Estado.REPROGRAMADO],
            Turno.Estado.CONFIRMADO,
        )

    @action(detail=True, methods=["post"])
    def cancelar(self, request, *args, **kwargs):
        return self._cambiar_estado(
            self.get_object(),
            [Turno.Estado.PENDIENTE, Turno.Estado.CONFIRMADO, Turno.Estado.REPROGRAMADO],
            Turno.Estado.CANCELADO,
        )

    @action(detail=True, methods=["post"])
    def realizar(self, request, *args, **kwargs):
        turno = self.get_object()
        if not self._turno_ya_inicio(turno):
            return Response(
                {"detail": "No podés marcar como realizado un turno que todavía no comenzó."},
                status=400,
            )
        return self._cambiar_estado(
            turno,
            [Turno.Estado.CONFIRMADO, Turno.Estado.REPROGRAMADO],
            Turno.Estado.REALIZADO,
        )

    @action(detail=True, methods=["post"], url_path="no-vino")
    def no_vino(self, request, *args, **kwargs):
        turno = self.get_object()
        if not self._turno_ya_inicio(turno):
            return Response(
                {"detail": "No podés marcar como no vino un turno que todavía no comenzó."},
                status=400,
            )
        return self._cambiar_estado(
            turno,
            [Turno.Estado.PENDIENTE, Turno.Estado.CONFIRMADO, Turno.Estado.REPROGRAMADO],
            Turno.Estado.NO_VINO,
        )

    @action(detail=True, methods=["post"])
    def reprogramar(self, request, *args, **kwargs):
        turno = self.get_object()
        if turno.estado in {Turno.Estado.CANCELADO, Turno.Estado.REALIZADO, Turno.Estado.NO_VINO}:
            return Response({"detail": "Este turno no puede reprogramarse."}, status=400)

        datos_reprogramacion = ReprogramarTurnoSerializer(data=request.data)
        datos_reprogramacion.is_valid(raise_exception=True)
        serializer = self.get_serializer(
            turno,
            data={"inicio": datos_reprogramacion.validated_data["inicio"]},
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        turno.estado = Turno.Estado.REPROGRAMADO
        turno.save(update_fields=["estado", "actualizado_en"])
        return Response(self.get_serializer(turno).data)
