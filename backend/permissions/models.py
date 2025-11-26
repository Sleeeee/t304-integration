from django.db import models
from django.contrib.auth.models import User, Group
from locks.models import Lock, Lock_Group


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
        unique_together = [
            ('user', 'lock'),
            ('user', 'lock_group'),
            ('group', 'lock'),
            ('group', 'lock_group'),
        ]
        indexes = [
            models.Index(fields=['user', 'lock']),
            models.Index(fields=['user', 'lock_group']),
            models.Index(fields=['group', 'lock']),
            models.Index(fields=['group', 'lock_group']),
        ]

    def clean(self):
        """Validate that exactly one user or group is set, and one lock or lock_group is set."""
        from django.core.exceptions import ValidationError

        # Check that either user or group is set, but not both
        if not self.user and not self.group:
            raise ValidationError('Either user or group must be set.')
        if self.user and self.group:
            raise ValidationError('Cannot set both user and group.')

        # Check that either lock or lock_group is set, but not both
        if not self.lock and not self.lock_group:
            raise ValidationError('Either lock or lock_group must be set.')
        if self.lock and self.lock_group:
            raise ValidationError('Cannot set both lock and lock_group.')

    def __str__(self):
        subject = self.user.username if self.user else f"Group: {
            self.group.name}"
        target = self.lock.name if self.lock else f"LockGroup: {
            self.lock_group.name}"
        return f"{subject} -> {target}"

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
