from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
import json

User = get_user_model()


class UsersViewTests(TestCase):
    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username='superuser',
            email='super@example.com',
            password='superpass'
        )
        self.normal_user = User.objects.create_user(
            username='normaluser',
            email='normal@example.com',
            password='normalpass'
        )
        self.user_to_delete = User.objects.create_user(
            username='todelete',
            email='delete@example.com',
            password='deletepass'
        )

        self.client = Client()
        self.url = reverse('users')

    def test_update_user_by_superuser_success(self):
        self.client.login(username='superuser', password='superpass')
        
        data = {
            "user_id": self.normal_user.id,
            "username": "updatednormaluser",
            "current_password": "normalpass",
            "is_staff": True,
            "keypad": True
        }

        response = self.client.patch(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertIn("New keypad code generated", resp_json["message"])
        self.normal_user.refresh_from_db()
        self.assertEqual(self.normal_user.username, "updatednormaluser")
        self.assertTrue(self.normal_user.is_staff)

    def test_update_user_unauthorized(self):
        self.client.login(username='normaluser', password='normalpass')
        data = {
            "user_id": self.superuser.id,
            "username": "failupdate",
            "current_password": "superpass"
        }

        response = self.client.patch(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 401)

    def test_delete_user_by_superuser_success(self):
        self.client.login(username='superuser', password='superpass')
        user_id = self.user_to_delete.id
        data = {"user_id": user_id}

        response = self.client.delete(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(User.objects.filter(id=user_id).exists())

    def test_delete_user_self_forbidden(self):
        self.client.login(username='superuser', password='superpass')
        data = {"user_id": self.superuser.id}

        response = self.client.delete(
            self.url,
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertTrue(User.objects.filter(id=self.superuser.id).exists())

