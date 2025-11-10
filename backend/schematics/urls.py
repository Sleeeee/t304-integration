from django.urls import path
from . import views

# Ceci est important pour que Django puisse faire la distinction
# entre les noms de routes de différentes applications
app_name = 'schematics'

urlpatterns = [
    # Route pour obtenir la liste des bâtiments (GET) et en créer (POST)
    path('buildings/', views.buildings_list, name='buildings_list'),
    
    # Route pour obtenir les schémas d'un bâtiment (GET) et en créer (POST)
    path(
        'buildings/<int:building_id>/schematics/', 
        views.building_schematics, 
        name='building_schematics'
    ),
    path(
        '<int:schematic_id>/data/', 
        views.get_schematic_data, 
        name='get_schematic_data'
    ),
    path(
        '<int:schematic_id>/save/', 
        views.save_schematic_data, 
        name='save_schematic_data'
    ),
    
    path(
        'locks/placed_ids/', 
        views.get_all_placed_lock_ids, 
        name='get_all_placed_lock_ids'
    ),
]