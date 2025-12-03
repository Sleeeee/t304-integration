from rest_framework.test import APIClient
from rest_framework import status
from django.test import TestCase
from django.contrib.auth.models import User
from locks.models import Lock
from permissions.models import LockPermission
from users.models import UserKeypadCode


class UserManagementWorkflowTest(TestCase):
    """
    User Journey: HR/Admin onboarding a new staff member.
    """

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            'admin', 'admin@test.com', 'pass')
        self.client.force_authenticate(user=self.admin)

    def test_onboarding_workflow(self):
        # 1. CREATE USER
        user_payload = {
            'username': 'new_employee',
            'email': 'employee@company.com',
            'password': 'strongpassword123',
            'keypad': True,
            'badge': True
        }

        response = self.client.post('/users/', user_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        new_user_id = response.data['user']['id']
        self.assertTrue(User.objects.filter(id=new_user_id).exists())

        # 2. CREATE GROUP
        group_payload = {'name': 'Maintenance Staff'}
        response = self.client.post('/users/groups/', group_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        group_id = response.data['group']['id']

        # 3. ADD USER TO GROUP
        url = f'/users/groups/{group_id}/add_user/'
        assign_payload = {'user_ids': [new_user_id]}

        response = self.client.post(url, assign_payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['users_added'][0], 'new_employee')


class FacilityManagementWorkflowTest(TestCase):
    """
    User Journey: Facility Manager setting up a building.
    """

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            'admin', 'admin@test.com', 'pass')
        self.client.force_authenticate(user=self.admin)

    def test_lock_setup_workflow(self):
        # 1. CREATE LOCKS
        # We capture the IDs returned by the server to ensure we use valid ones
        lock1_payload = {'name': 'Front Door',
                         'id_lock': 101, 'is_reservable': False}
        lock2_payload = {'name': 'Back Door',
                         'id_lock': 102, 'is_reservable': False}

        res1 = self.client.post('/locks/', lock1_payload)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        # Robustly get the ID, handling potential structure differences
        id_1 = res1.data.get('lock', {}).get(
            'id_lock') or res1.data.get('id_lock') or 101

        res2 = self.client.post('/locks/', lock2_payload)
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        id_2 = res2.data.get('lock', {}).get(
            'id_lock') or res2.data.get('id_lock') or 102

        self.assertEqual(Lock.objects.count(), 2)

        # 2. CREATE LOCK GROUP
        group_payload = {'name': 'Perimeter Access', 'id_group': 900}
        response = self.client.post('/locks/groups/', group_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Robustly get group ID
        group_id = response.data.get('lock_group', {}).get('id_group')
        if not group_id:
            group_id = response.data.get('id_group') or 900

        # 3. ASSIGN LOCKS TO GROUP
        url = f'/locks/groups/{group_id}/add_lock/'
        assign_payload = {'lock_ids': [id_1, id_2]}

        response = self.client.post(url, assign_payload)

        # If this still fails, it prints exactly why
        if response.status_code != 200:
            print(f"\n[DEBUG] Failed to add locks. URL: {url}")
            print(f"[DEBUG] Sent IDs: {assign_payload}")
            print(f"[DEBUG] Response: {response.data}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('2 serrure(s) ajoutée(s)', response.data['message'])


class HardwareAccessControlTest(TestCase):
    """
    User Journey: Physical Access (Keypad Login).
    """

    def setUp(self):
        self.client = APIClient()
        self.lock = Lock.objects.create(
            name="Server Room", id_lock=500, auth_methods=["keypad"])
        self.user = User.objects.create_user('tech_guy')
        # Using code_hash as per your model definition
        self.user_code = UserKeypadCode.objects.create(
            user=self.user, code_hash="1234")

    def test_access_flow(self):
        payload = {"code": "1234", "lock": self.lock.id_lock}

        # CORRECTED URL based on your auth/urls.py
        url = '/auth/keypad/'

        # A. Expect 401 (Unauthorized) - No permission yet
        response = self.client.post(url, payload)
        if response.status_code == 404:
            self.fail(f"URL '{url}' not found.")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # B. Grant Permission
        LockPermission.objects.create(user=self.user, lock=self.lock)

        # C. Expect 200 (Success) - Permission granted
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Access granted")
