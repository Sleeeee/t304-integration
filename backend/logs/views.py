from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny
from .models import AccessLog

class AccessLogListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        userid = request.query_params.get("user_id")
        logs = AccessLog.objects.all()
        if userid:
            logs = logs.filter(user__id=userid)
        data = [
            {
                "timestamp": log.timestamp,
                "method": log.method,
                "user": log.user.username if log.user else None,
                "failed_code": log.failed_code,
                "lock_id": log.lock_id,
                "lock_name": log.lock_name,
                "result": log.result,
            }
            for log in logs.order_by("-timestamp")[:100]
        ]
        return Response(data)


class LogsListView(APIView):
    """Vue pour récupérer tous les logs - compatible avec le frontend"""
    permission_classes = [AllowAny]  # TODO: Changer en IsAuthenticated en production

    def get(self, request):
        logs = AccessLog.objects.select_related('user').all().order_by("-timestamp")[:100]

        data = [
            {
                "id_log": log.id,
                "lock": {
                    "id_lock": int(log.lock_id) if log.lock_id.isdigit() else 0,
                    "name": log.lock_name or "Unknown",
                },
                "user": {
                    "id": log.user.id if log.user else 0,
                    "username": log.user.username if log.user else "Unknown",
                },
                "scan_datetime": log.timestamp.isoformat(),
                "success": log.result == "success",
            }
            for log in logs
        ]
        return Response(data)


class LockLogsView(APIView):
    """Vue pour récupérer les logs d'une serrure spécifique"""
    permission_classes = [AllowAny]  # TODO: Changer en IsAuthenticated en production

    def get(self, request, lock_id):
        logs = AccessLog.objects.select_related('user').filter(
            lock_id=str(lock_id)
        ).order_by("-timestamp")[:100]

        data = [
            {
                "id_log": log.id,
                "lock": {
                    "id_lock": int(log.lock_id) if log.lock_id.isdigit() else 0,
                    "name": log.lock_name or "Unknown",
                },
                "user": {
                    "id": log.user.id if log.user else 0,
                    "username": log.user.username if log.user else "Unknown",
                },
                "scan_datetime": log.timestamp.isoformat(),
                "success": log.result == "success",
            }
            for log in logs
        ]

        return Response({"logs": data})
