from django.db import models
from django.conf import settings

class Reservation(models.Model):
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="reservations"
    )
    
    lock = models.ForeignKey(
        'locks.Lock',  # Référence au modèle Lock de ton app 'locks'
        on_delete=models.CASCADE, 
        related_name="reservations"
    )

    # --- Détails de la réservation ---
    
    # Le jour de la réservation
    date = models.DateField()
    
    # L'heure de début (ex: 14:00)
    start_time = models.TimeField()
    
    # L'heure de fin (ex: 15:30)
    end_time = models.TimeField()
    
    # Le statut (contrôlé par l'admin)
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending' # Toute nouvelle demande est "En attente"
    )
    
    # --- Champs de suivi (optionnel mais recommandé) ---
    
    # Une note que l'utilisateur peut ajouter (ex: "Besoin du projecteur")
    notes = models.TextField(blank=True, null=True)
    
    # Quand la demande a-t-elle été créée ?
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Quand a-t-elle été mise à jour (approuvée/rejetée) ?
    updated_at = models.DateTimeField(auto_now=True)

    
    class Meta:
        # Ordonne les réservations par date et heure de début
        ordering = ['date', 'start_time']
        
        unique_together = ('lock', 'date', 'start_time')

    def __str__(self):
        # Pour un affichage clair dans l'admin Django
        return f"{self.user.username} - {self.lock.name} ({self.date} {self.start_time}) - [{self.status}]"