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
    Récupère tous les murs et serrures pour un schéma donné.
    """
    try:
        schematic = Schematic.objects.get(pk=schematic_id)
        
        walls = SchematicWall.objects.filter(schematic=schematic)
        walls_data = [
            {
                "id": f"wall-{w.id}",
                "x": w.x,
                "y": w.y,
                "points": w.points,
                "scaleX": w.scale_x,
                "scaleY": w.scale_y,
                "rotation": w.rotation
            } for w in walls
        ]
    
        locks = SchematicLock.objects.filter(schematic=schematic)
        locks_data = [
            {
                "id": f"lock-{l.id}",
                "x": l.x,
                "y": l.y,
                "type": "lock",
                "lock_id": l.lock.id_lock,
                "lock_name": l.lock.name,
                "scaleX": l.scale_x,
                "scaleY": l.scale_y,
                "rotation": l.rotation
            } for l in locks
        ]
        
        return JsonResponse({"components": walls_data + locks_data})

    except Schematic.DoesNotExist:
        return JsonResponse({"error": "Schematic not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@transaction.atomic
def save_schematic_data(request, schematic_id):
    """
    Sauvegarde l'état du schéma.
    (Cette fonction est déjà correcte car elle utilise 'pk')
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
            if 'points' in item: 
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
                            rotation=item.get('rotation', 0)
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


# ========== NOUVEAUX ENDPOINTS POUR BUILDINGS ==========

@csrf_exempt
def buildings_list(request):
    """
    GET: Récupère tous les bâtiments
    POST: Crée un nouveau bâtiment
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
    GET: Récupère tous les schémas (étages) d'un bâtiment
    POST: Crée un nouveau schéma pour un bâtiment
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