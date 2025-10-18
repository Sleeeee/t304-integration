from django.urls import path
from .views import UsersView, GroupView
from .views import AddUserToGroupView
from .views import GroupUsersView

urlpatterns = [
    path("", UsersView.as_view(), name="users"),
    path('groups/', GroupView.as_view(), name='groups'),
    path('groups/<int:group_id>/add_user/', AddUserToGroupView.as_view(), name='add_user_to_group'),
    path('groups/<int:group_id>/users/', GroupUsersView.as_view(), name='group_users'),
]
