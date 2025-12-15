from django.contrib import admin
from .models import Lock, Lock_Group, LockBatteryLog

admin.site.register(Lock)
admin.site.register(Lock_Group)
admin.site.register(LockBatteryLog)
