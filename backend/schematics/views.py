import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from .models import Schematic, SchematicWall, SchematicLock
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