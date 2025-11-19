from django.db import models
from django.contrib.auth import get_user_model
from locks.models import Lock

User = get_user_model()


class ScanLog(models.Model):
    id_log = models.AutoField(primary_key=True)
    lock = models.ForeignKey(
        Lock,
        on_delete=models.CASCADE,
        related_name='scan_logs'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='scan_logs'
    )
    scan_datetime = models.DateTimeField(auto_now_add=True)
    success = models.BooleanField(default=False)

    class Meta:
        ordering = ['-scan_datetime']
        verbose_name = 'Scan Log'
        verbose_name_plural = 'Scan Logs'

    def __str__(self):
        status = "réussi" if self.success else "échoué"
        return f"Scan {status} - {self.user.username} - {self.lock.name} - {self.scan_datetime.strftime('%Y-%m-%d %H:%M:%S')}"
