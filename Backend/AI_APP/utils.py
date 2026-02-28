import json
import re
from groq import Groq
from PyPDF2 import PdfReader
from django.conf import settings


def extract_text_from_pdf(pdf_file):
    """
    Extract text from PDF using PyPDF2
    """ 
    try:
        pdf_reader = PdfReader(pdf_file)
        text = ""
        
        # loop through all pages and extract text
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
            
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""


def analyze_resume_with_groq(resume_text):
    """
    Send resume text to the Groq SDK for analysis.

    The prompt asks the model to:
    1. Score the resume overall (0-100)
    2. List strengths (things done well)
    3. List weaknesses (areas to improve)
    4. Identify missing skills for full-stack dev role
    5. Give specific improvement suggestions
    6. Score ATS-friendliness (0-100)

    Why ask for JSON?
    - Structured data is easier to display in frontend
    - Can validate and parse reliably
    - Can store in database as JSONField
    """

    # --- Guard: API key must be available ---
    api_key = settings.GROQ_API_KEY
    if not api_key:
        return {
            "overall_score": 0,
            "strengths": ["API key not configured"],
            "weaknesses": ["Missing GROQ_API_KEY in environment"],
            "missing_skills": [],
            "improvement_suggestions": ["Please set GROQ_API_KEY in your .env file"],
            "ats_score": 0,
        }

    try:
        client = Groq(api_key=api_key)
        model = getattr(settings, "GROQ_MODEL", None) or "mixtral-8x7b-32768"

        # Truncate long resumes to avoid token limits (~4 000 chars ≈ ~1 000 tokens)
        resume_text = resume_text[:4000]

        prompt = f"""You are an expert resume analyzer and career coach.
Analyze this resume for a full-stack developer position.
Provide constructive, actionable feedback in JSON format.

Resume text:
{resume_text}

Please respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{{
    "overall_score": <number 0-100>,
    "strengths": [<list of 3-5 key strengths as strings>],
    "weaknesses": [<list of 3-5 areas to improve as strings>],
    "missing_skills": [<list of important full-stack skills not mentioned as strings>],
    "improvement_suggestions": [<list of 5-7 specific actionable suggestions as strings>],
    "ats_score": <number 0-100 for ATS-friendliness>
}}

Make sure each field contains actual strings, not null or empty values.
If you cannot analyse the resume, provide default scores of 50."""

        print(f"Calling Groq API with model: {model}")
        print(f"API key configured: {bool(api_key)}")

        # ------------------------------------------------------------------
        # Use the Groq SDK chat-completions endpoint
        # Parameters:
        #   max_tokens   – limit generated response length
        #   temperature  – 0.7 gives balanced creativity vs. determinism
        #   top_p        – nucleus sampling: consider top-90% probable tokens
        # ------------------------------------------------------------------
        chat_response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert resume analyzer. "
                        "Always respond with valid JSON only — no markdown, no extra commentary."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            max_tokens=1500,
            temperature=0.7,
            top_p=0.9,
        )

        # Extract the generated text from the SDK response object
        generated_text = chat_response.choices[0].message.content
        print(f"Raw Groq response:\n{generated_text[:300]}")

        if not generated_text:
            print("No generated text in Groq response")
            return {
                "overall_score": 0,
                "strengths": ["No response from model"],
                "weaknesses": ["Model did not generate output"],
                "missing_skills": [],
                "improvement_suggestions": ["Please try again"],
                "ats_score": 0,
            }

        # Parse JSON from the model's reply
        feedback = extract_json_from_response(generated_text)
        return feedback

    except Exception as e:
        error_str = str(e).lower()
        print(f"Groq API Error: {e}")

        if "rate limit" in error_str or "rate_limit" in error_str:
            return {
                "overall_score": 0,
                "strengths": [],
                "weaknesses": ["Rate limit exceeded"],
                "missing_skills": [],
                "improvement_suggestions": [
                    "You have exceeded the Groq rate limit. Please wait a moment and try again."
                ],
                "ats_score": 0,
            }
        elif "timeout" in error_str:
            return {
                "overall_score": 0,
                "strengths": [],
                "weaknesses": ["API Timeout"],
                "missing_skills": [],
                "improvement_suggestions": [
                    "The Groq API took too long to respond. Please try again."
                ],
                "ats_score": 0,
            }
        elif "connection" in error_str:
            return {
                "overall_score": 0,
                "strengths": [],
                "weaknesses": ["API Connection Error"],
                "missing_skills": [],
                "improvement_suggestions": [
                    "Could not reach the Groq API. Check your internet connection and try again."
                ],
                "ats_score": 0,
            }
        else:
            return {
                "overall_score": 0,
                "strengths": [],
                "weaknesses": [f"Error: {str(e)[:100]}"],
                "missing_skills": [],
                "improvement_suggestions": ["An unexpected error occurred. Please try again."],
                "ats_score": 0,
            }


def extract_json_from_response(text):
    # Remove markdown code fences if present  (```json ... ``` or ``` ... ```)
    text = re.sub(r"```(?:json)?|```", "", text).strip()

    # Try to find the first {...} block in the text(regex function)
    r"""
        | Part        | Meaning                       |
        | ----------- | ----------------------------- |
        | `\{`        | Opening brace                 |
        | `.*?`       | Minimum characters match karo |
        | `\}`        | Closing brace                 |
        | `re.DOTALL` | Multi-line support            |
    """
    match = re.search(r"\{.*?\}", text, re.DOTALL)
    if match:
        json_str = match.group(0)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"JSON parse error after extraction: {e}")

    # Last-resort: try parsing the whole (stripped) text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Return a safe default if nothing worked
    return {
        "overall_score": 50,
        "strengths": ["Could not parse AI response"],
        "weaknesses": ["Response format was unexpected"],
        "missing_skills": [],
        "improvement_suggestions": ["Please try uploading the resume again"],
        "ats_score": 50,
    }