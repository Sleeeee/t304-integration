from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser  
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
# Create your views here.
