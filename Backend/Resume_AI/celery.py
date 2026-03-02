import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Resume_AI.settings')

app = Celery('Resume_AI')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

app.conf.beat_schedule = {
    'cleanup-old-resumes': {
        'task': 'apps.resumes.tasks.cleanup_old_resumes',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}