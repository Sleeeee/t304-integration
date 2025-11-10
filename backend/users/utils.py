import secrets
from auth.utils import get_user_by_code
from .models import UserKeypadCode


def generate_safe_6digit_code():
    max_value = 1000000  # exclusive
    random_int = secrets.randbelow(max_value)

    code = f"{random_int:06}"
    while get_user_by_code(code):
        code = f"{secrets.randbelow(max_value):06}"

    return code


def update_user_keypad_code(user):
    code = generate_safe_6digit_code()
    user_code, created = UserKeypadCode.objects.get_or_create(user=user)
    user_code.set_code(code)
    user_code.save()
    return code
