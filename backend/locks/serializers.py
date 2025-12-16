from rest_framework import serializers
from .models import Lock, Lock_Group, LockBatteryLog


class LockSerializer(serializers.ModelSerializer):
    battery_level = serializers.SerializerMethodField()

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

    def get_battery_level(self, obj):
        if hasattr(obj, 'latest_log') and obj.latest_log:
            # If we prefetched it in the view (Optimized)
            log = obj.latest_log[0]
            return {
                "voltage": log.voltage,
                "current": log.current,
                "timestamp": log.timestamp
            }

        # Fallback
        log = obj.lockbatterylog_set.order_by('-id').first()
        if log:
            return {
                "voltage": log.voltage,
                "current": log.current,
                "timestamp": log.timestamp
            }
        return None


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
