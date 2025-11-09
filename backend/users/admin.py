from django.contrib import admin
from .models import UserProfile, UserKeypadCode

admin.site.register(UserProfile)
admin.site.register(UserKeypadCode)