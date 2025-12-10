from .models import AccessLog
def create_access_log(method, user, failed_code, lock_id, lock_name, result):
    AccessLog.objects.create(
    method=method,
    user=user,
    failed_code=failed_code,
    lock_id=lock_id,
    lock_name=lock_name,
    result=result,
    )