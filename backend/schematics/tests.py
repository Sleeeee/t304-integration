import json
from django.test import TestCase, Client
from django.urls import reverse
from .models import Building, Schematic, SchematicWall, SchematicLock
from locks.models import Lock

class SchematicAdvancedTests(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Données de base
        self.building = Building.objects.create(name="Batiment Test", floor=1)
        
        self.lock1 = Lock.objects.create(id_lock=100, name="Serrure A", status="connected")
        self.lock2 = Lock.objects.create(id_lock=101, name="Serrure B", status="disconnected")
        
        self.schematic = Schematic.objects.create(
            building=self.building,
            name="Plan RDC",
            width=1000,
            height=800
        )

    # --- 1. TESTS API DATA & SAUVEGARDE (Cœur du système) ---

    def test_get_schematic_data_structure(self):
        """Vérifie la structure JSON complète pour le frontend."""
        SchematicWall.objects.create(schematic=self.schematic, x=0, y=0, points=[])
        
        url = reverse('schematics:get_schematic_data', args=[self.schematic.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Vérifie la présence de TOUTES les clés requises par le TSX
        self.assertIn('components', data)
        self.assertIn('available_locks', data)
        # Vérifie le contenu
        self.assertEqual(len(data['components']), 1)
        self.assertTrue(len(data['available_locks']) >= 2)

    def test_save_schematic_full_cycle(self):
        """Test complet : Sauvegarde -> Vérif DB -> Mise à jour -> Vérif DB."""
        url = reverse('schematics:save_schematic_data', args=[self.schematic.id])

        # A. Sauvegarde initiale (1 mur, 1 serrure)
        payload = {
            "components": [
                {"type": "wall", "x": 10, "y": 10, "points": [0,0,10,0]},
                {"type": "lock", "x": 50, "y": 50, "lock_id": 100}
            ]
        }
        self.client.post(url, json.dumps(payload), content_type="application/json")
        
        self.assertEqual(SchematicLock.objects.count(), 1)
        self.assertEqual(SchematicLock.objects.first().lock, self.lock1)

        # B. Mise à jour (On remplace la serrure 100 par la 101)
        payload_update = {
            "components": [
                {"type": "wall", "x": 10, "y": 10, "points": [0,0,10,0]},
                {"type": "lock", "x": 60, "y": 60, "lock_id": 101} # Changement d'ID
            ]
        }
        self.client.post(url, json.dumps(payload_update), content_type="application/json")

        self.assertEqual(SchematicLock.objects.count(), 1)
        self.assertEqual(SchematicLock.objects.first().lock, self.lock2) # Doit être la serrure B

    def test_save_schematic_invalid_lock_resilience(self):
        """Si on envoie une serrure qui n'existe pas, ça ne doit pas crasher."""
        url = reverse('schematics:save_schematic_data', args=[self.schematic.id])
        payload = {
            "components": [{"type": "lock", "x": 0, "y": 0, "lock_id": 999999}]
        }
        response = self.client.post(url, json.dumps(payload), content_type="application/json")
        
        self.assertEqual(response.status_code, 200) # Soft fail
        self.assertEqual(SchematicLock.objects.count(), 0) # Rien créé

    def test_get_non_existent_schematic(self):
        """Vérifie la 404 sur un ID inconnu."""
        url = reverse('schematics:get_schematic_data', args=[999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    # --- 2. TESTS API UTILITAIRES (Ids placés, Listes) ---

    def test_get_all_placed_lock_ids(self):
        """Vérifie que l'API renvoie bien les IDs des serrures déjà placées."""
        # On place la serrure 100 sur le schéma
        SchematicLock.objects.create(schematic=self.schematic, lock=self.lock1, x=0, y=0)
        
        url = reverse('schematics:get_all_placed_lock_ids')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('placed_lock_ids', data)
        self.assertIn(100, data['placed_lock_ids'])     # La 100 est placée
        self.assertNotIn(101, data['placed_lock_ids'])  # La 101 n'est pas placée

    def test_building_schematics_list(self):
        """Vérifie la récupération des schémas d'un bâtiment spécifique."""
        # On crée un 2ème schéma pour le même bâtiment
        Schematic.objects.create(building=self.building, name="Étage 1")
        
        url = reverse('schematics:building_schematics', args=[self.building.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['schematics']), 2) # Doit en trouver 2
        
        # Test création via POST sur cette route
        payload = {"name": "Étage 2", "width": 500, "height": 500}
        res_post = self.client.post(url, json.dumps(payload), content_type="application/json")
        self.assertEqual(res_post.status_code, 201)
        self.assertEqual(Schematic.objects.filter(building=self.building).count(), 3)

    # --- 3. TESTS API BATIMENTS (CRUD) ---

    def test_buildings_list_create(self):
        """Test GET et POST sur /api/schematics/buildings/"""
        url = reverse('schematics:buildings_list')
        
        # GET
        res_get = self.client.get(url)
        self.assertEqual(len(res_get.json()['buildings']), 1)
        
        # POST (Création)
        payload = {"name": "Tour Z", "floor": 10}
        res_post = self.client.post(url, json.dumps(payload), content_type="application/json")
        self.assertEqual(res_post.status_code, 201)
        self.assertEqual(Building.objects.count(), 2)

    def test_create_building_missing_name(self):
        """Validation : Le nom est obligatoire."""
        url = reverse('schematics:buildings_list')
        res = self.client.post(url, json.dumps({"floor": 1}), content_type="application/json")
        self.assertEqual(res.status_code, 400)