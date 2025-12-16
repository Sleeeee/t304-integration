from django.db import models
from django.contrib.auth.models import User, Group
from locks.models import Lock, Lock_Group
from django.core.exceptions import ValidationError
from django.db.models import Q


class LockPermission(models.Model):
    """
    Base permission model for Lock access control.
    Supports four permission types through nullable ForeignKey fields:
    - User + Lock (single user to single lock)
    - User + LockGroup (single user to lock group)
    - Group + Lock (user group to single lock)
    - Group + LockGroup (user group to lock group)
    """
    PERMISSION_TYPES = [
        ('user_lock', 'User to Lock'),
        ('user_lockgroup', 'User to Lock Group'),
        ('group_lock', 'Group to Lock'),
        ('group_lockgroup', 'Group to Lock Group'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='lock_permissions'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='lock_permissions'
    )

    lock = models.ForeignKey(
        Lock,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='permissions'
    )
    lock_group = models.ForeignKey(
        Lock_Group,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='permissions'
    )

    start_date = models.DateTimeField(blank=True, null=True, default=None)
    end_date = models.DateTimeField(blank=True, null=True, default=None)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'lock']),
            models.Index(fields=['user', 'lock_group']),
            models.Index(fields=['group', 'lock']),
            models.Index(fields=['group', 'lock_group']),
        ]

    def clean(self):
        """
        Validate structural integrity AND prevent temporal overlaps.
        """
        # ... Your existing structural checks (User vs Group, Lock vs LockGroup) ...
        if not self.user and not self.group:
            raise ValidationError('Either user or group must be set.')
        if self.user and self.group:
            raise ValidationError('Cannot set both user and group.')
        if not self.lock and not self.lock_group:
            raise ValidationError('Either lock or lock_group must be set.')
        if self.lock and self.lock_group:
            raise ValidationError('Cannot set both lock and lock_group.')

        # 2. TEMPORAL OVERLAP CHECK
        # We need to find if there are existing permissions for this specific
        # Subject/Target combination that overlap with the new dates.

        # Base query: Find rows with same Subject/Target
        # We construct a dynamic query based on which fields are set
        filters = Q()
        if self.user:
            filters &= Q(user=self.user)
        else:
            filters &= Q(group=self.group)

        if self.lock:
            filters &= Q(lock=self.lock)
        else:
            filters &= Q(lock_group=self.lock_group)

        # Exclude self if updating an existing record
        existing_permissions = LockPermission.objects.filter(filters)
        if self.pk:
            existing_permissions = existing_permissions.exclude(pk=self.pk)

        # Define the Overlap Condition
        # Two ranges (StartA, EndA) and (StartB, EndB) overlap if:
        #   StartA < EndB  AND  EndA > StartB
        # We must also handle None (which means Infinity)

        # Logic:
        # (Start_Existing < End_New OR End_New is None)  AND
        # (End_Existing > Start_New OR End_Existing is None)

        overlap_condition = Q()

        # 1. New start must be before existing end (or existing end is forever)
        if self.start_date:
            condition_1 = Q(end_date__gt=self.start_date) | Q(
                end_date__isnull=True)
        else:
            # If new start is forever (None), it overlaps everything
            condition_1 = Q()

        # 2. New end must be after existing start (or existing start is forever)
        if self.end_date:
            condition_2 = Q(start_date__lt=self.end_date) | Q(
                start_date__isnull=True)
        else:
            # If new end is forever, it overlaps everything
            condition_2 = Q()

        if existing_permissions.filter(condition_1 & condition_2).exists():
            raise ValidationError(
                "This permission overlaps with an existing time slot for this user/lock.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        subject = self.user.username if self.user else f"Group: {
            self.group.name}"
        target = self.lock.name if self.lock else f"LockGroup: {
            self.lock_group.name}"
        return f"{subject} -> {target}"
