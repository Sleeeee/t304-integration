from django.contrib.auth.hashers import check_password
from users.models import UserKeypadCode


def get_user_by_code(raw_code):
    int_code = int(raw_code)
    if not int_code:
        return None

    for code in UserKeypadCode.objects.select_related("user"):
        if check_password(int_code, code.code_hash):
            return code.user
    return None
