import json
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from locks.models import Lock
from .serializers import UserSerializer
from .utils import get_user_by_code
from permissions.utils import user_has_access_to_lock


class MeView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated and user.is_staff:
            return Response({"user": UserSerializer(user).data})

        return Response({"error": "Unauthenticated"}, status=401)


class WebLoginView(APIView):
    def post(self, request):
        if request.user.is_authenticated:
            return Response({"message": "Already authenticated"}, status=200)

        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if username is None or password is None:
            return Response({
                "error": "Missing credentials"
            }, status=401)

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_staff:
                login(request, user)
                return Response({
                    "message": "Successfully authenticated",
                    "user": UserSerializer(user).data
                }, status=200)

            return Response({"error", "Unauthorized"}, status=401)
        return Response({"error": "Incorrect credentials"}, status=401)


class WebLogoutView(APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"message": "Unauthenticated"}, status=200)

        logout(request)
        return Response({"message": "Successfully disconnected"}, status=200)


class KeypadCodeLoginView(APIView):
    def post(self, request):
        request_code = int(request.data.get("code"))
        lock_id = request.data.get("lock")

        if not (request_code and lock_id):
            return Response({"error": "Missing code or lock id"}, status=401)

        login_user = get_user_by_code(request_code)
        if not login_user:
            return Response({"error": "Access denied"}, status=401)

        lock = get_object_or_404(Lock, pk=lock_id)

        if user_has_access_to_lock(login_user, lock):
            return Response({
                "message": "Access granted",
                "user": UserSerializer(login_user).data
            }, status=200)

        return Response({"error": "Access denied"}, status=401)
