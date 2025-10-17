from django.urls import path
from .views import LockPermissionView
urlpatterns = [
    path("", LockPermissionView.as_view(), name="lock_permission")
]
