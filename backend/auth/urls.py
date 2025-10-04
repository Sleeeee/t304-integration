from django.urls import path
from .views import *

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("plogin/", PhysicalLoginView.as_view(), name="physical_login"),
    path('wlogin/', WebLoginView.as_view(), name="web_login"),
]
