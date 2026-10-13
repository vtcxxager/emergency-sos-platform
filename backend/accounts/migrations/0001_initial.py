from django.conf import settings
import django.contrib.auth.models
import django.contrib.auth.validators
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('societies', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('username', models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username')),
                ('first_name', models.CharField(blank=True, max_length=150, verbose_name='first name')),
                ('last_name', models.CharField(blank=True, max_length=150, verbose_name='last name')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='email address')),
                ('is_staff', models.BooleanField(default=False, help_text='Designates whether the user can log into this admin site.', verbose_name='staff status')),
                ('is_active', models.BooleanField(default=True, help_text='Designates whether this user should be treated as active. Unselect this instead of deleting accounts.', verbose_name='active')),
                ('date_joined', models.DateTimeField(default=django.utils.timezone.now, verbose_name='date joined')),
                ('phone_number', models.CharField(db_index=True, help_text='Primary E.164 phone number used for SMS alerts and OTP authentication.', max_length=20, unique=True, validators=[django.core.validators.RegexValidator(message="Phone number must be formatted as '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')])),
                ('primary_role', models.CharField(choices=[('RESIDENT', 'Resident'), ('GUARDIAN', 'Guardian'), ('VOLUNTEER', 'Volunteer'), ('SECURITY_STAFF', 'Security Personnel'), ('SOCIETY_ADMIN', 'Society Administrator'), ('PLATFORM_ADMIN', 'Platform Administrator')], db_index=True, default='RESIDENT', help_text='Primary role governing access privileges and emergency routing.', max_length=30)),
                ('is_phone_verified', models.BooleanField(default=False)),
                ('date_of_birth', models.DateField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
                'db_table': 'users',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='GuardianProfile',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='guardian_profile', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('alternative_phone', models.CharField(blank=True, help_text='Secondary backup contact line.', max_length=20, validators=[django.core.validators.RegexValidator(message="Phone number must be formatted as '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')])),
                ('preferred_channel', models.CharField(choices=[('ALL', 'Push, SMS & Automated Call'), ('SMS_AND_PUSH', 'SMS and Push'), ('PUSH_ONLY', 'Push Notifications Only')], default='ALL', max_length=30)),
                ('can_view_medical_info', models.BooleanField(default=True, help_text='Permission to view resident medical conditions during active incident.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Guardian Profile',
                'verbose_name_plural': 'Guardian Profiles',
                'db_table': 'guardian_profiles',
            },
        ),
        migrations.CreateModel(
            name='ResidentProfile',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='resident_profile', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('blood_group', models.CharField(choices=[('A+', 'A Positive'), ('A-', 'A Negative'), ('B+', 'B Positive'), ('B-', 'B Negative'), ('AB+', 'AB Positive'), ('AB-', 'AB Negative'), ('O+', 'O Positive'), ('O-', 'O Negative'), ('UNKNOWN', 'Unknown')], default='UNKNOWN', max_length=10)),
                ('critical_medical_notes', models.TextField(blank=True, help_text='Urgent clinical notes for first responders: pacemaker, diabetes, allergies, mobility handicap.')),
                ('is_senior_citizen', models.BooleanField(default=False)),
                ('verified_by_society_admin', models.BooleanField(default=False, help_text='Indicates official approval by the residential society office.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('current_flat', models.ForeignKey(blank=True, help_text='Primary residence flat unit.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='residents', to='societies.flat')),
                ('society', models.ForeignKey(help_text='Partitioned residential society.', on_delete=django.db.models.deletion.PROTECT, related_name='residents', to='societies.society')),
            ],
            options={
                'verbose_name': 'Resident Profile',
                'verbose_name_plural': 'Resident Profiles',
                'db_table': 'resident_profiles',
            },
        ),
        migrations.CreateModel(
            name='StaffProfile',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='staff_profile', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('staff_role', models.CharField(choices=[('SECURITY_GUARD', 'Security Guard'), ('SECURITY_SUPERVISOR', 'Security Supervisor'), ('SOCIETY_ADMIN', 'Society Administrator'), ('FACILITY_MANAGER', 'Facility Manager')], db_index=True, default='SECURITY_GUARD', max_length=35)),
                ('employee_id', models.CharField(help_text='Badge or employee ID number.', max_length=50)),
                ('shift_type', models.CharField(choices=[('DAY', 'Day Shift (06:00 - 18:00)'), ('NIGHT', 'Night Shift (18:00 - 06:00)'), ('GENERAL', 'General Shift (09:00 - 18:00)'), ('ROTATIONAL', 'Rotational')], default='GENERAL', max_length=20)),
                ('is_on_duty', models.BooleanField(db_index=True, default=False, help_text='Active duty status for emergency alert routing.')),
                ('radio_channel', models.CharField(blank=True, help_text='Walkie-talkie channel number.', max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('society', models.ForeignKey(help_text='Designated society jurisdiction.', on_delete=django.db.models.deletion.CASCADE, related_name='staff_members', to='societies.society')),
            ],
            options={
                'verbose_name': 'Staff Profile',
                'verbose_name_plural': 'Staff Profiles',
                'db_table': 'staff_profiles',
            },
        ),
        migrations.CreateModel(
            name='VolunteerProfile',
            fields=[
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, primary_key=True, related_name='volunteer_profile', serialize=False, to=settings.AUTH_USER_MODEL)),
                ('is_available', models.BooleanField(db_index=True, default=True, help_text='Flag indicating willingness to respond to nearby active emergencies.')),
                ('first_aid_certified', models.BooleanField(default=False)),
                ('cpr_trained', models.BooleanField(default=False)),
                ('skills_description', models.TextField(blank=True, help_text='Medical qualifications, fire safety, paramedic background, or doctor registration.')),
                ('total_incidents_assisted', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('society', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='volunteers', to='societies.society')),
            ],
            options={
                'verbose_name': 'Volunteer Profile',
                'verbose_name_plural': 'Volunteer Profiles',
                'db_table': 'volunteer_profiles',
            },
        ),
        migrations.AddIndex(
            model_name='customuser',
            index=models.Index(fields=['primary_role', 'is_active'], name='users_primary_517454_idx'),
        ),
        migrations.AddIndex(
            model_name='residentprofile',
            index=models.Index(fields=['society', 'is_senior_citizen'], name='resident_pr_society_b7d8b5_idx'),
        ),
        migrations.AddIndex(
            model_name='staffprofile',
            index=models.Index(fields=['society', 'is_on_duty'], name='staff_profi_society_d493a7_idx'),
        ),
        migrations.AddIndex(
            model_name='volunteerprofile',
            index=models.Index(fields=['society', 'is_available'], name='volunteer_p_society_d8d3e5_idx'),
        ),
    ]
