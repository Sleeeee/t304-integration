from django.urls import path
from .views import AccessLogListView

urlpatterns = [
    path("accesslogs/", AccessLogListView.as_view(), name="accesslog-list"),
]
