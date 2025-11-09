from django.urls import path
from .views import BadgeCodeLoginView, KeypadCodeLoginView, MeView, WebLoginView, WebLogoutView

urlpatterns = [
    path("badge/", BadgeCodeLoginView.as_view(), name="badge_login"),
    path("keypad/", KeypadCodeLoginView.as_view(), name="keypad_login"),
    path("me/", MeView.as_view(), name="me"),
    path("wlogin/", WebLoginView.as_view(), name="web_login"),
    path("wlogout/", WebLogoutView.as_view(), name="web_logout"),
]
