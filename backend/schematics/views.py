import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from .models import Building, Schematic, SchematicWall, SchematicLock
from locks.models import Lock

@require_http_methods(["GET"])
def get_schematic_data(request, schematic_id):
    """
    C'est la vue que nous avons modifiée.
    Elle charge toutes les données nécessaires pour l'éditeur Konva.
    """
    try:
        schematic = Schematic.objects.get(pk=schematic_id)
        
        # --- Murs (Wall) ---
        walls = SchematicWall.objects.filter(schematic=schematic)
        walls_data = [
            {
                "id": f"wall-{w.id}",
                "x": w.x,
                "y": w.y,
                "points": w.points,
                "scaleX": w.scale_x,
                "scaleY": w.scale_y,
                "rotation": w.rotation,
                "type": "wall" # Ajout d'un type pour que le frontend sache ce que c'est
            } for w in walls
        ]
    
        # --- Serrures (Lock) ---
        # .select_related('lock') est une optimisation pour éviter N+1 requêtes
        locks = SchematicLock.objects.filter(schematic=schematic).select_related('lock')
        locks_data = [
            {
                "id": f"slock-{l.id}", # ID unique pour l'élément placé
                "x": l.x,
                "y": l.y,
                "type": "lock",
                "lock_id": l.lock.id_lock, # L'ID de la serrure (modèle Lock)
                "lock_name": l.lock.name,
                "scaleX": l.scale_x,
                "scaleY": l.scale_y,
                "rotation": l.rotation,
                "color": l.color
            } for l in locks
        ]
        
        # --- AJOUTÉ : Serrures disponibles (pour la barre latérale) ---
        available_locks = Lock.objects.all()
        available_locks_data = [
            {
                "id": l.id_lock, # L'ID du modèle Lock
                "name": l.name,
                # Ajoute ici tout autre champ dont la barre latérale aurait besoin
            } for l in available_locks
        ]
        return JsonResponse({
            "schematic": {
                "id": schematic.id,
                "name": schematic.name,
                "width": schematic.width,
                "height": schematic.height,
                "background_color": schematic.background_color
            },
            "placed_components": walls_data + locks_data,
            "available_locks": available_locks_data
        })

    except Schematic.DoesNotExist:
        return JsonResponse({"error": "Schematic not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@transaction.atomic
def save_schematic_data(request, schematic_id):
    """
    C'est ta fonction de sauvegarde. 
    Elle est conservée telle quelle, elle est parfaite.
    """
    try:
        schematic = Schematic.objects.get(pk=schematic_id)
        data = json.loads(request.body)
        components = data.get('components', []) 
        
        SchematicWall.objects.filter(schematic=schematic).delete()
        SchematicLock.objects.filter(schematic=schematic).delete()

        walls_to_create = []
        locks_to_create = []

        for item in components:
            if 'points' in item or item.get('type') == 'wall': 
                walls_to_create.append(
                    SchematicWall(
                        schematic=schematic,
                        x=item['x'],
                        y=item['y'],
                        points=item['points'],
                        scale_x=item.get('scaleX', 1),
                        scale_y=item.get('scaleY', 1),
                        rotation=item.get('rotation', 0)
                    )
                )
            elif item.get('type') == 'lock':
                try:
                    lock_obj = Lock.objects.get(pk=item['lock_id']) 
                    locks_to_create.append(
                        SchematicLock(
                            schematic=schematic,
                            lock=lock_obj,
                            x=item['x'],
                            y=item['y'],
                            scale_x=item.get('scaleX', 1),
                            scale_y=item.get('scaleY', 1),
                            rotation=item.get('rotation', 0),
                            color=item.get('color', 'black')
                        )
                    )
                except Lock.DoesNotExist:
                    print(f"Warning: Lock with id {item.get('lock_id')} not found. Skipping.")
                    pass 
        
        SchematicWall.objects.bulk_create(walls_to_create)
        SchematicLock.objects.bulk_create(locks_to_create)

        return JsonResponse({"status": "success", "message": "Schematic saved successfully"})

    except Schematic.DoesNotExist:
        return JsonResponse({"error": "Schematic not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def buildings_list(request):
    """
    Ta vue pour la liste des bâtiments, conservée à l'identique.
    """
    if request.method == "GET":
        try:
            buildings = Building.objects.all().order_by('-created_at')
            buildings_data = [
                {
                    "id": b.id,
                    "name": b.name,
                    "description": b.description,
                    "floor": b.floor,
                    "created_at": b.created_at.isoformat(),
                    "updated_at": b.updated_at.isoformat(),
                } for b in buildings
            ]
            return JsonResponse({"buildings": buildings_data})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            name = data.get('name')
            description = data.get('description', '')
            floor = data.get('floor', 0)

            if not name:
                return JsonResponse({"error": "Name is required"}, status=400)

            building = Building.objects.create(
                name=name,
                description=description,
                floor=floor
            )

            return JsonResponse({
                "id": building.id,
                "name": building.name,
                "description": building.description,
                "floor": building.floor,
                "created_at": building.created_at.isoformat(),
            }, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def building_schematics(request, building_id):
    """
    Ta vue pour les schémas d'un bâtiment, conservée à l'identique.
    """
    if request.method == "GET":
        try:
            building = Building.objects.get(pk=building_id)
            schematics = Schematic.objects.filter(building=building).order_by('-created_at')
            schematics_data = [
                {
                    "id": s.id,
                    "name": s.name,
                    "width": s.width,
                    "height": s.height,
                    "background_color": s.background_color,
                    "created_at": s.created_at.isoformat(),
                    "updated_at": s.updated_at.isoformat(),
                } for s in schematics
            ]
            return JsonResponse({"schematics": schematics_data})
        except Building.DoesNotExist:
            return JsonResponse({"error": "Building not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    elif request.method == "POST":
        try:
            building = Building.objects.get(pk=building_id)
            data = json.loads(request.body)
            name = data.get('name')
            description = data.get('description', '')

            if not name:
                return JsonResponse({"error": "Name is required"}, status=400)

            schematic = Schematic.objects.create(
                building=building,
                name=name,
                width=data.get('width', 1000),
                height=data.get('height', 800),
                background_color=data.get('background_color', '#FFFFFF')
            )

            return JsonResponse({
                "id": schematic.id,
                "name": schematic.name,
                "width": schematic.width,
                "height": schematic.height,
                "background_color": schematic.background_color,
                "created_at": schematic.created_at.isoformat(),
            }, status=201)
        except Building.DoesNotExist:
            return JsonResponse({"error": "Building not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@require_http_methods(["GET"])
def get_all_placed_lock_ids(request):
    """
    Ta vue pour les serrures globales, conservée à l'identique.
    """
    try:
        # Récupère tous les SchematicLock et extrait les lock_ids uniques
        placed_locks = SchematicLock.objects.select_related('lock').all()
        lock_ids = list(set([sl.lock.id_lock for sl in placed_locks]))

        return JsonResponse({"placed_lock_ids": lock_ids})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)