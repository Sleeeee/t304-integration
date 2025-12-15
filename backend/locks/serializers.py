from rest_framework import serializers
from .models import Lock, Lock_Group, LockBatteryLog


class LockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lock
        fields = '__all__'

    auth_methods = serializers.ListField(
        child=serializers.ChoiceField(choices=Lock.AUTH_METHODS),
        required=False,
        allow_empty=True,
        help_text="List of allowed authentication methods (e.g., ['badge', 'keypad'])"
    )

    def validate_auth_methods(self, value):
        return list(set(value))


class LockGroupSerializer(serializers.ModelSerializer):
    locks = LockSerializer(many=True, read_only=True)

    class Meta:
        model = Lock_Group
        fields = ['id_group', 'name', 'locks']


class AddLocksToGroupSerializer(serializers.Serializer):
    lock_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )


class LockBatteryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LockBatteryLog
        fields = ['lock', 'voltage', 'current', 'timestamp']
