from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema
from .serializers import (
    CustomUserSerializer,
    UserRegistrationSerializer,
    ResidentProfileSerializer,
    GuardianProfileSerializer,
    StaffProfileSerializer,
    VolunteerProfileSerializer,
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    Public registration endpoint for new platform users.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class CurrentUserProfileView(APIView):
    """
    Retrieves or updates the authenticated user's profile and linked role profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: CustomUserSerializer})
    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(responses={200: CustomUserSerializer})
    def patch(self, request):
        serializer = CustomUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmergencyContactViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoint for resident emergency contacts with secure verification code challenge.
    """
    from .serializers import EmergencyContactSerializer
    from .models import EmergencyContact

    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models import EmergencyContact
        return EmergencyContact.objects.filter(resident=self.request.user)

    def perform_create(self, serializer):
        serializer.save(resident=self.request.user)

    @action(detail=True, methods=['post'])
    def request_code(self, request, pk=None):
        contact = self.get_object()
        code = contact.generate_verification_code()
        # In production, dispatch via SMS/email provider. Return preview in dev mode.
        return Response({
            'message': f'Verification code sent to {contact.phone_number}',
            'dev_mode_code': code,
            'expires_in_seconds': 600
        })

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        contact = self.get_object()
        code_input = request.data.get('code', '')
        success, msg = contact.verify(code_input)
        if not success:
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': msg, 'is_verified': True})

