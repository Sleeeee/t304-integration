from django.urls import path
from .views import (
    LocksView,
    LockGroupsView,
    AddLocksToGroupView,
    GroupLocksView,
    RemoveLockFromGroupView,
    DeleteLockGroupView
)

urlpatterns = [
    path('', LocksView.as_view(), name='locks'),
    path('groups/', LockGroupsView.as_view(), name='lock_groups'),
    path('groups/<int:group_id>/add_lock/',
         AddLocksToGroupView.as_view(), name='add_locks_to_group'),
    path('groups/<int:group_id>/locks/',
         GroupLocksView.as_view(), name='group_locks'),
    path('groups/<int:group_id>/remove_lock/',
         RemoveLockFromGroupView.as_view(), name='remove_locks_from_group'),
    path('groups/<int:group_id>/delete/',
         DeleteLockGroupView.as_view(), name='delete-lock-group'),
]
