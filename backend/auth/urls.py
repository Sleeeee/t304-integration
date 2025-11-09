from django.urls import path
from .views import KeypadCodeLoginView, MeView, WebLoginView, WebLogoutView

urlpatterns = [
    path("keypad/", KeypadCodeLoginView.as_view(), name="keypad_login"),
    path("me/", MeView.as_view(), name="me"),
    path("wlogin/", WebLoginView.as_view(), name="web_login"),
    path("wlogout/", WebLogoutView.as_view(), name="web_logout"),
]
