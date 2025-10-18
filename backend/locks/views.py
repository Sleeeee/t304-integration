from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Lock
from .serializers import LockSerializer


class LocksView(APIView):
    permission_classes = [IsAuthenticated]

    
    def get(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_staff:
            return Response({"error": "Unauthorized: only staff can view locks"}, status=status.HTTP_403_FORBIDDEN)

        locks = Lock.objects.all()
        serializer = LockSerializer(locks, many=True)
        return Response({"locks": serializer.data}, status=status.HTTP_200_OK)

    
    def post(self, request):
        user = request.user
        if not user.is_authenticated :
            return Response({"error": "Unauthorized: only admin can create locks"}, status=status.HTTP_403_FORBIDDEN)

        serializer = LockSerializer(data=request.data)
        if serializer.is_valid():
            lock = serializer.save()
            return Response({
                "message": "Lock created successfully",
                "lock": LockSerializer(lock).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    def delete(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "Unauthorized: only admin can delete locks"}, status=status.HTTP_403_FORBIDDEN)

        lock_id = request.data.get("id_lock")
        if not lock_id:
            return Response({"error": "Missing 'id_lock' in request body"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lock = Lock.objects.get(id_lock=lock_id)
            lock.delete()
            return Response({"message": f"Lock '{lock.name}' deleted successfully"}, status=status.HTTP_200_OK)
        except Lock.DoesNotExist:
            return Response({"error": "Lock not found"}, status=status.HTTP_404_NOT_FOUND)
