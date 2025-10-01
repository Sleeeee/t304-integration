from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, DateTime, func, LargeBinary


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    full_name: str
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now()
        )
    )
    
class UserFingerprint(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    data: bytes = Field(sa_column=Column(LargeBinary))
    
class UserBadges(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    badge_name: bytes = Field(sa_column=Column(LargeBinary))
    
class Groups(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    
class GroupUsers(SQLModel, table=True):
    group_id: int = Field(foreign_key="groups.id", primary_key=True)
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    
class Locks(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str

class Permissions(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    lock_id: int = Field(foreign_key="locks.id")
    time_frame: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now()
        )
    )
    
class UserPermissions(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    permission_id: int = Field(foreign_key="permissions.id", primary_key=True)
    
class GroupPermissions(SQLModel, table=True):
    group_id: int = Field(foreign_key="groups.id", primary_key=True)
    permission_id: int = Field(foreign_key="permissions.id", primary_key=True)
    
class LockUsage(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    lock_id: int = Field(foreign_key="locks.id")
    user_id: int = Field(foreign_key="user.id")
    timestamp: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now()
        )
    )