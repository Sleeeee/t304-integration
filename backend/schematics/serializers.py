from rest_framework import serializers
from .models import Schematic, SchematicLock, SchematicWall
from locks.models import Lock
from locks.serializers import LockSerializer

class SchematicSerializer(serializers.ModelSerializer):
    """
    Traduit le modèle Schematic principal (infos de base du canevas)
    """
    class Meta:
        model = Schematic
        fields = [
            'id', 
            'name', 
            'width', 
            'height', 
            'background_color', 
            'building'
        ]

class SchematicWallSerializer(serializers.ModelSerializer):
    """
    Traduit un mur (lignes) sur le schéma
    """
    class Meta:
        model = SchematicWall
        fields = [
            'id', 
            'x', 
            'y', 
            'points', 
            'scale_x', 
            'scale_y', 
            'rotation'
        ]

class SchematicLockSerializer(serializers.ModelSerializer):
    """
    Traduit une serrure placée sur le schéma.
    C'est la partie la plus importante pour ton éditeur Konva.
    """
    
    # Pour le GET (lecture):
    # On imbrique le LockSerializer pour avoir tous les détails
    # de la serrure (comme son nom) au lieu d'un simple ID.
    lock = LockSerializer(read_only=True)

    lock_id = serializers.PrimaryKeyRelatedField(
        queryset=Lock.objects.all(), 
        source='lock', 
        write_only=True
    )

    class Meta:
        model = SchematicLock
        fields = [
            'id', 
            'lock',       # Pour lire (GET)
            'lock_id',
            'x', 
            'y', 
            'scale_x', 
            'scale_y', 
            'rotation',
            'color'
        ]
        read_only_fields = ['id']


class SchematicEditorDataSerializer(serializers.Serializer):
    """
    Ce n'est pas un ModelSerializer. C'est un "emballage" personnalisé
    pour notre vue d'API. Il nous permet de renvoyer un seul objet JSON 
    avec TOUTES les données dont Konva a besoin en une seule fois.
    """
    schematic = SchematicSerializer()
    placed_walls = SchematicWallSerializer(many=True)
    placed_locks = SchematicLockSerializer(many=True)
    
    # La liste de toutes les serrures disponibles (pour la barre latérale)
    available_locks = LockSerializer(many=True)