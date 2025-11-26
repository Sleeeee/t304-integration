from django.db import models
from django.contrib.auth import get_user_model

class AccessLog(models.Model):
    METHOD_CHOICES = [
        ('keypad', 'Keypad'),
        ('badge', 'Badge'),
    ]
    result = models.CharField(max_length=16)  # 'success' ou 'failed'
    method = models.CharField(max_length=10, choices=METHOD_CHOICES) #Keypad ou badge
    user = models.ForeignKey(get_user_model(), null=True, blank=True, on_delete=models.SET_NULL) #user si possible aussi non null
    failed_code = models.CharField(max_length=128, blank=True, null=True)  # code saisi ou badge si échec
    lock_id = models.CharField(max_length=64) #id lock
    lock_name = models.CharField(max_length=256, blank=True) #nom lock
    timestamp = models.DateTimeField(auto_now_add=True) #date en temps réel