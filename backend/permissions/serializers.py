from rest_framework import serializers
from .models import LockPermission


class LockPermissionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(
        source='user.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    lock_name = serializers.CharField(source='lock.name', read_only=True)
    lock_group_name = serializers.CharField(
        source='lock_group.name', read_only=True)

    class Meta:
        model = LockPermission
        fields = (
            'id',
            'user',
            'user_username',
            'group',
            'group_name',
            'lock',
            'lock_name',
            'lock_group',
            'lock_group_name',
            'created_at',
            'updated_at',
        )
