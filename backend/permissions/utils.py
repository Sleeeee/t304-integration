from django.db.models import Q
from .models import LockPermission


def user_has_access_to_lock(user, lock):
    """
    Check if a user has permission to access a given lock.
    Considers:
    - Direct user-to-lock permission
    - User's groups to lock
    - User to lock groups
    - User's groups to lock groups
    """

    user_groups = user.groups.all()
    lock_groups = lock.groups.all()

    # Check for any permission that matches the 4 access patterns
    return LockPermission.objects.filter(
        Q(user=user, lock=lock) |
        Q(group__in=user_groups, lock=lock) |
        Q(user=user, lock_group__in=lock_groups) |
        Q(group__in=user_groups, lock_group__in=lock_groups)
    ).exists()
