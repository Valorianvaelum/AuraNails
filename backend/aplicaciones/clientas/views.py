from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import Clienta
from .serializers import ClientaSerializer


class ClientaViewSet(ModelViewSet):
    serializer_class = ClientaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Clienta.objects.filter(propietaria=self.request.user)
        if self.action != "list":
            return queryset

        estado = self.request.query_params.get("estado", "activas")
        search = self.request.query_params.get("search", "").strip()

        if estado == "inactivas":
            queryset = queryset.filter(activa=False)
        elif estado != "todas":
            queryset = queryset.filter(activa=True)

        if search:
            queryset = queryset.filter(
                Q(nombre__icontains=search)
                | Q(apellido__icontains=search)
                | Q(telefono__icontains=search)
                | Q(email__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(propietaria=self.request.user)

    @action(detail=True, methods=["post"])
    def desactivar(self, request, *args, **kwargs):
        clienta = self.get_object()
        clienta.activa = False
        clienta.save(update_fields=["activa", "actualizada_en"])
        return Response(self.get_serializer(clienta).data)

    @action(detail=True, methods=["post"])
    def reactivar(self, request, *args, **kwargs):
        clienta = self.get_object()
        clienta.activa = True
        clienta.save(update_fields=["activa", "actualizada_en"])
        return Response(self.get_serializer(clienta).data)
