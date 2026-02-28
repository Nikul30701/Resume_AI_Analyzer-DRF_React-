import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Resume_AI.settings')

app = Celery('Resume_AI')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()