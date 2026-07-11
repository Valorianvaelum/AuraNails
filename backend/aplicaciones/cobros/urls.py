from rest_framework.routers import DefaultRouter

from .views import CobroViewSet


router = DefaultRouter()
router.register("", CobroViewSet, basename="cobro")

urlpatterns = router.urls
