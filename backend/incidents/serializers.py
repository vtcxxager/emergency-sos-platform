from rest_framework import serializers
from .models import (
    SOSAlert,
    Incident,
    IncidentDiscussion,
    NotificationRecord,
    CommunityAssistanceRequest,
    GuardianInvitation,
)

class SOSAlertSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.get_full_name', read_only=True)
    resident_phone = serializers.CharField(source='resident.phone_number', read_only=True)
    society_name = serializers.CharField(source='society.name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = SOSAlert
        fields = [
            'id',
            'idempotency_key',
            'resident',
            'resident_name',
            'resident_phone',
            'society',
            'society_name',
            'category',
            'category_display',
            'message',
            'latitude',
            'longitude',
            'accuracy_meters',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class IncidentDiscussionSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_role = serializers.CharField(source='author.primary_role', read_only=True)

    class Meta:
        model = IncidentDiscussion
        fields = [
            'id',
            'incident',
            'author',
            'author_name',
            'author_role',
            'message',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class IncidentSerializer(serializers.ModelSerializer):
    sos_alert = SOSAlertSerializer(read_only=True)
    responder_name = serializers.CharField(source='assigned_responder.get_full_name', read_only=True, allow_null=True)
    discussions = IncidentDiscussionSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    stage_display = serializers.CharField(source='get_escalation_stage_display', read_only=True)

    class Meta:
        model = Incident
        fields = [
            'id',
            'sos_alert',
            'society',
            'status',
            'status_display',
            'escalation_stage',
            'stage_display',
            'assigned_responder',
            'responder_name',
            'responder_role',
            'acknowledged_at',
            'resolved_at',
            'closure_notes',
            'discussions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CommunityAssistanceRequestSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.get_full_name', read_only=True)
    resident_phone = serializers.CharField(source='resident.phone_number', read_only=True)
    society_name = serializers.CharField(source='society.name', read_only=True)
    volunteer_name = serializers.CharField(source='assigned_volunteer.get_full_name', read_only=True, allow_null=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CommunityAssistanceRequest
        fields = [
            'id',
            'resident',
            'resident_name',
            'resident_phone',
            'society',
            'society_name',
            'category',
            'category_display',
            'description',
            'status',
            'status_display',
            'assigned_volunteer',
            'volunteer_name',
            'accepted_at',
            'completed_at',
            'resolution_notes',
            'created_at',
        ]
        read_only_fields = ['id', 'resident', 'society', 'created_at']


class GuardianInvitationSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = GuardianInvitation
        fields = [
            'id',
            'resident',
            'resident_name',
            'guardian_name',
            'guardian_phone',
            'guardian_email',
            'priority_tier',
            'status',
            'status_display',
            'invitation_token',
            'created_at',
            'responded_at',
        ]
        read_only_fields = ['id', 'resident', 'invitation_token', 'created_at', 'responded_at']


class NotificationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRecord
        fields = [
            'id',
            'recipient',
            'incident',
            'title',
            'body',
            'channel',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import DeviceToken
        model = DeviceToken
        fields = [
            'id',
            'user',
            'token',
            'platform',
            'endpoint',
            'p256dh_key',
            'auth_key',
            'is_active',
            'created_at',
            'last_used_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'last_used_at']


class NotificationDeliveryJobSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        from .models import NotificationDeliveryJob
        model = NotificationDeliveryJob
        fields = [
            'id',
            'notification',
            'recipient',
            'incident',
            'channel',
            'channel_display',
            'status',
            'status_display',
            'provider_name',
            'provider_message_id',
            'retry_count',
            'sent_at',
            'delivered_at',
            'acknowledged_at',
            'failed_at',
            'error_message',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SystemEventSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        from .models import SystemEvent
        model = SystemEvent
        fields = [
            'id',
            'event_type',
            'event_type_display',
            'society',
            'incident',
            'community_request',
            'payload',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

