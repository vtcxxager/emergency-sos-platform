from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from societies.models import Society, Tower, Flat
from accounts.models import (
    ResidentProfile,
    GuardianProfile,
    StaffProfile,
    VolunteerProfile,
    EmergencyContact,
)

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds isolated development TEST DATA into database (explicitly labeled TEST DATA)."

    def handle(self, *args, **options):
        self.stdout.write("Seeding isolated TEST DATA into database...")

        society, _ = Society.objects.get_or_create(
            registration_code="SOC-BLR-001",
            defaults={
                "name": "Palm Meadows Estates (TEST DATA)",
                "address_line1": "Outer Ring Road",
                "city": "Bengaluru",
                "state": "Karnataka",
                "postal_code": "560103",
                "emergency_desk_phone": "+919876543210"
            }
        )

        tower1, _ = Tower.objects.get_or_create(society=society, name="Tower 1 (TEST)")
        flat402, _ = Flat.objects.get_or_create(society=society, tower=tower1, flat_number="402")
        flat101, _ = Flat.objects.get_or_create(society=society, tower=tower1, flat_number="101")

        # 1. Resident
        resident, created = User.objects.get_or_create(
            username="resident.test",
            defaults={
                "email": "resident.test@palmmeadows.test",
                "first_name": "Resident",
                "last_name": "[TEST DATA]",
                "phone_number": "+919811223344",
                "primary_role": User.Role.RESIDENT,
                "is_phone_verified": True
            }
        )
        if created:
            resident.set_password("TestPassword123!")
            resident.save()
            ResidentProfile.objects.create(
                user=resident,
                society=society,
                current_flat=flat402,
                blood_group="O+",
                critical_medical_notes="[TEST DATA] Cardiac stent 2024. Elevator assistance required in power failure.",
                is_senior_citizen=True
            )

        # 2. Guardian
        guardian, created = User.objects.get_or_create(
            username="guardian.test",
            defaults={
                "email": "guardian.test@palmmeadows.test",
                "first_name": "Guardian",
                "last_name": "[TEST DATA]",
                "phone_number": "+919123456789",
                "primary_role": User.Role.GUARDIAN,
                "is_phone_verified": True
            }
        )
        if created:
            guardian.set_password("TestPassword123!")
            guardian.save()
            GuardianProfile.objects.create(
                user=guardian,
                preferred_channel=GuardianProfile.ChannelPreference.ALL,
                can_view_medical_info=True
            )
            EmergencyContact.objects.get_or_create(
                resident=resident,
                phone_number=guardian.phone_number,
                defaults={
                    "name": "Guardian [TEST DATA]",
                    "relationship": "Primary Guardian (Tier 1)",
                    "priority_tier": "PRIMARY",
                    "is_verified": True
                }
            )

        # 3. Security
        security, created = User.objects.get_or_create(
            username="security.test",
            defaults={
                "email": "security.test@palmmeadows.test",
                "first_name": "Security Desk",
                "last_name": "[TEST DATA]",
                "phone_number": "+919822033445",
                "primary_role": User.Role.SECURITY_STAFF,
                "is_phone_verified": True
            }
        )
        if created:
            security.set_password("TestPassword123!")
            security.save()
            StaffProfile.objects.create(
                user=security,
                society=society,
                staff_role="SECURITY_GUARD",
                employee_id="SEC-TEST-001",
                is_on_duty=True
            )

        # 4. Volunteer
        volunteer, created = User.objects.get_or_create(
            username="volunteer.test",
            defaults={
                "email": "volunteer.test@palmmeadows.test",
                "first_name": "Volunteer Doctor",
                "last_name": "[TEST DATA]",
                "phone_number": "+919845011223",
                "primary_role": User.Role.VOLUNTEER,
                "is_phone_verified": True
            }
        )
        if created:
            volunteer.set_password("TestPassword123!")
            volunteer.save()
            VolunteerProfile.objects.create(
                user=volunteer,
                society=society,
                is_available=True,
                first_aid_certified=True,
                skills_description="[TEST DATA] Emergency First Aid & CPR"
            )

        # 5. Society Admin
        admin_user, created = User.objects.get_or_create(
            username="admin.test",
            defaults={
                "email": "admin.test@palmmeadows.test",
                "first_name": "Estate Admin",
                "last_name": "[TEST DATA]",
                "phone_number": "+919876543210",
                "primary_role": User.Role.SOCIETY_ADMIN,
                "is_phone_verified": True,
                "is_staff": True
            }
        )
        if created:
            admin_user.set_password("TestPassword123!")
            admin_user.save()

        self.stdout.write(self.style.SUCCESS("Successfully seeded test data into database!"))
