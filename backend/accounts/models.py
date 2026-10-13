"""
User models and role profiles for Community Emergency Response Platform.
Implements CustomUser, ResidentProfile, GuardianProfile, StaffProfile, and VolunteerProfile.
Uses OneToOneField relationships to the base user model and ForeignKeys for multi-tenant isolation.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator

phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message="Phone number must be formatted as '+999999999'. Up to 15 digits allowed."
)

class CustomUser(AbstractUser):
    """
    Central user model extending Django AbstractUser.
    Enforces verified phone number, primary role identification, and multi-tenant security.
    """
    class Role(models.TextChoices):
        RESIDENT = 'RESIDENT', 'Resident'
        GUARDIAN = 'GUARDIAN', 'Guardian'
        VOLUNTEER = 'VOLUNTEER', 'Volunteer'
        SECURITY_STAFF = 'SECURITY_STAFF', 'Security Personnel'
        SOCIETY_ADMIN = 'SOCIETY_ADMIN', 'Society Administrator'
        PLATFORM_ADMIN = 'PLATFORM_ADMIN', 'Platform Administrator'

    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Primary E.164 phone number used for SMS alerts and OTP authentication."
    )
    primary_role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.RESIDENT,
        db_index=True,
        help_text="Primary role governing access privileges and emergency routing."
    )
    is_phone_verified = models.BooleanField(default=False)
    date_of_birth = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['primary_role', 'is_active']),
        ]

    def __str__(self):
        full_name = self.get_full_name()
        return f"{full_name or self.username} ({self.primary_role})"


class ResidentProfile(models.Model):
    """
    Resident profile containing emergency medical vitals, flat residency link,
    and society multi-tenant scope.
    Linked via OneToOneField to CustomUser.
    """
    class BloodGroup(models.TextChoices):
        A_POS = 'A+', 'A Positive'
        A_NEG = 'A-', 'A Negative'
        B_POS = 'B+', 'B Positive'
        B_NEG = 'B-', 'B Negative'
        AB_POS = 'AB+', 'AB Positive'
        AB_NEG = 'AB-', 'AB Negative'
        O_POS = 'O+', 'O Positive'
        O_NEG = 'O-', 'O Negative'
        UNKNOWN = 'UNKNOWN', 'Unknown'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resident_profile',
        primary_key=True
    )
    society = models.ForeignKey(
        'societies.Society',
        on_delete=models.PROTECT,
        related_name='residents',
        db_index=True,
        help_text="Partitioned residential society."
    )
    current_flat = models.ForeignKey(
        'societies.Flat',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='residents',
        help_text="Primary residence flat unit."
    )
    blood_group = models.CharField(
        max_length=10,
        choices=BloodGroup.choices,
        default=BloodGroup.UNKNOWN
    )
    critical_medical_notes = models.TextField(
        blank=True,
        help_text="Urgent clinical notes for first responders: pacemaker, diabetes, allergies, mobility handicap."
    )
    is_senior_citizen = models.BooleanField(default=False)
    verified_by_society_admin = models.BooleanField(
        default=False,
        help_text="Indicates official approval by the residential society office."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resident_profiles'
        verbose_name = 'Resident Profile'
        verbose_name_plural = 'Resident Profiles'
        indexes = [
            models.Index(fields=['society', 'is_senior_citizen']),
        ]

    def __str__(self):
        flat_str = f" - {self.current_flat}" if self.current_flat else ""
        return f"Resident: {self.user.get_full_name() or self.user.username}{flat_str}"


class GuardianProfile(models.Model):
    """
    Guardian profile for primary and secondary emergency caregivers.
    Linked via OneToOneField to CustomUser.
    """
    class ChannelPreference(models.TextChoices):
        ALL = 'ALL', 'Push, SMS & Automated Call'
        SMS_AND_PUSH = 'SMS_AND_PUSH', 'SMS and Push'
        PUSH_ONLY = 'PUSH_ONLY', 'Push Notifications Only'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='guardian_profile',
        primary_key=True
    )
    alternative_phone = models.CharField(
        validators=[phone_regex],
        max_length=20,
        blank=True,
        help_text="Secondary backup contact line."
    )
    preferred_channel = models.CharField(
        max_length=30,
        choices=ChannelPreference.choices,
        default=ChannelPreference.ALL
    )
    can_view_medical_info = models.BooleanField(
        default=True,
        help_text="Permission to view resident medical conditions during active incident."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guardian_profiles'
        verbose_name = 'Guardian Profile'
        verbose_name_plural = 'Guardian Profiles'

    def __str__(self):
        return f"Guardian: {self.user.get_full_name() or self.user.username}"


class StaffProfile(models.Model):
    """
    Staff profile for on-premises security guards, security supervisors,
    and society administrators.
    Linked via OneToOneField to CustomUser.
    """
    class StaffRole(models.TextChoices):
        SECURITY_GUARD = 'SECURITY_GUARD', 'Security Guard'
        SECURITY_SUPERVISOR = 'SECURITY_SUPERVISOR', 'Security Supervisor'
        SOCIETY_ADMIN = 'SOCIETY_ADMIN', 'Society Administrator'
        FACILITY_MANAGER = 'FACILITY_MANAGER', 'Facility Manager'

    class ShiftType(models.TextChoices):
        DAY = 'DAY', 'Day Shift (06:00 - 18:00)'
        NIGHT = 'NIGHT', 'Night Shift (18:00 - 06:00)'
        GENERAL = 'GENERAL', 'General Shift (09:00 - 18:00)'
        ROTATIONAL = 'ROTATIONAL', 'Rotational'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_profile',
        primary_key=True
    )
    society = models.ForeignKey(
        'societies.Society',
        on_delete=models.CASCADE,
        related_name='staff_members',
        db_index=True,
        help_text="Designated society jurisdiction."
    )
    staff_role = models.CharField(
        max_length=35,
        choices=StaffRole.choices,
        default=StaffRole.SECURITY_GUARD,
        db_index=True
    )
    employee_id = models.CharField(max_length=50, help_text="Badge or employee ID number.")
    shift_type = models.CharField(
        max_length=20,
        choices=ShiftType.choices,
        default=ShiftType.GENERAL
    )
    is_on_duty = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Active duty status for emergency alert routing."
    )
    radio_channel = models.CharField(max_length=30, blank=True, help_text="Walkie-talkie channel number.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'staff_profiles'
        verbose_name = 'Staff Profile'
        verbose_name_plural = 'Staff Profiles'
        indexes = [
            models.Index(fields=['society', 'is_on_duty']),
        ]

    def __str__(self):
        return f"{self.get_staff_role_display()} ({self.employee_id}) - {self.society.name}"


class VolunteerProfile(models.Model):
    """
    Community volunteer profile for verified residents assisting during local emergencies.
    Linked via OneToOneField to CustomUser.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='volunteer_profile',
        primary_key=True
    )
    society = models.ForeignKey(
        'societies.Society',
        on_delete=models.CASCADE,
        related_name='volunteers',
        db_index=True
    )
    is_available = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Flag indicating willingness to respond to nearby active emergencies."
    )
    first_aid_certified = models.BooleanField(default=False)
    cpr_trained = models.BooleanField(default=False)
    skills_description = models.TextField(
        blank=True,
        help_text="Medical qualifications, fire safety, paramedic background, or doctor registration."
    )
    total_incidents_assisted = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'volunteer_profiles'
        verbose_name = 'Volunteer Profile'
        verbose_name_plural = 'Volunteer Profiles'
        indexes = [
            models.Index(fields=['society', 'is_available']),
        ]

    def __str__(self):
        return f"Volunteer: {self.user.get_full_name() or self.user.username} ({self.society.name})"


class EmergencyContact(models.Model):
    class PriorityTier(models.TextChoices):
        PRIMARY = 'PRIMARY', 'Primary Guardian (Tier 1)'
        SECONDARY = 'SECONDARY', 'Secondary Guardian (Tier 2)'
        EMERGENCY = 'EMERGENCY', 'Emergency Contact (Tier 3)'

    resident = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='emergency_contacts',
        db_index=True
    )
    name = models.CharField(max_length=150)
    relationship = models.CharField(max_length=80, help_text="e.g. Spouse, Son, Daughter, Neighbor")
    phone_number = models.CharField(validators=[phone_regex], max_length=20)
    email = models.EmailField(blank=True)
    priority_tier = models.CharField(
        max_length=20,
        choices=PriorityTier.choices,
        default=PriorityTier.EMERGENCY,
        db_index=True
    )
    is_verified = models.BooleanField(default=False, db_index=True)
    verification_code = models.CharField(max_length=8, blank=True)
    code_generated_at = models.DateTimeField(null=True, blank=True)
    verification_attempts = models.PositiveIntegerField(default=0)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'emergency_contacts'
        ordering = ['priority_tier', '-is_verified', 'name']

    def generate_verification_code(self):
        import random, string
        from django.utils import timezone
        code = ''.join(random.choices(string.digits, k=6))
        self.verification_code = code
        self.code_generated_at = timezone.now()
        self.verification_attempts = 0
        self.save(update_fields=['verification_code', 'code_generated_at', 'verification_attempts'])
        return code

    def verify(self, code_input):
        from django.utils import timezone
        if self.verification_attempts >= 3:
            return False, "Maximum verification attempts exceeded. Please request a new code."
        self.verification_attempts += 1
        self.save(update_fields=['verification_attempts'])
        if not self.code_generated_at or (timezone.now() - self.code_generated_at).total_seconds() > 600:
            return False, "Verification code has expired. Please request a fresh code."
        if self.verification_code != code_input.strip():
            return False, "Invalid verification code entered."
        self.is_verified = True
        self.verified_at = timezone.now()
        self.verification_code = ''
        self.save(update_fields=['is_verified', 'verified_at', 'verification_code'])
        return True, "Contact successfully verified."

    def __str__(self):
        return f"{self.name} ({self.priority_tier}) - Resident: {self.resident.username}"

