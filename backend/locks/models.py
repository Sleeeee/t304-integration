from django.db import models
from django.contrib.postgres.fields import ArrayField


class Lock(models.Model):
    STATUS_CHOICES = [
        ('connected', 'Connected'),
        ('disconnected', 'Disconnected'),
        ('error', 'Error'),
    ]

    AUTH_METHODS = [
        ("badge", "Badge"),
        ("keypad", "Keypad"),
    ]

    id_lock = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='disconnected')
    last_connexion = models.DateTimeField(blank=True, null=True)

    is_reservable = models.BooleanField(
        default=False,
        help_text="Indique si cette serrure (salle) peut être réservée par les utilisateurs."
    )

    auth_methods = ArrayField(
        models.CharField(max_length=20, choices=AUTH_METHODS),
        default=list,
        blank=True,
    )

    def __str__(self):
        return self.name


class Lock_Group(models.Model):
    id_group = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    locks = models.ManyToManyField(Lock, related_name='groups', blank=True)

    def __str__(self):
        return self.name
