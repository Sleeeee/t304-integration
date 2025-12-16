from django.test import TestCase

# --- 1. IL MANQUAIT CETTE LIGNE ---
from rest_framework.test import APITestCase 
# ----------------------------------

from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth.models import Group

class GroupManagementTests(APITestCase):
    
    def setUp(self):
        """
        Configuration initiale avant chaque test.
        """
        # Création de l'admin
        self.admin_user = User.objects.create_superuser(
            username='admin_test', 
            email='admin@test.com', 
            password='password123'
        )
        
        # Création d'un utilisateur normal
        self.normal_user = User.objects.create_user(
            username='alice', 
            email='alice@test.com', 
            password='password123'
        )

        # Authentification en tant qu'admin
        self.client.force_authenticate(user=self.admin_user)

    def test_ac1_admin_can_create_group(self):
        """
        Critère 1 : L'admin doit pouvoir créer des groupes.
        """
        data = {"name": "Service IT"}
        response = self.client.post('/users/groups/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Group.objects.count(), 1)
        self.assertEqual(Group.objects.get().name, 'Service IT')
        print("✅ AC1: Group creation passed")

    def test_ac2_admin_can_add_members(self):
        """
        Critère 2 : L'admin doit pouvoir ajouter des membres au groupe.
        """
        group = Group.objects.create(name="Service Compta")
        
        # Attention à l'URL, assure-toi qu'elle correspond à ton urls.py
        # Si ton URL est différente, adapte la ligne ci-dessous
        url = f'/users/groups/{group.id}/add_user/'
        
        data = {"user_ids": [self.normal_user.id]}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(group.user_set.filter(id=self.normal_user.id).exists())
        print("✅ AC2: Adding members passed")

    def test_ac3_admin_can_delete_group(self):
        """
        Critère 3 : L'admin doit pouvoir supprimer un groupe.
        """
        group = Group.objects.create(name="Groupe Temporaire")
        initial_count = Group.objects.count()
        
        url = f'/users/groups/{group.id}/delete/'
        response = self.client.delete(url)
        
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT])
        self.assertEqual(Group.objects.count(), initial_count - 1)
        print("✅ AC3: Group deletion passed")



class UserCRUDTests(APITestCase):
    """
    Tests pour la gestion des utilisateurs individuels (Create, Update, Delete).
    """

    def setUp(self):
        # 1. Création de l'admin qui va faire les actions
        self.admin_user = User.objects.create_superuser(
            username='admin_crud', 
            email='admin@test.com', 
            password='password123'
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_create_user(self):
        """
        L'admin doit pouvoir créer un nouvel utilisateur.
        """
        data = {
            "username": "nouveau_user",
            "email": "nouveau@test.com",
            "password": "securepassword",
            "is_staff": False,
            "is_superuser": False
        }
        
        # Appel POST sur /users/
        response = self.client.post('/users/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="nouveau_user").exists())
        print("✅ User CRUD: Creation passed")

    def test_update_user_role(self):
        """
        L'admin doit pouvoir modifier un utilisateur (ex: le passer Modérateur).
        """
        # On crée d'abord un utilisateur "cible" avec un mot de passe connu ("pw")
        target_user = User.objects.create_user(username="user_a_modifier", password="pw")
        
        # Données de mise à jour
        data = {
            "user_id": target_user.id,
            "username": "user_modifie",
            "is_staff": True,
            # --- CORRECTION ---
            # On ajoute le mot de passe car ton sérialiseur l'exige pour valider
            "current_password": "pw" 
        }
        
        # Appel PATCH sur /users/
        response = self.client.patch('/users/', data, format='json')
        
        # Vérifications
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Vérification en base
        target_user.refresh_from_db() 
        self.assertEqual(target_user.username, "user_modifie")
        self.assertTrue(target_user.is_staff)
        print("✅ User CRUD: Update passed")

    def test_delete_user(self):
        """
        L'admin doit pouvoir supprimer un utilisateur.
        """
        # On crée un utilisateur à supprimer
        target_user = User.objects.create_user(username="user_a_supprimer", password="pw")
        
        data = {
            "user_id": target_user.id # Ton API attend l'ID dans le body pour DELETE
        }
        
        # Appel DELETE sur /users/
        response = self.client.delete('/users/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=target_user.id).exists())
        print("✅ User CRUD: Deletion passed")
