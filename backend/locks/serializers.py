from rest_framework import serializers
from .models import Lock, Lock_Group

class LockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lock
        fields = '__all__'


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