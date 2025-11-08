from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password

User = get_user_model()


class UserKeypadCode(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='keypad_codes'
    )
    code_hash = models.CharField(max_length=128)

    def set_code(self, raw_code):
        self.code_hash = make_password(raw_code)

    def check_code(self, raw_code):
        return check_password(raw_code, self.code_hash)

    def save(self, *args, **kwargs):
        if not self.code_hash.startswith("pbkdf2_"):
            self.code_hash = make_password(self.code_hash)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user}'s keypad code"


class UserBadgeCode(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='badge_codes'
    )
    code_hash = models.CharField(max_length=128)

    def set_code(self, raw_code):
        self.code_hash = make_password(raw_code)

    def check_code(self, raw_code):
        return check_password(raw_code, self.code_hash)

    def save(self, *args, **kwargs):
        if not self.code_hash.startswith("pbkdf2_"):
            self.code_hash = make_password(self.code_hash)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user}'s badge code"
