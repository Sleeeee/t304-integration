from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User, Group
from locks.models import Lock, Lock_Group
from .models import LockPermission
from .serializers import LockPermissionSerializer


class LockPermissionView(APIView):
    """
    APIView for retrieving LockPermission data.

    Query parameters:
    - id: User ID (for type='user')
    - group_id: Group ID (for type='group')
    - lock_id: Lock ID (for type='lock')
    - lock_group_id: Lock Group ID (for type='lock_group')
    """

    def get(self, request):
        user = request.user

        if not (user.is_authenticated and user.is_staff):
            return Response(
                {"error": "Unauthorized to fetch permissions"},
                status=401
            )

        query_type = request.query_params.get('type')

        try:
            if query_type == 'user':
                return self._get_user_permissions(request)
            elif query_type == 'group':
                return self._get_group_permissions(request)
            elif query_type == 'lock':
                return self._get_lock_permissions(request)
            elif query_type == 'lock_group':
                return self._get_lock_group_permissions(request)
            elif query_type == 'all':
                return self._get_all_permissions()
            else:
                return Response(
                    {"error": f"Invalid type parameter: {
                        query_type}. Valid options: user, group, lock, lock_group, all"},
                    status=400
                )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=400
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=404
            )

    def _get_user_permissions(self, request):
        """Get permissions for a specific user. Requires 'id' query parameter."""
        user_id = request.query_params.get('id')
        if not user_id:
            raise ValueError("Missing required query parameter: id")

        target_user = User.objects.get(id=user_id)
        permissions = LockPermission.objects.filter(user=target_user)
        serializer = LockPermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=200)

    def _get_group_permissions(self, request):
        """Get permissions for a specific group. Requires 'group_id' query parameter."""
        group_id = request.query_params.get('group_id')
        if not group_id:
            raise ValueError("Missing required query parameter: group_id")

        target_group = Group.objects.get(id=group_id)
        permissions = LockPermission.objects.filter(group=target_group)
        serializer = LockPermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=200)

    def _get_lock_permissions(self, request):
        """Get permissions for a specific lock. Requires 'lock_id' query parameter."""
        lock_id = request.query_params.get('lock_id')
        if not lock_id:
            raise ValueError("Missing required query parameter: lock_id")

        target_lock = Lock.objects.get(id_lock=lock_id)
        permissions = LockPermission.objects.filter(lock=target_lock)
        serializer = LockPermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=200)

    def _get_lock_group_permissions(self, request):
        """Get permissions for a specific lock group. Requires 'lock_group_id' query parameter."""
        lock_group_id = request.query_params.get('lock_group_id')
        if not lock_group_id:
            raise ValueError("Missing required query parameter: lock_group_id")

        target_lock_group = Lock_Group.objects.get(id_group=lock_group_id)
        permissions = LockPermission.objects.filter(
            lock_group=target_lock_group)
        serializer = LockPermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=200)

    def _get_all_permissions(self):
        """Get all permissions in the system."""
        permissions = LockPermission.objects.all()
        serializer = LockPermissionSerializer(permissions, many=True)
        return Response(serializer.data, status=200)
