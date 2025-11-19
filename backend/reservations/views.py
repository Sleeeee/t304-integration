from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from django.db.models import Q # <-- 1. Import Q pour les requêtes

# --- 2. CORRECTION DES IMPORTS ---
from .models import Reservation  # Lock n'est pas ici
from locks.models import Lock    # Il faut l'importer de son app 'locks'
from locks.serializers import LockSerializer # Importé pour la vue 'available'
# -----------------------------------

from .serializers import ReservationSerializer, CreateReservationSerializer


class ReservationListView(APIView):
    """
    Vue pour les utilisateurs authentifiés.
    GET: Renvoie la liste de leurs propres réservations.
    POST: Crée une nouvelle demande de réservation.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reservations = Reservation.objects.filter(user=request.user)
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateReservationSerializer(data=request.data)
        if serializer.is_valid():
            # --- 3. UTILISER id_lock ---
            lock_id = serializer.validated_data['lock'].id_lock
            date = serializer.validated_data['date']
            start_time = serializer.validated_data['start_time']
            end_time = serializer.validated_data['end_time']
            
            conflicts = Reservation.objects.filter(
                lock_id=lock_id,
                date=date,
                status='approved'
            ).filter(
                Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
            )
            
            if conflicts.exists():
                return Response(
                    {"error": "This time slot is already booked and approved."},
                    status=status.HTTP_409_CONFLICT
                )
                
            reservation = serializer.save(user=request.user)
            full_data = ReservationSerializer(reservation).data
            return Response(full_data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- VUES POUR LES ADMINS ---

class AllReservationsListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reservations = Reservation.objects.all()
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateReservationStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, reservation_id):
        reservation = get_object_or_404(Reservation, id=reservation_id)
        
        new_status = request.data.get('status')
        
        if new_status not in ['approved', 'rejected']:
             return Response(
                {"error": "Invalid status. Must be 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status == 'approved':
            # --- 3. UTILISER id_lock ---
            lock_id = reservation.lock.id_lock
            date = reservation.date
            start_time = reservation.start_time
            end_time = reservation.end_time
            
            conflicts = Reservation.objects.filter(
                lock_id=lock_id,
                date=date,
                status='approved'
            ).filter(
                Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
            ).exclude(id=reservation_id)
            
            if conflicts.exists():
                return Response(
                    {"error": "Cannot approve. This time slot conflicts with another approved reservation."},
                    status=status.HTTP_409_CONFLICT
                )

        reservation.status = new_status
        reservation.save()
        
        serializer = ReservationSerializer(reservation)
        return Response(serializer.data, status=status.HTTP_200_OK)

# --- VUE POUR LE FORMULAIRE DE L'UTILISATEUR ---

class AvailableLocksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date = request.query_params.get('date')
        start_time = request.query_params.get('start_time')
        end_time = request.query_params.get('end_time')

        if not all([date, start_time, end_time]):
            return Response(
                {"error": "Missing required parameters: date, start_time, end_time"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # --- CORRECTION ICI ---
            conflicting_reservations = Reservation.objects.filter(
                date=date,
                # On vérifie si c'est Approuvé OU En attente
                # (Seules les "Rejected" libèrent la salle)
                status__in=['approved', 'pending'] 
            ).filter(
                # Cette logique est correcte :
                # Une réservation existe SI :
                # (Son début est AVANT ta fin) ET (Sa fin est APRÈS ton début)
                Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
            )

            conflicting_lock_ids = conflicting_reservations.values_list('lock_id', flat=True).distinct()

            # On ne prend que les serrures 'réservables'
            available_locks = Lock.objects.filter(is_reservable=True)
            
            # On retire celles qui ont un conflit
            available_locks = available_locks.exclude(id_lock__in=conflicting_lock_ids)

            serializer = LockSerializer(available_locks, many=True)
            return Response({"locks": serializer.data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)