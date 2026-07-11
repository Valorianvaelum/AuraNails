from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Cobro
from .serializers import AnularCobroSerializer, CobroSerializer
from .services import anular_cobro


class CobroViewSet(ModelViewSet):
    serializer_class = CobroSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        queryset = (
            Cobro.objects.filter(propietaria=self.request.user)
            .select_related("turno", "turno__clienta")
            .prefetch_related("turno__turno_servicios")
        )
        if self.action != "list":
            return queryset

        params = self.request.query_params
        if params.get("fecha"):
            queryset = queryset.filter(creado_en__date=params["fecha"])
        if params.get("metodo_pago"):
            queryset = queryset.filter(metodo_pago=params["metodo_pago"])
        if params.get("estado"):
            queryset = queryset.filter(estado=params["estado"])
        if params.get("search"):
            search = params["search"].strip()
            queryset = queryset.filter(
                Q(clienta_nombre_historica__icontains=search)
                | Q(turno__clienta__nombre__icontains=search)
                | Q(turno__clienta__apellido__icontains=search)
            )
        return queryset.order_by("-creado_en")

    @action(detail=True, methods=["post"])
    def anular(self, request, *args, **kwargs):
        datos = AnularCobroSerializer(data=request.data)
        datos.is_valid(raise_exception=True)
        cobro = anular_cobro(
            propietaria=request.user,
            cobro_id=self.get_object().id,
            motivo=datos.validated_data["motivo"],
        )
        return Response(self.get_serializer(cobro).data)
