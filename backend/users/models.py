from django.db import models
from django.contrib.auth.models import User
from schematics.models import Schematic

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    default_schematic = models.ForeignKey(
        Schematic, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )

    def __str__(self):
        return f'{self.user.username} Profile'