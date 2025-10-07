from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, UserRegistrationSerializer
from django.contrib.auth import get_user_model


User = get_user_model()


class UsersView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated and user.is_staff:
            users = User.objects.all()
            return Response({"users": UserSerializer(users).data}, status=200)

        return Response({"error": "Unauthorized to fetch users"}, status=401)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user
        if not (user.is_authenticated and user.is_superuser):
            return Response({
                'error': 'Unauthorized to create users'
            }, status=status.401)

        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Successfully created user',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            }, status=status.201)

        return Response(serializer.errors, status=400)
