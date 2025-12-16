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
        # On récupère le dernier log
        if hasattr(obj, 'latest_log') and obj.latest_log:
            log = obj.latest_log[0]
        else:
            log = obj.lockbatterylog_set.order_by('-id').first()

        if log:
            # --- LOGIQUE DE CALCUL (Voltage Mapping) ---
            # Basé sur une cellule Li-Ion (Max 4.2V, Nominale 3.7V, Min 3.0V)
            
            voltage = log.voltage
            bars = 0
            
            # Seuils ajustés pour la "courbe plate"
            if voltage >= 4.00:      # 100% - 85% (Chargée à bloc)
                bars = 4
            elif voltage >= 3.75:    # 85% - 50% (Début du plateau)
                bars = 3
            elif voltage >= 3.55:    # 50% - 20% (Fin du plateau)
                bars = 2
            elif voltage >= 3.30:    # 20% - 5% (Chute finale)
                bars = 1
            else:                    # < 5% (Danger)
                bars = 0

            return {
                "voltage": voltage,
                "current": log.current,
                "timestamp": log.timestamp,
                "bars": bars,
                "percent_approx": int((bars / 4) * 100)
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
