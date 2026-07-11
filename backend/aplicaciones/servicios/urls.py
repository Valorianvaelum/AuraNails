from rest_framework.routers import DefaultRouter
from .views import ServicioViewSet

router = DefaultRouter()
router.register("", ServicioViewSet, basename="servicio")
urlpatterns = router.urls
