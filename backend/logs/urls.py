from django.urls import path
from .views import (
    ScanLogsView,
    UserScanLogsView,
    LockScanLogsView
)

urlpatterns = [
    path('', ScanLogsView.as_view(), name='scan_logs'),
    path('user/', UserScanLogsView.as_view(), name='user_scan_logs'),
    path('lock/<int:lock_id>/', LockScanLogsView.as_view(), name='lock_scan_logs'),
]
