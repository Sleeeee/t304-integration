from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import Lock, Lock_Group

User = get_user_model()


class LockAPITestCase(APITestCase): #Test CRUD serrure
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='staff', email='staff@test.com', password='password', is_staff=True)
        self.superuser = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='password')
        self.regular_user = User.objects.create_user(
            username='user', email='user@test.com', password='password')

        self.lock1 = Lock.objects.create(
            name='Lock 1', description='Porte toilette', is_reservable=True)
        self.lock2 = Lock.objects.create(
            name='Lock 2', description='Porte sortie secours', is_reservable=False)

        self.list_url = '/locks/'  
        self.reservable_url = '/locks/reservable/'


    def test_list_locks_by_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['locks']), 2)

    def test_list_locks_unauthorized(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_lock_by_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        data = {
            'name': 'New Lock',
            'description': 'Storage Room',
            'status': 'connected',
            'is_reservable': True
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lock.objects.count(), 3)
        self.assertEqual(response.data['lock']['name'], 'New Lock')

    def test_create_lock_unauthorized(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {'name': 'Unauthorized Lock'}
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_lock_by_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {
            'id_lock': self.lock1.id_lock,
            'name': 'Updated Lock 1 Name',
            'status': 'error'
        }
        response = self.client.put(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lock1.refresh_from_db()
        self.assertEqual(self.lock1.name, 'Updated Lock 1 Name')
        self.assertEqual(self.lock1.status, 'error')

    def test_update_lock_unauthorized(self):
        self.client.force_authenticate(user=self.regular_user)
        data = {'id_lock': self.lock1.id_lock, 'name': 'Fail Update'}
        response = self.client.put(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_lock_by_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        data = {'id_lock': self.lock1.id_lock}
        response = self.client.delete(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Lock.objects.count(), 1)
        self.assertFalse(Lock.objects.filter(id_lock=self.lock1.id_lock).exists())

    def test_delete_lock_unauthorized(self):
        self.client.force_authenticate(user=self.staff_user)
        data = {'id_lock': self.lock2.id_lock}
        response = self.client.delete(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_reservable_locks(self):
        self.client.force_authenticate(user=self.regular_user)
        response = self.client.get(self.reservable_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(len(response.data['locks']), 1)
        self.assertEqual(response.data['locks'][0]['name'], 'Lock 1')


class LockGroupAPITestCase(APITestCase): #Test sur les groupes de serrures
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username='staff', email='staff@test.com', password='password', is_staff=True)
        self.superuser = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='password')
        self.regular_user = User.objects.create_user(
            username='user', email='user@test.com', password='password')
        

        self.lock1 = Lock.objects.create(name='Lock A')
        self.lock2 = Lock.objects.create(name='Lock B')
        self.group1 = Lock_Group.objects.create(name='Group Alpha')
        self.group2 = Lock_Group.objects.create(name='Group Beta')
        self.group1.locks.add(self.lock1)

        self.groups_url = '/locks/groups/'
        self.add_url = f'/locks/groups/{self.group1.id_group}/add_lock/'
        self.group_locks_url = f'/locks/groups/{self.group1.id_group}/locks/'
        self.remove_url = f'/locks/groups/{self.group1.id_group}/remove_lock/'
        self.delete_url = f'/locks/groups/{self.group2.id_group}/delete/'

    def test_list_lock_groups_by_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.groups_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['lock_groups']), 2)

    def test_create_lock_group_by_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        data = {'name': 'New Group Gamma'}
        response = self.client.post(self.groups_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lock_Group.objects.count(), 3)

    def test_add_locks_to_group_by_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        data = {'lock_ids': [self.lock2.id_lock]}
        response = self.client.post(self.add_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.group1.locks.count(), 2)
        self.assertIn(self.lock2, self.group1.locks.all())

    def test_list_group_locks_by_staff(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(self.group_locks_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['locks_count'], 1)
        self.assertEqual(response.data['locks'][0]['name'], 'Lock A')

    def test_remove_lock_from_group_by_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        data = {'lock_ids': [self.lock1.id_lock]}
        response = self.client.delete(self.remove_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.group1.locks.count(), 0)
        self.assertNotIn(self.lock1, self.group1.locks.all())

    def test_delete_lock_group_by_superuser(self):
        self.client.force_authenticate(user=self.superuser)
        response = self.client.delete(self.delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Lock_Group.objects.filter(
            id_group=self.group2.id_group).exists())


    def test_group_operations_unauthorized(self):
        self.client.force_authenticate(user=self.staff_user)

        create_response = self.client.post(self.groups_url, {'name': 'test'})
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

        add_response = self.client.post(self.add_url, {'lock_ids': [self.lock2.id_lock]})
        self.assertEqual(add_response.status_code, status.HTTP_403_FORBIDDEN)

        remove_response = self.client.delete(self.remove_url, {'lock_ids': [self.lock1.id_lock]})
        self.assertEqual(remove_response.status_code, status.HTTP_403_FORBIDDEN)

        delete_response = self.client.delete(self.delete_url)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)