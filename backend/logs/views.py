from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny
from django.db.models import Q  
from django.contrib.auth import get_user_model
from .models import AccessLog

User = get_user_model()

class AccessLogListView(APIView):
    permission_classes = [AllowAny] 

    def get(self, request):
        user_id = request.query_params.get("user_id")
        lock_id = request.query_params.get("lock_id")

        logs = AccessLog.objects.all()

        if user_id:
            try:
                user_obj = User.objects.get(id=user_id)
                logs = logs.filter(
                    Q(user__id=user_id) | Q(failed_code=user_obj.username)
                )
            except User.DoesNotExist:
                logs = logs.filter(user__id=user_id)
            except ValueError:
                return Response({"error": "Invalid user_id format."}, status=400)

        if lock_id:
            try:
                logs = logs.filter(lock_id=lock_id)
            except ValueError:
                return Response({"error": "Invalid lock_id format."}, status=400)

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