from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    ResidentProfile,
    GuardianProfile,
    StaffProfile,
    VolunteerProfile,
)

class ResidentProfileInline(admin.StackedInline):
    model = ResidentProfile
    can_delete = False
    verbose_name_plural = 'Resident Profile Details'
    fk_name = 'user'

class GuardianProfileInline(admin.StackedInline):
    model = GuardianProfile
    can_delete = False
    verbose_name_plural = 'Guardian Profile Details'
    fk_name = 'user'

class StaffProfileInline(admin.StackedInline):
    model = StaffProfile
    can_delete = False
    verbose_name_plural = 'Staff Profile Details'
    fk_name = 'user'

class VolunteerProfileInline(admin.StackedInline):
    model = VolunteerProfile
    can_delete = False
    verbose_name_plural = 'Volunteer Profile Details'
    fk_name = 'user'

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone_number', 'primary_role', 'is_phone_verified', 'is_staff')
    list_filter = ('primary_role', 'is_phone_verified', 'is_staff', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone_number')
    fieldsets = UserAdmin.fieldsets + (
        ('Platform Details', {
            'fields': ('phone_number', 'primary_role', 'is_phone_verified', 'date_of_birth'),
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Platform Details', {
            'fields': ('phone_number', 'primary_role', 'is_phone_verified'),
        }),
    )

@admin.register(ResidentProfile)
class ResidentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'society', 'current_flat', 'blood_group', 'is_senior_citizen', 'verified_by_society_admin')
    list_filter = ('society', 'blood_group', 'is_senior_citizen', 'verified_by_society_admin')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'critical_medical_notes')

@admin.register(GuardianProfile)
class GuardianProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'alternative_phone', 'preferred_channel', 'can_view_medical_info')
    list_filter = ('preferred_channel', 'can_view_medical_info')
    search_fields = ('user__username', 'user__first_name', 'alternative_phone')

@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'society', 'staff_role', 'employee_id', 'shift_type', 'is_on_duty')
    list_filter = ('society', 'staff_role', 'shift_type', 'is_on_duty')
    search_fields = ('user__username', 'employee_id', 'badge_number')

@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'society', 'is_available', 'first_aid_certified', 'cpr_trained', 'total_incidents_assisted')
    list_filter = ('society', 'is_available', 'first_aid_certified', 'cpr_trained')
    search_fields = ('user__username', 'skills_description')
