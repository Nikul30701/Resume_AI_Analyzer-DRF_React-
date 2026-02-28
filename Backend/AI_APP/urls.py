from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    LogoutView, 
    UserProfileView, 
    ResumeViewSet
)
from rest_framework_simplejwt.views import TokenRefreshView

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'resumes', ResumeViewSet, basename='resume')

urlpatterns = [
    # Auth endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Viewset routes (resumes)
    path('', include(router.urls)),
]
