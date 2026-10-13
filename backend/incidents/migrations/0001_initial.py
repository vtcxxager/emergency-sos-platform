from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('societies', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SOSAlert',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('idempotency_key', models.CharField(blank=True, db_index=True, max_length=128)),
                ('category', models.CharField(choices=[('GENERAL_EMERGENCY', 'General Emergency (One-Tap SOS)'), ('MEDICAL', 'Medical Emergency'), ('FALL_ACCIDENT', 'Fall or Accident'), ('PERSONAL_SAFETY', 'Personal Safety Threat'), ('FIRE_HAZARD', 'Fire or Gas Hazard'), ('SECURITY_CONCERN', 'Security Concern'), ('GENERAL_ASSISTANCE', 'Urgent Assistance')], default='GENERAL_EMERGENCY', max_length=40)),
                ('message', models.TextField(blank=True)),
                ('latitude', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=7, max_digits=10, null=True)),
                ('accuracy_meters', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('resident', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sos_alerts', to=settings.AUTH_USER_MODEL)),
                ('society', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='sos_alerts', to='societies.society')),
            ],
            options={
                'db_table': 'sos_alerts',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Incident',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('OPEN', 'Open'), ('ACKNOWLEDGED', 'Acknowledged'), ('ACCEPTED', 'Accepted (Responding)'), ('ACTIVE_RESPONSE', 'Active Response'), ('ESCALATED', 'Escalated'), ('RESOLVED', 'Resolved'), ('CANCELLED', 'Cancelled')], db_index=True, default='OPEN', max_length=25)),
                ('escalation_stage', models.CharField(choices=[('PRIMARY_GUARDIAN', 'Tier 1: Primary Guardian'), ('SECONDARY_GUARDIAN', 'Tier 2: Secondary Guardian'), ('COMMUNITY_BROADCAST', 'Tier 3: Security & Community')], default='PRIMARY_GUARDIAN', max_length=30)),
                ('responder_role', models.CharField(blank=True, max_length=40)),
                ('acknowledged_at', models.DateTimeField(blank=True, null=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('closure_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_responder', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_incidents', to=settings.AUTH_USER_MODEL)),
                ('society', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='incidents', to='societies.society')),
                ('sos_alert', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='incident', to='incidents.sosalert')),
            ],
            options={
                'db_table': 'incidents',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CommunityAssistanceRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(choices=[('WELLNESS_CHECK', 'Check On Me / Wellness Check'), ('MINOR_FALL', 'Assistance After Minor Fall (Non-Critical)'), ('SECURITY_DESK', 'Help Reaching Security Desk'), ('FIRST_AID', 'Nearby First-Aid / Dressing Assistance'), ('MOBILITY_SUPPORT', 'Mobility & Stairwell Assistance'), ('GENERAL_SUPPORT', 'General Non-Emergency Assistance')], default='WELLNESS_CHECK', max_length=40)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('OPEN', 'Open'), ('ACCEPTED', 'Accepted by Volunteer'), ('COMPLETED', 'Completed'), ('CANCELLED', 'Cancelled')], db_index=True, default='OPEN', max_length=20)),
                ('accepted_at', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('resolution_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('assigned_volunteer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='accepted_community_requests', to=settings.AUTH_USER_MODEL)),
                ('resident', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='community_requests', to=settings.AUTH_USER_MODEL)),
                ('society', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='community_requests', to='societies.society')),
            ],
            options={
                'db_table': 'community_assistance_requests',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='GuardianInvitation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('guardian_name', models.CharField(max_length=150)),
                ('guardian_phone', models.CharField(max_length=20)),
                ('guardian_email', models.EmailField(blank=True, max_length=254)),
                ('priority_tier', models.CharField(choices=[('PRIMARY', 'Primary Guardian'), ('SECONDARY', 'Secondary Guardian')], default='PRIMARY', max_length=20)),
                ('status', models.CharField(choices=[('PENDING', 'Pending Acceptance'), ('ACCEPTED', 'Accepted'), ('DECLINED', 'Declined')], db_index=True, default='PENDING', max_length=20)),
                ('invitation_token', models.CharField(default=uuid.uuid4, max_length=64, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('responded_at', models.DateTimeField(blank=True, null=True)),
                ('guardian_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_guardian_invitations', to=settings.AUTH_USER_MODEL)),
                ('resident', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_guardian_invitations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'guardian_invitations',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='IncidentDiscussion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('incident', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='discussions', to='incidents.incident')),
            ],
            options={
                'db_table': 'incident_discussions',
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='NotificationRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('body', models.TextField()),
                ('channel', models.CharField(default='IN_APP', max_length=30)),
                ('is_read', models.BooleanField(db_index=True, default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('incident', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='incidents.incident')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'notifications',
                'ordering': ['-created_at'],
            },
        ),
    ]
