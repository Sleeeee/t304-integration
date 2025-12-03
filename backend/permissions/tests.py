from django.test import TestCase
from django.contrib.auth.models import User, Group
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

# Imports from your apps
from .models import LockPermission
from .utils import user_has_access_to_lock
from locks.models import Lock, Lock_Group


class LockPermissionModelTest(TestCase):
    """
    Tests for the Data Model (Validation and Constraints).
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='password')
        self.group = Group.objects.create(name='testgroup')

        self.lock = Lock.objects.create(name='Test Lock', id_lock=100)
        self.lock_group = Lock_Group.objects.create(
            name='Test Lock Group', id_group=100)

    def test_create_user_lock_permission(self):
        """Test valid User -> Lock permission creation"""
        perm = LockPermission.objects.create(user=self.user, lock=self.lock)
        # Using assertIn because str() representation might vary slightly
        self.assertIn(self.user.username, str(perm))
        self.assertIn(self.lock.name, str(perm))

    def test_clean_validation_entity(self):
        """Test validation fails if both User and Group are set"""
        perm = LockPermission(
            user=self.user,
            group=self.group,
            lock=self.lock
        )
        with self.assertRaises(ValidationError) as e:
            perm.clean()
        self.assertIn('Cannot set both user and group', str(e.exception))

    def test_clean_validation_no_entity(self):
        """Test validation fails if neither User nor Group is set"""
        perm = LockPermission(lock=self.lock)
        with self.assertRaises(ValidationError) as e:
            perm.clean()
        self.assertIn('Either user or group must be set', str(e.exception))

    def test_clean_validation_target(self):
        """Test validation fails if both Lock and LockGroup are set"""
        perm = LockPermission(
            user=self.user,
            lock=self.lock,
            lock_group=self.lock_group
        )
        with self.assertRaises(ValidationError) as e:
            perm.clean()
        self.assertIn('Cannot set both lock and lock_group', str(e.exception))


class AccessControlUtilsTest(TestCase):
    """
    Tests for utils.py: user_has_access_to_lock logic.
    """

    def setUp(self):
        self.user = User.objects.create_user(username='access_user')
        self.group = Group.objects.create(name='access_group')
        self.user.groups.add(self.group)

        self.lock = Lock.objects.create(name='Access Lock', id_lock=200)
        self.lock_group = Lock_Group.objects.create(
            name='Access LG', id_group=200)

        if hasattr(self.lock, 'groups'):
            self.lock.groups.add(self.lock_group)

    def test_direct_user_lock_access(self):
        """Case 1: Direct User -> Lock"""
        LockPermission.objects.create(user=self.user, lock=self.lock)
        self.assertTrue(user_has_access_to_lock(self.user, self.lock))

    def test_group_lock_access(self):
        """Case 2: Group -> Lock"""
        LockPermission.objects.create(group=self.group, lock=self.lock)
        self.assertTrue(user_has_access_to_lock(self.user, self.lock))

    def test_user_lock_group_access(self):
        """Case 3: User -> LockGroup"""
        if hasattr(self.lock, 'groups'):
            LockPermission.objects.create(
                user=self.user, lock_group=self.lock_group)
            self.assertTrue(user_has_access_to_lock(self.user, self.lock))
        else:
            print("Skipping LockGroup test: Lock model structure unknown.")

    def test_temporal_access_valid(self):
        """Test access within valid time range"""
        now = timezone.now()
        LockPermission.objects.create(
            user=self.user,
            lock=self.lock,
            start_date=now - timedelta(hours=1),
            end_date=now + timedelta(hours=1)
        )
        self.assertTrue(user_has_access_to_lock(self.user, self.lock))

    def test_temporal_access_expired(self):
        """Test access denied if permission expired"""
        now = timezone.now()
        LockPermission.objects.create(
            user=self.user,
            lock=self.lock,
            start_date=now - timedelta(hours=5),
            end_date=now - timedelta(hours=1)
        )
        self.assertFalse(user_has_access_to_lock(self.user, self.lock))

    def test_temporal_access_future(self):
        """Test access denied if permission starts in future"""
        now = timezone.now()
        LockPermission.objects.create(
            user=self.user,
            lock=self.lock,
            start_date=now + timedelta(hours=1)
        )
        self.assertFalse(user_has_access_to_lock(self.user, self.lock))


class LockPermissionAPITest(TestCase):
    """
    Tests for views.py: LockPermissionView (GET and POST).
    """

    def setUp(self):
        self.client = APIClient()
        self.url = '/permissions/'  # Adjust to match your urls.py path

        # User Roles
        self.superuser = User.objects.create_superuser(
            'admin', 'admin@test.com', 'pass')
        self.staff_user = User.objects.create_user(
            'staff', 'staff@test.com', 'pass', is_staff=True)
        self.normal_user = User.objects.create_user(
            'normie', 'normie@test.com', 'pass')

        self.lock = Lock.objects.create(name='API Lock', id_lock=300)
        self.user_target = User.objects.create_user(
            'target', 't@t.com', 'pass')

        # Initial Permission
        self.perm = LockPermission.objects.create(
            user=self.user_target, lock=self.lock)

    def test_get_permissions_unauthorized(self):
        """Ensure non-staff cannot read permissions"""
        self.client.force_authenticate(user=self.normal_user)
        response = self.client.get(self.url, {'type': 'all'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_permissions_by_user(self):
        """Test fetching permissions for specific user"""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(
            self.url, {'type': 'user', 'id': self.user_target.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        # Ensure the lock ID returned matches
        self.assertEqual(response.data[0]['lock'], self.lock.id_lock)

    def test_get_permissions_by_lock(self):
        """Test fetching permissions for specific lock"""
        self.client.force_authenticate(user=self.staff_user)
        # Uses id_lock (integer 300)
        response = self.client.get(
            self.url, {'type': 'lock', 'lock_id': self.lock.id_lock})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_post_add_permission_superuser_only(self):
        """Test only superuser can add permissions"""
        self.client.force_authenticate(user=self.staff_user)
        payload = {
            'toAdd': [{'user': self.superuser.id, 'lock': self.lock.pk}],
            'toRemove': []
        }
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_post_add_and_remove_bulk(self):
        """Test bulk add and remove in one transaction"""
        self.client.force_authenticate(user=self.superuser)

        new_user = User.objects.create_user('new_guy')

        payload = {
            'toAdd': [
                # Note: Views usage implies 'lock' expects PK (id), not id_lock
                {'user': new_user.id, 'lock': self.lock.pk}
            ],
            'toRemove': [
                {'user': self.user_target.id, 'lock': self.lock.pk}
            ]
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify Database State
        # 1. New permission exists
        self.assertTrue(LockPermission.objects.filter(
            user=new_user, lock=self.lock).exists())
        # 2. Old permission is gone
        self.assertFalse(LockPermission.objects.filter(
            user=self.user_target, lock=self.lock).exists())

    def test_post_handle_errors_gracefully(self):
        """Test that invalid IDs in the batch don't crash the server, return 400 with details"""
        self.client.force_authenticate(user=self.superuser)

        payload = {
            'toAdd': [
                {'user': 99999, 'lock': self.lock.pk}  # Non-existent user
            ],
            'toRemove': []
        }

        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data['details'])
