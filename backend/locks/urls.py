from django.urls import path
from .views import LocksView

urlpatterns = [
    path('locks/', LocksView.as_view(), name='locks'),
]
