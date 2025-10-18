from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, UserRegistrationSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from .serializers import GroupSerializer
from django.shortcuts import get_object_or_404
from .serializers import AddUserToGroupSerializer

User = get_user_model()


class UsersView(APIView):
    def get(self, request):
        user = request.user
        if user.is_authenticated and user.is_staff:
            users = User.objects.all()
            return Response({"users": UserSerializer(users, many=True).data}, status=200)

        return Response({"error": "Unauthorized to fetch users"}, status=401)

    def post(self, request):
        user = request.user
        if not (user.is_authenticated and user.is_superuser):
            return Response({
                'error': 'Unauthorized to create users'
            }, status=401)

        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Successfully created user',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_superuser': user.is_superuser or False,
                    'is_staff': user.is_staff or False
                }
            }, status=201)

        return Response(serializer.errors, status=400)


class GroupView(APIView):
    permission_classes = [AllowAny]  # pour l’instant tout le monde peut

    def get(self, request):
        groups = Group.objects.all()
        serializer = GroupSerializer(groups, many=True)
        return Response({"groups": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Groupe créé avec succès",
                "group": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AddUserToGroupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        serializer = AddUserToGroupSerializer(data=request.data)

        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            users = User.objects.filter(id__in=user_ids)

            if not users.exists():
                return Response(
                    {"error": "Aucun utilisateur trouvé avec ces IDs."},
                    status=status.HTTP_404_NOT_FOUND
                )

            for user in users:
                group.user_set.add(user)

            return Response({
                "message": f"{users.count()} utilisateur(s) ajouté(s) au groupe '{group.name}'.",
                "group": group.name,
                "users_added": [user.username for user in users]
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class GroupUsersView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, group_id):
        group = get_object_or_404(Group, id=group_id)
        users = group.user_set.all()
        serializer = UserSerializer(users, many=True)
        return Response({
            "group": group.name,
            "members_count": users.count(),
            "members": serializer.data
        }, status=status.HTTP_200_OK)