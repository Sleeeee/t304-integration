from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Lock, Lock_Group
from .serializers import LockSerializer, LockGroupSerializer, AddLocksToGroupSerializer


class LocksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        locks = Lock.objects.all()
        return Response({"locks": LockSerializer(locks, many=True).data}, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user

        if not (user.is_authenticated and user.is_superuser):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        serializer = LockSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Lock created", "lock": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        user = request.user
        if not user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        lock_id = request.data.get("id_lock")
        if not lock_id:
            return Response({"error": "Missing id_lock"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            lock = Lock.objects.get(id_lock=lock_id)
        except Lock.DoesNotExist:
            return Response({"error": "Lock not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = LockSerializer(lock, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Lock updated", "lock": serializer.data}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        if not user.is_superuser:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        lock_id = request.data.get("id_lock")
        if not lock_id:
            return Response({"error": "Missing id_lock"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            lock = Lock.objects.get(id_lock=lock_id)
            lock.delete()
            return Response({"message": "Lock deleted"}, status=status.HTTP_200_OK)
        except Lock.DoesNotExist:
            return Response({"error": "Lock not found"}, status=status.HTTP_404_NOT_FOUND)


class LockGroupsView(APIView):
    """GET: Liste les groupes de serrures
       POST: Crée un nouveau groupe de serrures
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_staff:
            return Response({"error": "Unauthorized to view lock groups"}, status=status.HTTP_403_FORBIDDEN)

        groups = Lock_Group.objects.all()
        serializer = LockGroupSerializer(groups, many=True)
        return Response({"lock_groups": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if not user.is_superuser:
            return Response({"error": "Unauthorized to create lock groups"}, status=status.HTTP_403_FORBIDDEN)

        serializer = LockGroupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Groupe de serrures créé avec succès",
                "lock_group": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddLocksToGroupView(APIView):
    """POST: Ajoute des serrures à un groupe"""
    permission_classes = [IsAuthenticated]

    def post(self, request, group_id):
        user = request.user
        if not user.is_superuser:
            return Response({"error": "Unauthorized to modify lock groups"}, status=status.HTTP_403_FORBIDDEN)

        group = get_object_or_404(Lock_Group, id_group=group_id)
        serializer = AddLocksToGroupSerializer(data=request.data)

        if serializer.is_valid():
            lock_ids = serializer.validated_data['lock_ids']
            locks = Lock.objects.filter(id_lock__in=lock_ids)

            if not locks.exists():
                return Response({"error": "Aucune serrure trouvée avec ces IDs"}, status=status.HTTP_404_NOT_FOUND)

            for lock in locks:
                group.locks.add(lock)

            return Response({
                "message": f"{locks.count()} serrure(s) ajoutée(s) au groupe '{group.name}'.",
                "group": group.name,
                "locks_added": [lock.name for lock in locks]
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupLocksView(APIView):
    """GET: Liste toutes les serrures d’un groupe"""
    permission_classes = [IsAuthenticated]

    def get(self, request, group_id):
        user = request.user
        if not user.is_staff:
            return Response({"error": "Unauthorized to view group locks"}, status=status.HTTP_403_FORBIDDEN)

        group = get_object_or_404(Lock_Group, id_group=group_id)
        locks = group.locks.all()
        serializer = LockSerializer(locks, many=True)
        return Response({
            "group": group.name,
            "locks_count": locks.count(),
            "locks": serializer.data
        }, status=status.HTTP_200_OK)


class RemoveLockFromGroupView(APIView):
    """DELETE: Supprime des serrures d’un groupe"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, group_id):
        user = request.user
        if not user.is_superuser:
            return Response({"error": "Unauthorized to modify lock groups"}, status=status.HTTP_403_FORBIDDEN)

        group = get_object_or_404(Lock_Group, id_group=group_id)
        serializer = AddLocksToGroupSerializer(data=request.data)

        if serializer.is_valid():
            lock_ids = serializer.validated_data['lock_ids']
            locks = Lock.objects.filter(id_lock__in=lock_ids)

            if not locks.exists():
                return Response({"error": "Aucune serrure trouvée avec ces IDs"}, status=status.HTTP_404_NOT_FOUND)

            for lock in locks:
                group.locks.remove(lock)

            return Response({
                "message": f"{locks.count()} serrure(s) retirée(s) du groupe '{group.name}'.",
                "group": group.name,
                "locks_removed": [lock.name for lock in locks]
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteLockGroupView(APIView):
    """DELETE: Supprime un groupe de serrures"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, group_id):
        user = request.user
        if not user.is_superuser:
            return Response({"error": "Unauthorized to delete lock groups"}, status=status.HTTP_403_FORBIDDEN)

        group = get_object_or_404(Lock_Group, id_group=group_id)
        group_name = group.name
        group.delete()

        return Response(
            {"message": f"Le groupe '{group_name}' a été supprimé avec succès."},
            status=status.HTTP_204_NO_CONTENT
        )
