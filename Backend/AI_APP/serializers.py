from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Resume


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "password", "password_confirm"]
        read_only_fields = ["id"]

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({
                "password": "Passwords must match."
            })
        validate_password(data['password'], user=None)
        if len(data['password']) < 6:
            raise serializers.ValidationError({
                "password": "Password must be at least 6 characters."
            })
        return data

    def create(self, validated_data):
        validated_data.pop("password_confirm")  # remove confirmation field
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        user = authenticate(
            request=self.context.get('request'),
            username=data["email"],
            password=data["password"]
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")

        data["user"] = user
        return data


# User detail / profile
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "username", "created_at"]
        read_only_fields = ["id", "created_at"]
        
 
# JWT – include user data in token response
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
        
        
# Resume Analyzer
class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ["id", "pdf_file", "file_name", "created_at"]
        read_only_fields = ["id", "created_at"]
    
    def validate_pdf_file(self, value):
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")
        # size limit
        if value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError("File too large (max 5MB).")
        return value
    
    
class ResumeAnalysisSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Resume
        fields = [
            'id',
            'file_name',
            'pdf_file',
            'overall_score',
            'strengths',
            'weaknesses',
            'missing_skills',
            'improvement_suggestions',
            'ats_score',
            'analysis_result',
            'created_at',
            'analyzed_at',
            'status',
        ]
        read_only_fields = [
            'overall_score',
            'strengths',
            'weaknesses',
            'missing_skills',
            'improvement_suggestions',
            'ats_score',
            'analysis_result',
            'analyzed_at',
            'status',
        ]
    