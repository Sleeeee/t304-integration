from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import ScanLog
from .serializers import ScanLogSerializer


class ScanLogsView(APIView):
    """
    GET: Récupère tous les logs de scan (triés par date décroissante)
    POST: Crée un nouveau log de scan
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        logs = ScanLog.objects.all().order_by('-scan_datetime')
        serializer = ScanLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ScanLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Log créé avec succès",
                "log": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserScanLogsView(APIView):
    """
    GET: Récupère les logs de scan pour l'utilisateur connecté
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logs = ScanLog.objects.filter(user=user).order_by('-scan_datetime')
        serializer = ScanLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LockScanLogsView(APIView):
    """
    GET: Récupère les logs de scan pour une serrure spécifique
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, lock_id):
        user = request.user
        if not user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        logs = ScanLog.objects.filter(lock_id=lock_id).order_by('-scan_datetime')
        serializer = ScanLogSerializer(logs, many=True)
        return Response({
            "lock_id": lock_id,
            "logs_count": logs.count(),
            "logs": serializer.data
        }, status=status.HTTP_200_OK)
