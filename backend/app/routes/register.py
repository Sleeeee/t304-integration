from fastapi import APIRouter

router = APIRouter(prefix="/register", tags=["register"])

@router.post('/register')
def register_user():
    return {"message": "User registration endpoint"}