from django.contrib.auth import get_user_model
from rest_framework.serializers import ModelSerializer, SerializerMethodField
from users.models import UserProfile

User = get_user_model()


class UserSerializer(ModelSerializer):
    default_schematic_id = SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "is_staff", "is_superuser", "default_schematic_id")

    def get_default_schematic_id(self, obj):
        try:
            return obj.profile.default_schematic.id
        except (UserProfile.DoesNotExist, AttributeError, TypeError):
            return None
