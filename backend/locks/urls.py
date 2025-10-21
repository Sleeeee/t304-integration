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
    path('lock-groups/', LockGroupsView.as_view(), name='lock-groups'),
    path('lock-groups/<int:group_id>/add-locks/',
         AddLocksToGroupView.as_view(), name='add-locks-to-group'),
    path('lock-groups/<int:group_id>/locks/',
         GroupLocksView.as_view(), name='group-locks'),
    path('lock-groups/<int:group_id>/remove-locks/',
         RemoveLockFromGroupView.as_view(), name='remove-locks-from-group'),
    path('lock-groups/<int:group_id>/delete/',
         DeleteLockGroupView.as_view(), name='delete-lock-group'),
]
