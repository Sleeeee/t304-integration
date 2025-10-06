import json
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserSerializer


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
            login(request, user)
            return Response({
                "message": "Successfully authenticated",
                "user": UserSerializer(user).data
            }, status=200)

        return Response({"error": "Incorrect credentials"}, status=401)


class WebLogoutView(APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"message": "Unauthenticated"}, status=200)

        logout(request)
        return Response({"message": "Successfully disconnected"}, status=200)


class PhysicalLoginView(APIView):
    def post(self, request):
        return Response({"message": "Physical login endpoint"})
