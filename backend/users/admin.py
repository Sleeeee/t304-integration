from django.contrib import admin
from .models import UserKeypadCode, UserBadgeCode

admin.site.register(UserKeypadCode)
admin.site.register(UserBadgeCode)
