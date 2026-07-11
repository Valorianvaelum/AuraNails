from django.urls import path

from .views import LoginView, RefreshView, UsuarioActualView


urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", UsuarioActualView.as_view(), name="auth-me"),
]
