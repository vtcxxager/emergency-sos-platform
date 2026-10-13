from django.db import models
from django.conf import settings
import uuid

class SOSAlert(models.Model):
    class EmergencyCategory(models.TextChoices):
        GENERAL_EMERGENCY = 'GENERAL_EMERGENCY', 'General Emergency (One-Tap SOS)'
        MEDICAL = 'MEDICAL', 'Medical Emergency'
        FALL_ACCIDENT = 'FALL_ACCIDENT', 'Fall or Accident'
        PERSONAL_SAFETY = 'PERSONAL_SAFETY', 'Personal Safety Threat'
        FIRE_HAZARD = 'FIRE_HAZARD', 'Fire or Gas Hazard'
        SECURITY_CONCERN = 'SECURITY_CONCERN', 'Security Concern'
        GENERAL_ASSISTANCE = 'GENERAL_ASSISTANCE', 'Urgent Assistance'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempotency_key = models.CharField(max_length=128, blank=True, db_index=True)
    resident = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sos_alerts',
        db_index=True
    )
    society = models.ForeignKey(
        'societies.Society',
        on_delete=models.PROTECT,
        related_name='sos_alerts',
        db_index=True
    )
    category = models.CharField(
        max_length=40,
        choices=EmergencyCategory.choices,
        default=EmergencyCategory.GENERAL_EMERGENCY
    )
    message = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    accuracy_meters = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'sos_alerts'
        ordering = ['-created_at']

    def __str__(self):
        return f"SOS [{self.category}] by {self.resident.username} at {self.created_at}"


class Incident(models.Model):
    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        ACKNOWLEDGED = 'ACKNOWLEDGED', 'Acknowledged'
        ACCEPTED = 'ACCEPTED', 'Accepted (Responding)'
        ACTIVE_RESPONSE = 'ACTIVE_RESPONSE', 'Active Response'
        ESCALATED = 'ESCALATED', 'Escalated'
        RESOLVED = 'RESOLVED', 'Resolved'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class EscalationStage(models.TextChoices):
        PRIMARY_GUARDIAN = 'PRIMARY_GUARDIAN', 'Tier 1: Primary Guardian'
        SECONDARY_GUARDIAN = 'SECONDARY_GUARDIAN', 'Tier 2: Secondary Guardian'
        COMMUNITY_BROADCAST = 'COMMUNITY_BROADCAST', 'Tier 3: Security & Community'

    sos_alert = models.OneToOneField(
        SOSAlert,
        on_delete=models.CASCADE,
        related_name='incident'
    )
    society = models.ForeignKey(
        'societies.Society',
        on_delete=models.CASCADE,
        related_name='incidents',
        db_index=True
    )
    status = models.CharField(
        max_length=25,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True
    )
    escalation_stage = models.CharField(
        max_length=30,
        choices=EscalationStage.choices,
        default=EscalationStage.PRIMARY_GUARDIAN
    )
    assigned_responder = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_incidents'
    )
    responder_role = models.CharField(max_length=40, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closure_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'incidents'
        ordering = ['-created_at']

    def __str__(self):
        return f"Incident #{self.id} [{self.status}] - {self.sos_alert.category}"


class CommunityAssistanceRequest(models.Model):
    """
    Separate non-emergency community help request (e.g. check on resident, minor fall, mobility support).
    """
    class Category(models.TextChoices):
        WELLNESS_CHECK = 'WELLNESS_CHECK', 'Check On Me / Wellness Check'
        MINOR_FALL = 'MINOR_FALL', 'Assistance After Minor Fall (Non-Critical)'
        SECURITY_DESK = 'SECURITY_DESK', 'Help Reaching Security Desk'
        FIRST_AID = 'FIRST_AID', 'Nearby First-Aid / Dressing Assistance'
        MOBILITY_SUPPORT = 'MOBILITY_SUPPORT', 'Mobility & Stairwell Assistance'
        GENERAL_SUPPORT = 'GENERAL_SUPPORT', 'General Non-Emergency Assistance'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        ACCEPTED = 'ACCEPTED', 'Accepted by Volunteer'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    resident = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='community_requests',
        db_index=True
    )
    society = models.ForeignKey(
        'societies.Society',
        on_delete=models.CASCADE,
        related_name='community_requests',
        db_index=True
    )
    category = models.CharField(
        max_length=40,
        choices=Category.choices,
        default=Category.WELLNESS_CHECK
    )
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True
    )
    assigned_volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accepted_community_requests'
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'community_assistance_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Help Request #{self.id} [{self.status}] by {self.resident.username}"


class IncidentDiscussion(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name='discussions'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'incident_discussions'
        ordering = ['created_at']


class NotificationRecord(models.Model):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    channel = models.CharField(max_length=30, default='IN_APP')
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']


class GuardianInvitation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Acceptance'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        DECLINED = 'DECLINED', 'Declined'

    resident = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_guardian_invitations'
    )
    guardian_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='received_guardian_invitations'
    )
    guardian_name = models.CharField(max_length=150)
    guardian_phone = models.CharField(max_length=20)
    guardian_email = models.EmailField(blank=True)
    priority_tier = models.CharField(
        max_length=20,
        choices=[('PRIMARY', 'Primary Guardian'), ('SECONDARY', 'Secondary Guardian')],
        default='PRIMARY'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    invitation_token = models.CharField(max_length=64, default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'guardian_invitations'
        ordering = ['-created_at']

    def __str__(self):
        return f"Guardian Invitation to {self.guardian_name} from {self.resident.username}"


class DeviceToken(models.Model):
    class Platform(models.TextChoices):
        WEB_PUSH = 'WEB_PUSH', 'Web Push API'
        FCM = 'FCM', 'Firebase Cloud Messaging'
        APNS = 'APNS', 'Apple Push Notification'
        EXPO = 'EXPO', 'Expo Push Service'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='device_tokens',
        db_index=True
    )
    token = models.CharField(max_length=512, unique=True, db_index=True)
    platform = models.CharField(max_length=20, choices=Platform.choices, default=Platform.WEB_PUSH)
    endpoint = models.URLField(max_length=1024, blank=True)
    p256dh_key = models.CharField(max_length=255, blank=True)
    auth_key = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'device_tokens'
        ordering = ['-created_at']

    def __str__(self):
        return f"Device [{self.platform}] for {self.user.username}"


class NotificationDeliveryJob(models.Model):
    class Channel(models.TextChoices):
        IN_APP = 'IN_APP', 'In-App Live Alert'
        WEB_PUSH = 'WEB_PUSH', 'Web Push'
        FCM = 'FCM', 'Firebase Cloud Messaging'
        APNS = 'APNS', 'Apple Push Notification'
        SMS = 'SMS', 'SMS Gateway'
        EMAIL = 'EMAIL', 'Email Gateway'

    class DeliveryStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Dispatch'
        SENT = 'SENT', 'Sent to Provider'
        DELIVERED = 'DELIVERED', 'Delivered to Device'
        ACKNOWLEDGED = 'ACKNOWLEDGED', 'Acknowledged by User'
        FAILED = 'FAILED', 'Delivery Failed'

    notification = models.ForeignKey(
        NotificationRecord,
        on_delete=models.CASCADE,
        related_name='delivery_jobs'
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='delivery_jobs',
        db_index=True
    )
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='delivery_jobs'
    )
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.IN_APP)
    status = models.CharField(
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
        db_index=True
    )
    provider_name = models.CharField(max_length=64, blank=True)
    provider_message_id = models.CharField(max_length=255, blank=True)
    retry_count = models.PositiveIntegerField(default=0)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notification_delivery_jobs'
        ordering = ['-created_at']

    def __str__(self):
        return f"Job #{self.id} [{self.channel}] -> {self.recipient.username} ({self.status})"


class SystemEvent(models.Model):
    class EventType(models.TextChoices):
        SOS_CREATED = 'SOS_CREATED', 'New SOS Incident'
        INCIDENT_ACKNOWLEDGED = 'INCIDENT_ACKNOWLEDGED', 'Incident Acknowledged'
        RESPONDER_ASSIGNED = 'RESPONDER_ASSIGNED', 'Responder Assigned'
        INCIDENT_UPDATED = 'INCIDENT_UPDATED', 'Incident Details Updated'
        INCIDENT_RESOLVED = 'INCIDENT_RESOLVED', 'Incident Resolved'
        COMMUNITY_REQUEST_CREATED = 'COMMUNITY_REQUEST_CREATED', 'New Community Request'
        COMMUNITY_REQUEST_ACCEPTED = 'COMMUNITY_REQUEST_ACCEPTED', 'Community Request Accepted'
        COMMUNITY_REQUEST_COMPLETED = 'COMMUNITY_REQUEST_COMPLETED', 'Community Request Completed'
        NOTIFICATION_DISPATCHED = 'NOTIFICATION_DISPATCHED', 'Notification Dispatched'
        NOTIFICATION_ACKNOWLEDGED = 'NOTIFICATION_ACKNOWLEDGED', 'Notification Acknowledged'
        NOTIFICATION_FAILED = 'NOTIFICATION_FAILED', 'Notification Delivery Failed'

    id = models.BigAutoField(primary_key=True)
    event_type = models.CharField(max_length=50, choices=EventType.choices, db_index=True)
    society = models.ForeignKey('societies.Society', on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, null=True, blank=True)
    community_request = models.ForeignKey(CommunityAssistanceRequest, on_delete=models.CASCADE, null=True, blank=True)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'system_events'
        ordering = ['id']

    def __str__(self):
        return f"Event #{self.id} [{self.event_type}] at {self.created_at}"

