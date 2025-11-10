from django.urls import path
from .views import UsersView, GroupView, AddUserToGroupView, GroupUsersView, RemoveUserFromGroupView, DeleteGroupView, UpdateGroupView

urlpatterns = [
    path("", UsersView.as_view(), name="users"),
    path('groups/', GroupView.as_view(), name='groups'),
    path('groups/<int:group_id>/add_user/',
         AddUserToGroupView.as_view(), name='add_user_to_group'),
    path('groups/<int:group_id>/users/',
         GroupUsersView.as_view(), name='group_users'),
    path('groups/<int:group_id>/remove_user/',
         RemoveUserFromGroupView.as_view(), name='remove_user_from_group'),
    path('groups/<int:group_id>/delete/',
         DeleteGroupView.as_view(), name='delete_group'),
    path('groups/<int:group_id>/update/',
         UpdateGroupView.as_view(), name='update_group'),
]
