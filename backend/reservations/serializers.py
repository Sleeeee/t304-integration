from rest_framework import serializers
from .models import Reservation
# On a besoin des serializers de User et Lock pour les afficher
from users.serializers import UserSerializer
from locks.serializers import LockSerializer 

class ReservationSerializer(serializers.ModelSerializer):
    # Ces lignes permettent d'afficher les détails de l'utilisateur et de la salle
    # (au lieu de juste leur ID)
    user = UserSerializer(read_only=True)
    lock = LockSerializer(read_only=True)

    class Meta:
        model = Reservation
        # On inclut tous les champs du modèle
        fields = [
            'id', 
            'user', 
            'lock', 
            'date', 
            'start_time', 
            'end_time', 
            'status',
            'notes',
            'created_at',
        ]
        # 'user' et 'lock' sont gérés par la vue, pas envoyés directement
        read_only_fields = ['user', 'status', 'created_at']

# Un serializer simple juste pour la création
class CreateReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        # L'utilisateur n'envoie que ces champs
        fields = ['lock', 'date', 'start_time', 'end_time', 'notes']