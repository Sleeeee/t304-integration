import json
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import UserSerializer


class MeView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated:
            return Response({"user": UserSerializer(user).data})

        return Response({"error": "Non authentifié"}, status=401)


class WebLoginView(APIView):
    def post(self, request):
        return Response({"message": "Web login endpoint"})


class PhysicalLoginView(APIView):
    def post(self, request):
        return Response({"message": "Physical login endpoint"})
