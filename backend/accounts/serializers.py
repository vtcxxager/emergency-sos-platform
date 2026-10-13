from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ResidentProfile,
    GuardianProfile,
    StaffProfile,
    VolunteerProfile,
)
from societies.serializers import SocietySerializer, FlatSerializer

User = get_user_model()

class ResidentProfileSerializer(serializers.ModelSerializer):
    society_details = SocietySerializer(source='society', read_only=True)
    flat_details = FlatSerializer(source='current_flat', read_only=True)

    class Meta:
        model = ResidentProfile
        fields = [
            'society',
            'society_details',
            'current_flat',
            'flat_details',
            'blood_group',
            'critical_medical_notes',
            'is_senior_citizen',
            'verified_by_society_admin',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['verified_by_society_admin', 'created_at', 'updated_at']

class GuardianProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuardianProfile
        fields = [
            'alternative_phone',
            'preferred_channel',
            'can_view_medical_info',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

class StaffProfileSerializer(serializers.ModelSerializer):
    society_name = serializers.CharField(source='society.name', read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            'society',
            'society_name',
            'staff_role',
            'employee_id',
            'shift_type',
            'is_on_duty',
            'radio_channel',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

class VolunteerProfileSerializer(serializers.ModelSerializer):
    society_name = serializers.CharField(source='society.name', read_only=True)

    class Meta:
        model = VolunteerProfile
        fields = [
            'society',
            'society_name',
            'is_available',
            'first_aid_certified',
            'cpr_trained',
            'skills_description',
            'total_incidents_assisted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['total_incidents_assisted', 'created_at', 'updated_at']

class CustomUserSerializer(serializers.ModelSerializer):
    resident_profile = ResidentProfileSerializer(read_only=True)
    guardian_profile = GuardianProfileSerializer(read_only=True)
    staff_profile = StaffProfileSerializer(read_only=True)
    volunteer_profile = VolunteerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'primary_role',
            'is_phone_verified',
            'date_of_birth',
            'resident_profile',
            'guardian_profile',
            'staff_profile',
            'volunteer_profile',
            'created_at',
        ]
        read_only_fields = ['id', 'is_phone_verified', 'created_at']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    society_id = serializers.IntegerField(required=False, write_only=True)
    flat_number = serializers.CharField(required=False, write_only=True, allow_blank=True)
    invitation_token = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone_number',
            'primary_role',
            'society_id',
            'flat_number',
            'invitation_token',
        ]

    def validate_primary_role(self, value):
        # Strict enforcement: Privileged roles cannot be self-assigned via public signup
        allowed_roles = [User.Role.RESIDENT, User.Role.VOLUNTEER, User.Role.GUARDIAN]
        if value not in allowed_roles:
            raise serializers.ValidationError(
                f"Public registration is only permitted for {allowed_roles}. Privileged roles (Security Personnel, Society Admin, Platform Admin) must be authorized by society administration."
            )
        return value

    def create(self, validated_data):
        from societies.models import Society, Flat
        society_id = validated_data.pop('society_id', None)
        flat_number = validated_data.pop('flat_number', None)
        invitation_token = validated_data.pop('invitation_token', None)
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Resolve Society
        society = None
        if society_id:
            society = Society.objects.filter(id=society_id).first()
        if not society:
            society = Society.objects.filter(is_active=True).first()

        # Automatically provision appropriate profile
        if user.primary_role == User.Role.RESIDENT:
            flat_instance = None
            if society and flat_number:
                flat_instance = Flat.objects.filter(society=society, flat_number=flat_number).first()
                if not flat_instance:
                    flat_instance = Flat.objects.create(society=society, flat_number=flat_number)
            ResidentProfile.objects.create(
                user=user,
                society=society,
                current_flat=flat_instance
            )
        elif user.primary_role == User.Role.VOLUNTEER:
            VolunteerProfile.objects.create(
                user=user,
                society=society,
                is_available=True
            )
        elif user.primary_role == User.Role.GUARDIAN:
            GuardianProfile.objects.create(
                user=user,
                preferred_channel=GuardianProfile.ChannelPreference.ALL
            )
            # If an invitation token was provided, accept and link
            if invitation_token:
                from incidents.models import GuardianInvitation
                inv = GuardianInvitation.objects.filter(invitation_token=invitation_token, status='PENDING').first()
                if inv:
                    inv.status = GuardianInvitation.Status.ACCEPTED
                    inv.guardian_user = user
                    inv.save()

        return user


class EmergencyContactSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_priority_tier_display', read_only=True)

    class Meta:
        from .models import EmergencyContact
        model = EmergencyContact
        fields = [
            'id',
            'resident',
            'name',
            'relationship',
            'phone_number',
            'email',
            'priority_tier',
            'tier_display',
            'is_verified',
            'verified_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'resident', 'is_verified', 'verified_at', 'created_at', 'updated_at']

