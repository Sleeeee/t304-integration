import json
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from locks.models import Lock
from .serializers import UserSerializer
from .utils import get_user_by_keypad_code, get_user_by_badge_code
from permissions.utils import user_has_access_to_lock


class MeView(APIView):
    # Default permission is IsAuthenticated, which is correct here
    def get(self, request):
        user = request.user
        # --- CORRECTION ---
        # Any authenticated user should be able to see who they are.
        # The frontend will decide what to show based on 'is_staff'.
        if user.is_authenticated:
            return Response({"user": UserSerializer(user).data})

        return Response({"error": "Unauthenticated"}, status=401)


class WebLoginView(APIView):
    # --- CORRECTION ---
    # Allow anyone (even unauthenticated users) to access this endpoint.
    permission_classes = [AllowAny]

    def post(self, request):
        if request.user.is_authenticated:
            return Response({"message": "Already authenticated"}, status=200)

        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if username is None or password is None:
            return Response({
                "error": "Missing credentials"
            }, status=401)  # Use 400 for bad request

        user = authenticate(username=username, password=password)
        if user is not None:
            # --- CORRECTION ---
            # Log in ANY valid user, not just staff.
            login(request, user)
            return Response({
                "message": "Successfully authenticated",
                # The UserSerializer will include 'is_staff',
                # so the frontend can handle the routing.
                "user": UserSerializer(user).data
            }, status=200)

        return Response({"error": "Incorrect credentials"}, status=401)


class WebLogoutView(APIView):
    # Default permission IsAuthenticated is fine here
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"message": "Unauthenticated"}, status=200)

        logout(request)
        return Response({"message": "Successfully disconnected"}, status=200)


class KeypadCodeLoginView(APIView):
    # --- CORRECTION ---
    # Allow requests from the hardware (which is not authenticated)
    permission_classes = [AllowAny]

    def post(self, request):
        request_code = int(request.data.get("code"))
        lock_id = request.data.get("lock")

        if not (request_code and lock_id):
            return Response({"error": "Missing code or lock id"}, status=401)

        login_user = get_user_by_keypad_code(request_code)
        if not login_user:
            return Response({"error": "Access denied"}, status=401)

        lock = get_object_or_404(
            Lock, pk=lock_id, auth_methods__contains=["keypad"])

        if user_has_access_to_lock(login_user, lock):
            return Response({
                "message": "Access granted",
                "user": UserSerializer(login_user).data
            }, status=200)

        return Response({"error": "Access denied"}, status=401)


class BadgeCodeLoginView(APIView):
    # --- CORRECTION ---
    # Allow requests from the hardware (which is not authenticated)
    permission_classes = [AllowAny]

    def post(self, request):
        request_code = request.data.get("code")
        lock_id = request.data.get("lock")

        if not (request_code and lock_id):
            return Response({"error": "Missing code or lock id"}, status=401)

        login_user = get_user_by_badge_code(request_code)
        if not login_user:
            return Response({"error": "Access denied"}, status=401)

        lock = get_object_or_404(
            Lock, pk=lock_id, auth_methods__contains=["badge"])

        if user_has_access_to_lock(login_user, lock):
            return Response({
                "message": "Access granted",
                "user": UserSerializer(login_user).data
            }, status=200)

        return Response({"error": "Access denied"}, status=401)
