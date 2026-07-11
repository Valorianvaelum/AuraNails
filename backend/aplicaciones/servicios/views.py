from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Servicio
from .serializers import ServicioSerializer


class ServicioViewSet(ModelViewSet):
    serializer_class = ServicioSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Servicio.objects.filter(propietaria=self.request.user)
        if self.action != "list":
            return queryset
        estado = self.request.query_params.get("estado", "activos")
        search = self.request.query_params.get("search", "").strip()
        if estado == "pausados":
            queryset = queryset.filter(activo=False)
        elif estado != "todos":
            queryset = queryset.filter(activo=True)
        if search:
            queryset = queryset.filter(Q(nombre__icontains=search) | Q(descripcion__icontains=search))
        return queryset

    def perform_create(self, serializer):
        serializer.save(propietaria=self.request.user)

    @action(detail=True, methods=["post"])
    def pausar(self, request, *args, **kwargs):
        servicio = self.get_object()
        servicio.activo = False
        servicio.save(update_fields=["activo", "actualizado_en"])
        return Response(self.get_serializer(servicio).data)

    @action(detail=True, methods=["post"])
    def reactivar(self, request, *args, **kwargs):
        servicio = self.get_object()
        servicio.activo = True
        servicio.save(update_fields=["activo", "actualizado_en"])
        return Response(self.get_serializer(servicio).data)
