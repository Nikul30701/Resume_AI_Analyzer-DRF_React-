from celery import shared_task
from django.utils import timezone
from .models import Resume
from .utils import extract_text_from_pdf, analyze_resume_with_groq
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def analyze_resume_task(self, resume_id):
    try:
        logger.info(f"Starting resume analysis for resume_id: {resume_id}")
        
        # Get the resume object
        resume = Resume.objects.get(id=resume_id)
        
        # Step 1: Extract text from PDF
        logger.info(f"Extracting text from PDF for resume_id: {resume_id}")
        extracted_text = extract_text_from_pdf(resume.pdf_file)
        
        if not extracted_text:
            logger.error(f"Failed to extract text from resume_id: {resume_id}")
            resume.overall_score = 0
            resume.weaknesses = ["Could not extract text from PDF"]
            resume.save()
            return {"status": "error", "message": "PDF extraction failed"}
        
        # Save extracted text
        resume.extracted_text = extracted_text
        resume.save()
        
        # Step 2: Analyze with Groq
        logger.info(f"Sending to Groq API for resume_id: {resume_id}")
        feedback = analyze_resume_with_groq(extracted_text)
        
        # Step 3: Save results to database
        logger.info(f"Saving analysis results for resume_id: {resume_id}")
        resume.overall_score = feedback.get('overall_score', 0)
        resume.strengths = feedback.get('strengths', [])
        resume.weaknesses = feedback.get('weaknesses', [])
        resume.missing_skills = feedback.get('missing_skills', [])
        resume.improvement_suggestions = feedback.get('improvement_suggestions', [])
        resume.ats_score = feedback.get('ats_score', 0)
        resume.full_feedback = feedback
        resume.analyzed_at = timezone.now()
        resume.save()
        
        logger.info(f"Resume analysis completed successfully for resume_id: {resume_id}")
        
        return {
            "status": "success",
            "message": "Resume analyzed successfully",
            "resume_id": resume_id,
            "score": feedback.get('overall_score')
        }
    
    except Resume.DoesNotExist:
        logger.error(f"Resume not found with id: {resume_id}")
        return {"status": "error", "message": f"Resume with id {resume_id} not found"}
    
    except Exception as exc:
        logger.error(f"Error analyzing resume_id {resume_id}: {str(exc)}", exc_info=True)
        
        # Retry the task up to 3 times with exponential backoff
        retry_count = self.request.retries
        if retry_count < self.max_retries:
            countdown = 2 ** retry_count  # 2, 4, 8 seconds
            logger.info(f"Retrying task for resume_id {resume_id} in {countdown} seconds (attempt {retry_count + 1})")
            raise self.retry(exc=exc, countdown=countdown)
        
        # If all retries failed, save error to database
        try:
            resume = Resume.objects.get(id=resume_id)
            resume.overall_score = 0
            resume.weaknesses = [f"Analysis failed: {str(exc)[:200]}"]
            resume.analyzed_at = timezone.now()
            resume.save()
        except:
            pass
        
        return {"status": "error", "message": f"Failed to analyze resume after {self.max_retries} retries"}


@shared_task
def cleanup_old_resumes():
    """
    Periodic task to clean up old resumes (optional)
    
    Can be scheduled using Celery Beat to run daily
    This removes resumes older than 1 year to save storage
    """
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=365)
    old_resumes = Resume.objects.filter(created_at__lt=cutoff_date)
    
    count = 0
    for resume in old_resumes:
        if resume.pdf_file:
            resume.pdf_file.delete()
        resume.delete()
        count += 1
    
    logger.info(f"Cleaned up {count} old resumes")
    return {"status": "success", "cleaned_count": count}


@shared_task
def send_analysis_notification(resume_id):
    """
    Optional: Send email notification when analysis is complete
    
    Requires:
    - Django email configuration
    - Email backend (SMTP)
    """
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        
        resume = Resume.objects.get(id=resume_id)
        
        # Create email message
        subject = f"Resume Analysis Complete - Score: {resume.overall_score}/100"
        message = f"""
            Hi {resume.user.first_name or resume.user.username},
            
            Your resume has been analyzed! Here are your results:
            
            Overall Score: {resume.overall_score}/100
            ATS Score: {resume.ats_score}/100
            
            Check your dashboard to see detailed feedback.
            
            Best regards,
            Resume Analyzer Team
            """
        
        # Send email
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [resume.user.email],
            fail_silently=False,
        )
        
        logger.info(f"Notification email sent for resume_id: {resume_id}")
        return {"status": "success", "message": "Email sent"}
    
    except Exception as e:
        logger.error(f"Failed to send notification for resume_id {resume_id}: {str(e)}")
        return {"status": "error", "message": str(e)}