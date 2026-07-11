from rest_framework.routers import DefaultRouter

from .views import ClientaViewSet


router = DefaultRouter()
router.register("", ClientaViewSet, basename="clienta")

urlpatterns = router.urls
