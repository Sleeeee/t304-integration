from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User, Group
from locks.models import Lock, Lock_Group
from .models import LockPermission
from .serializers import LockPermissionSerializer
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist


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

    def _resolve_related_objects(self, permission_data: dict) -> dict:
        """
        Resolves related model instances from IDs in the permission data object.
        Raises ObjectDoesNotExist if any ID cannot be resolved.
        """
        related_objects = {}

        # 1. Resolve Entity side (User or Group)
        if 'user' in permission_data and permission_data['user'] is not None:
            related_objects['user'] = User.objects.get(
                pk=permission_data['user'])
        elif 'group' in permission_data and permission_data['group'] is not None:
            related_objects['group'] = Group.objects.get(
                pk=permission_data['group'])

        # 2. Resolve Target side (Lock or Lock_Group)
        if 'lock' in permission_data and permission_data['lock'] is not None:
            related_objects['lock'] = Lock.objects.get(
                pk=permission_data['lock'])
        elif 'lock_group' in permission_data and permission_data['lock_group'] is not None:
            related_objects['lock_group'] = Lock_Group.objects.get(
                pk=permission_data['lock_group'])

        # 3. Validation: Ensure we have a valid entity-target pair
        has_entity = 'user' in related_objects or 'group' in related_objects
        has_target = 'lock' in related_objects or 'lock_group' in related_objects

        if not (has_entity and has_target):
            raise ValueError(
                "Permission object is incomplete. Requires an entity (User/Group) and a target (Lock/Lock Group).")

        return related_objects

    def post(self, request):
        user = request.user

        if not (user.is_authenticated and user.is_superuser):
            return Response(
                {"error": "Unauthorized to modify permissions. Superuser access required."},
                status=401
            )

        data = request.data
        to_add = data.get('toAdd', [])
        to_remove = data.get('toRemove', [])

        if not isinstance(to_add, list) or not isinstance(to_remove, list):
            return Response(
                {"error": "Invalid data format. 'toAdd' and 'toRemove' must be lists."},
                status=400
            )

        results = {
            'added_count': 0,
            'removed_count': 0,
            'errors': []
        }

        # Use a transaction to ensure database consistency for batch operation
        try:
            with transaction.atomic():
                # 1. Handle Additions (Create permissions)
                for i, perm_data in enumerate(to_add):
                    try:
                        related_objects = self._resolve_related_objects(
                            perm_data)

                        # Use get_or_create to prevent adding duplicates
                        _, created = LockPermission.objects.get_or_create(
                            **related_objects)
                        if created:
                            results['added_count'] += 1

                    except (ObjectDoesNotExist, ValueError, TypeError) as e:
                        results['errors'].append({
                            'action': 'add',
                            'index': i,
                            'data': perm_data,
                            'message': f"Error adding permission: {e}"
                        })

                # 2. Handle Removals (Delete permissions)
                for i, perm_data in enumerate(to_remove):
                    try:
                        related_objects = self._resolve_related_objects(
                            perm_data)

                        # Filter and delete all matching permission records
                        deleted_count, _ = LockPermission.objects.filter(
                            **related_objects).delete()
                        results['removed_count'] += deleted_count

                    except (ObjectDoesNotExist, ValueError, TypeError) as e:
                        results['errors'].append({
                            'action': 'remove',
                            'index': i,
                            'data': perm_data,
                            'message': f"Error removing permission: {e}"
                        })

        except Exception as e:
            # Catch database/transaction level errors
            return Response(
                {"error": f"A critical database error occurred: {e}"},
                status=500
            )

        # Determine final response status
        if results['errors']:
            status_code = 400
            success_message = (f"Completed all non-errored changes. Added {results['added_count']} and removed {results['removed_count']} permissions, "
                               f"but encountered {len(results['errors'])} errors.")
        else:
            status_code = 200
            success_message = f"Successfully added {results['added_count']} permissions and removed {
                results['removed_count']} permissions."

        return Response({
            "message": success_message,
            "details": results
        }, status=status_code)
