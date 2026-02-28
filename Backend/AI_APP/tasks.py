import logging
from celery import shared_task
from django.utils import timezone
from .models import Resume
from .utils import analyze_resume_with_groq

# Always set up a logger for your background tasks!
logger = logging.getLogger(__name__)

@shared_task
def analyze_resume_task(resume_id):
    """
    Background task to extract text from a resume PDF and analyze it using AI.
    """
    try:
        # 1. Update status to 'processing'
        Resume.objects.filter(id=resume_id).update(status="processing")
        
        # 2. Fetch the resume instance
        try:
            resume = Resume.objects.get(id=resume_id)
        except Resume.DoesNotExist:
            logger.warning(f"Resume {resume_id} does not exist.")
            return

        # 3. Extract text (moving this to background task improves performance)
        from .utils import extract_text_from_pdf
        if resume.pdf_file and not resume.extracted_text:
            logger.info(f"Extracting text for resume {resume_id}...")
            text = extract_text_from_pdf(resume.pdf_file)
            resume.extracted_text = text
            resume.save(update_fields=['extracted_text'])
        else:
            text = resume.extracted_text

        if not text:
            logger.warning(f"No text extracted for resume {resume_id}. Analysis might be poor.")

        # 4. Make the API call
        logger.info(f"Starting AI analysis for resume {resume_id}...")
        feedback = analyze_resume_with_groq(text)
        
        # 5. Map the feedback data
        resume.overall_score = feedback.get("overall_score", 0)
        resume.strengths = feedback.get("strengths", [])
        resume.weaknesses = feedback.get("weaknesses", [])
        resume.missing_skills = feedback.get("missing_skills", [])
        resume.improvement_suggestions = feedback.get("improvement_suggestions", [])
        resume.ats_score = feedback.get("ats_score", 0)
        resume.analysis_result = feedback
        
        resume.status = "completed"
        resume.analyzed_at = timezone.now()
        resume.save()
        logger.info(f"Analysis completed successfully for resume {resume_id}.")
    
    except Exception as e:
        logger.error(f"Task failed for resume {resume_id}. Error: {str(e)}", exc_info=True)
        Resume.objects.filter(id=resume_id).update(status="failed")