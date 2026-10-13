from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from django.utils import timezone
import random
import string

phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message="Phone number must be formatted as '+999999999'. Up to 15 digits allowed."
)

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
        """Generates a secure 6-digit numeric verification code with timestamp."""
        code = ''.join(random.choices(string.digits, k=6))
        self.verification_code = code
        self.code_generated_at = timezone.now()
        self.verification_attempts = 0
        self.save(update_fields=['verification_code', 'code_generated_at', 'verification_attempts'])
        return code

    def verify(self, code_input):
        """Validates code, expiration (10 min), and attempt limit."""
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
