from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from logs.models import AccessLog
from locks.models import Lock
from datetime import datetime, timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Crée des logs de test pour le développement'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Nombre de logs à créer'
        )

    def handle(self, *args, **options):
        count = options['count']

        # Récupérer ou créer un utilisateur de test
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'is_staff': False,
            }
        )
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Utilisateur de test créé: {user.username}'))

        # Récupérer toutes les serrures
        locks = list(Lock.objects.all())

        if not locks:
            self.stdout.write(self.style.WARNING('Aucune serrure trouvée. Création de serrures de test...'))
            # Créer des serrures de test si nécessaire
            for i in range(1, 4):
                lock = Lock.objects.create(
                    name=f'Lock {i}',
                    description=f'Test lock {i}',
                    status='connected',
                    is_reservable=i % 2 == 0
                )
                locks.append(lock)
                self.stdout.write(self.style.SUCCESS(f'Serrure créée: {lock.name}'))

        # Créer les logs
        methods = ['badge', 'keypad']
        results = ['success', 'failed']

        for i in range(count):
            lock = random.choice(locks)
            method = random.choice(methods)
            result = random.choice(results)

            # 80% de succès, 20% d'échec
            if random.random() < 0.8:
                result = 'success'

            log = AccessLog.objects.create(
                method=method,
                user=user if result == 'success' else None,
                failed_code='123456' if result == 'failed' and method == 'keypad' else None,
                lock_id=str(lock.id_lock),
                lock_name=lock.name,
                result=result,
            )

            # Modifier la date pour avoir des logs étalés dans le temps
            log.timestamp = datetime.now() - timedelta(hours=random.randint(0, 72))
            log.save()

        self.stdout.write(self.style.SUCCESS(f'{count} logs créés avec succès!'))
