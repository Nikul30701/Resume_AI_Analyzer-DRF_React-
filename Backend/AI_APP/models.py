from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
from django.core.exceptions import ValidationError

class User(AbstractUser):
    email =models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email
    
    class Meta:
        ordering = ["-created_at"]
        
        
class Resume(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    
    # File storage
    pdf_file = models.FileField(upload_to='resumes/')
    file_name = models.CharField(max_length=255)
    extracted_text = models.TextField(blank=True)
    
    # Analysis results from Claude
    overall_score = models.IntegerField(null=True, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    improvement_suggestions = models.JSONField(default=list, blank=True)
    ats_score = models.IntegerField(null=True, blank=True)
    
    # feedback
    analysis_result = models.JSONField(null=True, blank=True)
    full_feedback = models.JSONField(null=True, blank=True)
    
    # timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    analyzed_at = models.DateTimeField(null=True, blank=True)
    
    # status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='pending'
    )
    
    def __str__(self):
        return f"{self.file_name} - {self.user.email}"
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Resumes"
        indexes = [
            models.Index(fields=['user']),
        ]
    
    def clean(self):
        if self.pdf_file:
            if not self.pdf_file.name.lower().endswith(".pdf"):
                raise ValidationError("Only PDF files are allowed.")