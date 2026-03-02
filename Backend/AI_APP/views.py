from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import *
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage



class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "message": "Registration successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)
        
        
class CustomTokenObtainPairView(TokenObtainPairView):
    # Enhanced login endpoint with user data
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer
    

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"detail": "Successfully logged out."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except TokenError:
            return Response(
                {"detail": "Token is invalid or already blacklisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    

class ResumeViewSet(viewsets.ModelViewSet):
    queryset = Resume.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_serializer_class(self):
        if self.action == 'create':
            return ResumeUploadSerializer
        return ResumeAnalysisSerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        from django.utils import timezone
        from .utils import extract_text_from_pdf, analyze_resume_with_groq

        resume = serializer.save(user=self.request.user, status='processing')

        try:
            # Step 1: Extract text
            extracted_text = extract_text_from_pdf(resume.pdf_file)

            if not extracted_text:
                resume.status = 'failed'
                resume.weaknesses = ["Could not extract text from PDF"]
                resume.analyzed_at = timezone.now()
                resume.save()
                return

            resume.extracted_text = extracted_text
            resume.save()

            # Step 2: Analyze with Groq
            feedback = analyze_resume_with_groq(extracted_text)

            # Step 3: Save results
            resume.overall_score = feedback.get('overall_score', 0)
            resume.strengths = feedback.get('strengths', [])
            resume.weaknesses = feedback.get('weaknesses', [])
            resume.missing_skills = feedback.get('missing_skills', [])
            resume.improvement_suggestions = feedback.get('improvement_suggestions', [])
            resume.ats_score = feedback.get('ats_score', 0)
            resume.full_feedback = feedback
            resume.analyzed_at = timezone.now()
            resume.status = 'completed'
            resume.save()

        except Exception as e:
            resume.status = 'failed'
            resume.weaknesses = [f"Analysis failed: {str(e)[:200]}"]
            resume.analyzed_at = timezone.now()
            resume.save()

    def perform_destroy(self, instance):
        if instance.pdf_file:
            try:
                instance.pdf_file.delete(save=False)
            except PermissionError:
                pass
        instance.delete()
