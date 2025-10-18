from django.urls import path
from .views import LocksView

urlpatterns = [
    path('', LocksView.as_view(), name='locks'),
]
