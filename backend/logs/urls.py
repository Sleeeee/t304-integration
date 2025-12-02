from django.urls import path
from .views import AccessLogListView, LogsListView, LockLogsView

urlpatterns = [
    path("accesslogs/", AccessLogListView.as_view(), name="accesslog-list"),
    path("", LogsListView.as_view(), name="logs-list"),  # GET /logs/
    path("lock/<int:lock_id>/", LockLogsView.as_view(), name="lock-logs"),  # GET /logs/lock/{id}/
]
