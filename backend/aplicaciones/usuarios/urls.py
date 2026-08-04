from django.urls import path

from .views import (
    LoginView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RefreshView,
    UsuarioActualView,
)


urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("me/", UsuarioActualView.as_view(), name="auth-me"),
    path(
        "password-reset/request/",
        PasswordResetRequestView.as_view(),
        name="auth-password-reset-request",
    ),
    path(
        "password-reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
]
