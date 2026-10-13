from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from societies.models import Society, Tower, Flat
from accounts.models import (
    ResidentProfile,
    GuardianProfile,
    StaffProfile,
    VolunteerProfile,
)

User = get_user_model()

class CustomUserModelTests(TestCase):
    def setUp(self):
        self.society = Society.objects.create(
            name="Palm Meadows Estates",
            registration_code="SOC-BLR-001",
            address_line1="Outer Ring Road",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560103",
            emergency_desk_phone="+919876543210"
        )
        self.tower = Tower.objects.create(
            society=self.society,
            name="Tower 1",
            floors_count=10
        )
        self.flat = Flat.objects.create(
            society=self.society,
            tower=self.tower,
            flat_number="402",
            floor=4
        )

    def test_create_custom_user_with_role(self):
        user = User.objects.create_user(
            username="anita.rao",
            email="anita@example.com",
            password="StrongPassword123!",
            phone_number="+919811223344",
            primary_role=User.Role.RESIDENT
        )
        self.assertEqual(user.primary_role, User.Role.RESIDENT)
        self.assertTrue(user.check_password("StrongPassword123!"))
        self.assertFalse(user.is_phone_verified)

    def test_phone_number_uniqueness(self):
        User.objects.create_user(
            username="user1",
            email="u1@example.com",
            password="pass",
            phone_number="+919999999999"
        )
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username="user2",
                email="u2@example.com",
                password="pass",
                phone_number="+919999999999"
            )

    def test_resident_profile_one_to_one(self):
        user = User.objects.create_user(
            username="resident1",
            email="res1@example.com",
            password="pass",
            phone_number="+919123456780",
            primary_role=User.Role.RESIDENT
        )
        profile = ResidentProfile.objects.create(
            user=user,
            society=self.society,
            current_flat=self.flat,
            blood_group=ResidentProfile.BloodGroup.O_POS,
            critical_medical_notes="Asthma inhaler required",
            is_senior_citizen=True
        )
        self.assertEqual(user.resident_profile, profile)
        self.assertEqual(profile.society.name, "Palm Meadows Estates")
        self.assertEqual(profile.current_flat.flat_number, "402")

    def test_guardian_profile_one_to_one(self):
        guardian_user = User.objects.create_user(
            username="guardian.rajesh",
            email="rajesh@example.com",
            password="pass",
            phone_number="+919123456781",
            primary_role=User.Role.GUARDIAN
        )
        guardian_profile = GuardianProfile.objects.create(
            user=guardian_user,
            alternative_phone="+919123456789",
            preferred_channel=GuardianProfile.ChannelPreference.ALL
        )
        self.assertEqual(guardian_user.guardian_profile, guardian_profile)
        self.assertTrue(guardian_profile.can_view_medical_info)

    def test_staff_profile_one_to_one(self):
        guard_user = User.objects.create_user(
            username="guard.vikram",
            email="guard@example.com",
            password="pass",
            phone_number="+919123456782",
            primary_role=User.Role.SECURITY_STAFF
        )
        staff_profile = StaffProfile.objects.create(
            user=guard_user,
            society=self.society,
            staff_role=StaffProfile.StaffRole.SECURITY_GUARD,
            employee_id="SEC-042",
            shift_type=StaffProfile.ShiftType.DAY,
            is_on_duty=True
        )
        self.assertEqual(guard_user.staff_profile, staff_profile)
        self.assertTrue(staff_profile.is_on_duty)
