from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import UserProfile
from schematics.models import Building, Schematic

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Créer ou récupérer le bâtiment par défaut "Batiment A"
        building, building_created = Building.objects.get_or_create(
            name='Batiment A',
            defaults={
                'description': 'Batiment par defaut',
                'floor': 1
            }
        )

        # Créer ou récupérer le schéma par défaut "RDC"
        schematic, schematic_created = Schematic.objects.get_or_create(
            building=building,
            name='RDC',
            defaults={
                'width': 1000,
                'height': 800,
                'background_color': '#FFFFFF'
            }
        )

        # Créer le UserProfile avec le schéma par défaut
        UserProfile.objects.create(
            user=instance,
            default_schematic=schematic
        )

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    # Note: UserProfile est créé automatiquement par create_user_profile ci-dessus