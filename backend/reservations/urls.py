from django.urls import path
from .views import (
    ReservationListView, 
    AllReservationsListView, 
    UpdateReservationStatusView,
    AvailableLocksView  # <-- 1. Importer la nouvelle vue
)

urlpatterns = [
    path('', ReservationListView.as_view(), name='reservation-list-create'),
    path('all/', AllReservationsListView.as_view(), name='all-reservations-list'),
    path('<int:reservation_id>/status/', UpdateReservationStatusView.as_view(), name='update-reservation-status'),
    
    # --- 2. AJOUTER LE NOUVEAU CHEMIN ---
    # GET /reservations/available/?date=...&start_time=...&end_time=...
    path('available/', AvailableLocksView.as_view(), name='available-locks'),
]