from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import *
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.parsers import MultiPartParser, FormParser
from .tasks import analyze_resume_task
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
    serializer_class = ResumeAnalysisSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        # User ko sirf uske apne resumes dikhen
        return self.queryset.filter(user=self.request.user).order_by('-created_at')
    
    def perform_create(self, serializer):
        resume = serializer.save(user=self.request.user)
        # Ab extraction aur Groq analysis yahan se nikal kar
        # seedha Celery task ke andar chala jayega.
        analyze_resume_task.delay(resume.id)
        
    def perform_destroy(self, instance):
        file_path = instance.pdf_file.path if instance.pdf_file else None

        if file_path and default_storage.exists(file_path):
            try:
                instance.pdf_file.delete(save=False)
            except PermissionError:
                # On Windows the file can be locked; log and continue instead of 500
                pass

        instance.delete()