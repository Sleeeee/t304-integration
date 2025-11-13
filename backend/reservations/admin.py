from django.contrib import admin
from .models import Reservation

# On crée une classe de configuration pour l'admin
class ReservationAdmin(admin.ModelAdmin):
    # Quels champs afficher dans la liste
    list_display = (
        'user', 
        'lock', 
        'date', 
        'start_time', 
        'end_time', 
        'status'
    )
    
    # Quels champs peuvent être utilisés pour filtrer
    list_filter = ('status', 'date', 'lock')
    
    # Quels champs peuvent être utilisés pour rechercher
    search_fields = ('user__username', 'lock__name')
    
    # LA PARTIE IMPORTANTE :
    # Permet aux admins de changer le statut (ex: 'pending' -> 'approved')
    # directement depuis la liste, sans devoir ouvrir chaque réservation.
    list_editable = ('status',)

# On enregistre le modèle Reservation avec sa configuration personnalisée
admin.site.register(Reservation, ReservationAdmin)

# Register your models here.
