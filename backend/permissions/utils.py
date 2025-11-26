from django.utils import timezone
from django.db.models import Q
from .models import LockPermission


def user_has_access_to_lock(user, lock):
    """
    Check if a user has permission to access a given lock at the current moment.

    Considers:
    1. Structural match: User/Group <-> Lock/LockGroup
    2. Temporal match: Current time must be within start_date and end_date
       (if they exist).
    """

    # 1. Get the current server time
    now = timezone.now()

    user_groups = user.groups.all()
    lock_groups = lock.groups.all()

    # 2. Define the structural access patterns (Who matches What)
    # This remains the same as your original code
    structural_conditions = (
        Q(user=user, lock=lock) |
        Q(group__in=user_groups, lock=lock) |
        Q(user=user, lock_group__in=lock_groups) |
        Q(group__in=user_groups, lock_group__in=lock_groups)
    )

    # 3. Define the temporal validity (When is it valid)
    # Logic:
    # (Start is in the past OR Start is infinite) AND (End is in the future OR End is infinite)
    temporal_conditions = (
        (Q(start_date__lte=now) | Q(start_date__isnull=True)) &
        (Q(end_date__gte=now) | Q(end_date__isnull=True))
    )

    # 4. Combine both conditions
    # The permission must match the structure AND be valid right now
    return LockPermission.objects.filter(
        structural_conditions & temporal_conditions
    ).exists()
