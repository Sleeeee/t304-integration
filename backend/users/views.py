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
    def get(self, request):
        user = request.user
        if user.is_authenticated and user.is_staff:
            groups = Group.objects.all()
            serializer = GroupSerializer(groups, many=True)
            return Response({"groups": serializer.data}, status=status.HTTP_200_OK)

        return Response({"error": "Unauthorized to fetch groups"}, status=status.HTTP_401_UNAUTHORIZED)

    def post(self, request):
        user = request.user
        if not (user.is_authenticated and user.is_superuser):
            return Response({
                "error": "Unauthorized to create groups"
            }, status=status.HTTP_401_UNAUTHORIZED)

        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Groupe créé avec succès",
                "group": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddUserToGroupView(APIView):
    def post(self, request, group_id):
        user = request.user
        if not (user.is_authenticated and user.is_superuser):
            return Response(
                {"error": "Unauthorized to add users to groups"},
                status=status.HTTP_401_UNAUTHORIZED
            )

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
    def get(self, request, group_id):
        user = request.user
        if not (user.is_authenticated and user.is_staff):
            return Response(
                {"error": "Unauthorized to view group members"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        group = get_object_or_404(Group, id=group_id)
        users = group.user_set.all()
        serializer = UserSerializer(users, many=True)
        return Response({
            "group": group.name,
            "members_count": users.count(),
            "members": serializer.data
        }, status=status.HTTP_200_OK)


class RemoveUserFromGroupView(APIView):
    def delete(self, request, group_id):
        user = request.user
        if not (user.is_authenticated and user.is_superuser):
            return Response(
                {"error": "Unauthorized to remove users from groups"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        group = get_object_or_404(Group, id=group_id)
        serializer = AddUserToGroupSerializer(
            data=request.data)  # on réutilise le même serializer

        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            users = User.objects.filter(id__in=user_ids)

            if not users.exists():
                return Response(
                    {"error": "Aucun utilisateur trouvé avec ces IDs."},
                    status=status.HTTP_404_NOT_FOUND
                )

            for user in users:
                group.user_set.remove(user)

            return Response({
                "message": f"{users.count()} utilisateur(s) retiré(s) du groupe '{group.name}'.",
                "group": group.name,
                "users_removed": [user.username for user in users]
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteGroupView(APIView):
    def delete(self, request, group_id):
        user = request.user
        if not (user.is_authenticated and user.is_superuser):
            return Response(
                {"error": "Unauthorized to delete groups"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        group = get_object_or_404(Group, id=group_id)
        group_name = group.name
        group.delete()

        return Response(
            {"message": f"Le groupe '{group_name}' a été supprimé avec succès."},
            status=status.HTTP_204_NO_CONTENT
        )


class UpdateGroupView(APIView):
    def patch(self, request, group_id):
        # 1. Vérifier si l'utilisateur est super-utilisateur
        user = request.user
        if not (user.is_authenticated and user.is_superuser):
            return Response(
                {"error": "Unauthorized to update groups"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 2. Trouver le groupe
        group = get_object_or_404(Group, id=group_id)

        # 3. Utiliser le serializer pour valider le nouveau nom
        # 'partial=True' est ce qui en fait un PATCH (mise à jour partielle)
        serializer = GroupSerializer(group, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Groupe mis à jour avec succès",
                "group": serializer.data
            }, status=status.HTTP_200_OK)

        # Si les données ne sont pas valides (ex: nom déjà pris)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
