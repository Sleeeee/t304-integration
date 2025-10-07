from django.urls import path
from .views import UsersView, RegisterView

urlpatterns = [
    path("", UsersView.as_view(), name="users"),
    path("register/", RegisterView.as_view(), name="register"),
]
