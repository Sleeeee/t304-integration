from rest_framework import serializers
from .models import ScanLog
from locks.models import Lock
from django.contrib.auth import get_user_model

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class LockMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lock
        fields = ['id_lock', 'name']


class ScanLogSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    lock = LockMinimalSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    lock_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = ScanLog
        fields = ['id_log', 'lock', 'user', 'scan_datetime', 'success', 'user_id', 'lock_id']
        read_only_fields = ['id_log', 'scan_datetime']

    def create(self, validated_data):
        user_id = validated_data.pop('user_id', None)
        lock_id = validated_data.pop('lock_id', None)

        if user_id:
            validated_data['user'] = User.objects.get(id=user_id)
        if lock_id:
            validated_data['lock'] = Lock.objects.get(id_lock=lock_id)

        return super().create(validated_data)
