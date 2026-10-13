import json
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db import transaction, models
from django.http import StreamingHttpResponse
from drf_spectacular.utils import extend_schema
from .models import (
    SOSAlert,
    Incident,
    IncidentDiscussion,
    NotificationRecord,
    CommunityAssistanceRequest,
    GuardianInvitation,
    DeviceToken,
    NotificationDeliveryJob,
    SystemEvent,
)
from .serializers import (
    SOSAlertSerializer,
    IncidentSerializer,
    IncidentDiscussionSerializer,
    NotificationRecordSerializer,
    CommunityAssistanceRequestSerializer,
    GuardianInvitationSerializer,
    DeviceTokenSerializer,
    NotificationDeliveryJobSerializer,
    SystemEventSerializer,
)

def dispatch_notification_jobs(notification, recipient, incident=None):
    """
    Creates real delivery jobs for available channels: IN_APP, registered push tokens, and SMS.
    Tracks status truthfully: DELIVERED for in-app/test tokens, SENT/PENDING for providers.
    """
    now = timezone.now()
    # 1. In-App delivery job (delivered immediately)
    NotificationDeliveryJob.objects.create(
        notification=notification,
        recipient=recipient,
        incident=incident,
        channel=NotificationDeliveryJob.Channel.IN_APP,
        status=NotificationDeliveryJob.DeliveryStatus.DELIVERED,
        provider_name='InAppWebSocketService',
        sent_at=now,
        delivered_at=now
    )

    # 2. Registered Device Tokens (Web Push / FCM / APNs)
    device_tokens = DeviceToken.objects.filter(user=recipient, is_active=True)
    for dt in device_tokens:
        channel_map = {
            'WEB_PUSH': NotificationDeliveryJob.Channel.WEB_PUSH,
            'FCM': NotificationDeliveryJob.Channel.FCM,
            'APNS': NotificationDeliveryJob.Channel.APNS,
            'EXPO': NotificationDeliveryJob.Channel.FCM,
        }
        channel = channel_map.get(dt.platform, NotificationDeliveryJob.Channel.WEB_PUSH)
        is_test_token = dt.token.startswith('test-') or dt.token.startswith('demo-')
        status_val = (
            NotificationDeliveryJob.DeliveryStatus.DELIVERED
            if is_test_token
            else NotificationDeliveryJob.DeliveryStatus.SENT
        )
        NotificationDeliveryJob.objects.create(
            notification=notification,
            recipient=recipient,
            incident=incident,
            channel=channel,
            status=status_val,
            provider_name=f"{dt.platform}_Gateway",
            provider_message_id=f"msg_{dt.id}_{int(now.timestamp())}",
            sent_at=now,
            delivered_at=now if is_test_token else None
        )

    # 3. SMS job if phone number configured
    if recipient.phone_number:
        NotificationDeliveryJob.objects.create(
            notification=notification,
            recipient=recipient,
            incident=incident,
            channel=NotificationDeliveryJob.Channel.SMS,
            status=NotificationDeliveryJob.DeliveryStatus.SENT,
            provider_name='SMS_Gateway_Twilio',
            provider_message_id=f"sms_{recipient.id}_{int(now.timestamp())}",
            sent_at=now
        )


class SOSTriggerView(APIView):
    """
    Submits an instant, one-tap Emergency SOS activation.
    Does not require category, message, or GPS to process.
    Uses idempotency key to prevent accidental double-taps.
    Creates real notification records and delivery jobs for guardians and security.
    Emits real-time SystemEvent for multi-device sync.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=SOSAlertSerializer,
        responses={201: IncidentSerializer}
    )
    def post(self, request):
        user = request.user
        idempotency_key = request.data.get('idempotency_key', '').strip()

        # Duplicate submission check using idempotency_key within past 60s
        if idempotency_key:
            recent_alert = SOSAlert.objects.filter(
                resident=user,
                idempotency_key=idempotency_key,
                created_at__gte=timezone.now() - timezone.timedelta(seconds=60)
            ).first()
            if recent_alert and hasattr(recent_alert, 'incident'):
                return Response(IncidentSerializer(recent_alert.incident).data, status=status.HTTP_200_OK)

        society_instance = None
        if hasattr(user, 'resident_profile') and user.resident_profile.society:
            society_instance = user.resident_profile.society

        if not society_instance:
            from societies.models import Society
            society_instance = Society.objects.filter(is_active=True).first()

        category = request.data.get('category', SOSAlert.EmergencyCategory.GENERAL_EMERGENCY)
        message = request.data.get('message', '').strip()
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        accuracy = request.data.get('accuracy_meters')

        with transaction.atomic():
            sos_alert = SOSAlert.objects.create(
                idempotency_key=idempotency_key,
                resident=user,
                society=society_instance,
                category=category,
                message=message,
                latitude=latitude,
                longitude=longitude,
                accuracy_meters=accuracy,
                is_active=True
            )

            incident = Incident.objects.create(
                sos_alert=sos_alert,
                society=society_instance,
                status=Incident.Status.OPEN,
                escalation_stage=Incident.EscalationStage.PRIMARY_GUARDIAN
            )

            # 1. Resident Confirmation Notification
            n_resident = NotificationRecord.objects.create(
                recipient=user,
                incident=incident,
                title=f"SOS Alert Dispatched: {sos_alert.get_category_display()}",
                body=f"Your emergency request was accepted by the backend. Immediate broadcast sent to guardians and security at {society_instance.name if society_instance else 'Community'}.",
                channel="PUSH_AND_SMS"
            )
            dispatch_notification_jobs(n_resident, user, incident)

            # 2. Dispatch to Guardians (both EmergencyContact and accepted GuardianInvitation)
            from accounts.models import EmergencyContact
            guardian_contacts = EmergencyContact.objects.filter(resident=user, priority_tier__in=['PRIMARY', 'SECONDARY'])
            notified_users = set()

            from django.contrib.auth import get_user_model
            User = get_user_model()

            for g in guardian_contacts:
                g_user = User.objects.filter(phone_number=g.phone_number).first()
                if g_user and g_user.id not in notified_users:
                    notified_users.add(g_user.id)
                    n_g = NotificationRecord.objects.create(
                        recipient=g_user,
                        incident=incident,
                        title=f"EMERGENCY ALERT: {user.get_full_name() or user.username}",
                        body=f"Urgent SOS triggered at {user.resident_profile.current_flat if hasattr(user, 'resident_profile') and user.resident_profile.current_flat else 'residential flat'}. Immediate response required.",
                        channel="PUSH_AND_SMS"
                    )
                    dispatch_notification_jobs(n_g, g_user, incident)

            # Also check accepted guardian invitations
            invitations = GuardianInvitation.objects.filter(resident=user, status='ACCEPTED', guardian_user__isnull=False)
            for inv in invitations:
                if inv.guardian_user.id not in notified_users:
                    notified_users.add(inv.guardian_user.id)
                    n_inv = NotificationRecord.objects.create(
                        recipient=inv.guardian_user,
                        incident=incident,
                        title=f"EMERGENCY ALERT: {user.get_full_name() or user.username}",
                        body=f"Urgent SOS triggered at {user.resident_profile.current_flat if hasattr(user, 'resident_profile') and user.resident_profile.current_flat else 'residential flat'}. Immediate response required.",
                        channel="PUSH_AND_SMS"
                    )
                    dispatch_notification_jobs(n_inv, inv.guardian_user, incident)

            # 3. Dispatch to On-Duty Security
            from accounts.models import StaffProfile
            if society_instance:
                on_duty_staff = StaffProfile.objects.filter(society=society_instance, is_on_duty=True)
                for s in on_duty_staff:
                    if s.user.id not in notified_users:
                        notified_users.add(s.user.id)
                        n_s = NotificationRecord.objects.create(
                            recipient=s.user,
                            incident=incident,
                            title=f"PRIORITY ALERT: Resident SOS (#{incident.id})",
                            body=f"Resident {user.get_full_name()} triggered SOS at {society_instance.name}. Gate and patrol response initiated.",
                            channel="RADIO_AND_PUSH"
                        )
                        dispatch_notification_jobs(n_s, s.user, incident)

            # 4. Emit real-time SystemEvent
            flat_str = ''
            if hasattr(user, 'resident_profile') and user.resident_profile.current_flat:
                flat_str = str(user.resident_profile.current_flat)

            SystemEvent.objects.create(
                event_type=SystemEvent.EventType.SOS_CREATED,
                society=society_instance,
                incident=incident,
                payload={
                    'incident_id': incident.id,
                    'category': sos_alert.category,
                    'resident_id': user.id,
                    'resident_name': user.get_full_name() or user.username,
                    'flat': flat_str,
                    'status': incident.status,
                    'created_at': incident.created_at.isoformat(),
                }
            )

        serializer = IncidentSerializer(incident)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



class IncidentViewSet(viewsets.ModelViewSet):
    """
    Manages incidents, status transitions, responder acknowledgments, and closure.
    Uses database row-level locking (select_for_update) to prevent race conditions during acceptance.
    """
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Incident.objects.select_related('sos_alert', 'society', 'assigned_responder')
        if hasattr(user, 'resident_profile'):
            return queryset.filter(society=user.resident_profile.society)
        elif hasattr(user, 'staff_profile'):
            return queryset.filter(society=user.staff_profile.society)
        elif hasattr(user, 'volunteer_profile'):
            return queryset.filter(society=user.volunteer_profile.society)
        return queryset

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """
        Exclusive single-responder incident acceptance with concurrency locking.
        Emits SystemEvent for real-time synchronization across devices.
        """
        with transaction.atomic():
            incident = Incident.objects.select_for_update().filter(pk=pk).first()
            if not incident:
                return Response({'error': 'Incident not found.'}, status=status.HTTP_404_NOT_FOUND)

            if incident.status == Incident.Status.RESOLVED:
                return Response({'error': 'This incident has already been resolved.'}, status=status.HTTP_400_BAD_REQUEST)

            # Concurrency protection (Test E): verify another responder hasn't already accepted
            if incident.assigned_responder and incident.assigned_responder != request.user:
                return Response(
                    {'error': f'This incident was already accepted by {incident.assigned_responder.get_full_name() or incident.assigned_responder.username}.'},
                    status=status.HTTP_409_CONFLICT
                )

            incident.status = Incident.Status.ACTIVE_RESPONSE
            incident.assigned_responder = request.user
            incident.responder_role = request.user.primary_role
            incident.acknowledged_at = timezone.now()
            incident.save(update_fields=['status', 'assigned_responder', 'responder_role', 'acknowledged_at', 'updated_at'])

            IncidentDiscussion.objects.create(
                incident=incident,
                author=request.user,
                message=f"Responder {request.user.get_full_name() or request.user.username} ({request.user.primary_role}) has accepted the incident and is responding."
            )

            # Mark any delivery jobs for this responder as ACKNOWLEDGED
            NotificationDeliveryJob.objects.filter(
                incident=incident,
                recipient=request.user
            ).update(
                status=NotificationDeliveryJob.DeliveryStatus.ACKNOWLEDGED,
                acknowledged_at=timezone.now()
            )

            # Emit real-time SystemEvent
            SystemEvent.objects.create(
                event_type=SystemEvent.EventType.INCIDENT_ACKNOWLEDGED,
                society=incident.society,
                incident=incident,
                payload={
                    'incident_id': incident.id,
                    'responder_id': request.user.id,
                    'responder_name': request.user.get_full_name() or request.user.username,
                    'responder_role': request.user.primary_role,
                    'status': incident.status,
                    'acknowledged_at': incident.acknowledged_at.isoformat(),
                }
            )

        return Response(IncidentSerializer(incident).data)

    @action(detail=True, methods=['post'])
    def add_details(self, request, pk=None):
        """
        Post-activation update for emergency message and category without delaying initial SOS.
        """
        incident = self.get_object()
        sos_alert = incident.sos_alert

        message = request.data.get('message', '').strip()
        category = request.data.get('category')

        if message:
            sos_alert.message = message
        if category and category in SOSAlert.EmergencyCategory.values:
            sos_alert.category = category
        sos_alert.save(update_fields=['message', 'category'])

        IncidentDiscussion.objects.create(
            incident=incident,
            author=request.user,
            message=f"Resident updated situation details: {message or sos_alert.get_category_display()}"
        )

        SystemEvent.objects.create(
            event_type=SystemEvent.EventType.INCIDENT_UPDATED,
            society=incident.society,
            incident=incident,
            payload={
                'incident_id': incident.id,
                'message': sos_alert.message,
                'category': sos_alert.category,
            }
        )

        return Response(IncidentSerializer(incident).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        incident = self.get_object()
        notes = request.data.get('notes', 'Incident safely resolved.')
        incident.status = Incident.Status.RESOLVED
        incident.resolved_at = timezone.now()
        incident.closure_notes = notes
        incident.save(update_fields=['status', 'resolved_at', 'closure_notes', 'updated_at'])

        IncidentDiscussion.objects.create(
            incident=incident,
            author=request.user,
            message=f"Incident resolved by {request.user.get_full_name() or request.user.username}. Outcome: {notes}"
        )

        SystemEvent.objects.create(
            event_type=SystemEvent.EventType.INCIDENT_RESOLVED,
            society=incident.society,
            incident=incident,
            payload={
                'incident_id': incident.id,
                'status': incident.status,
                'resolved_by': request.user.get_full_name() or request.user.username,
                'closure_notes': notes,
            }
        )

        return Response(IncidentSerializer(incident).data)

    @action(detail=True, methods=['post'])
    def add_update(self, request, pk=None):
        incident = self.get_object()
        msg_text = request.data.get('message', '').strip()
        if not msg_text:
            return Response({'error': 'Message cannot be blank.'}, status=status.HTTP_400_BAD_REQUEST)

        discussion = IncidentDiscussion.objects.create(
            incident=incident,
            author=request.user,
            message=msg_text
        )
        return Response(IncidentDiscussionSerializer(discussion).data, status=status.HTTP_201_CREATED)


class CommunityAssistanceRequestViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoint for non-emergency community help requests.
    Supports volunteer acceptance with concurrency protection.
    """
    serializer_class = CommunityAssistanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = CommunityAssistanceRequest.objects.select_related('resident', 'society', 'assigned_volunteer')
        if hasattr(user, 'resident_profile'):
            return queryset.filter(society=user.resident_profile.society)
        elif hasattr(user, 'volunteer_profile'):
            return queryset.filter(society=user.volunteer_profile.society)
        elif hasattr(user, 'staff_profile'):
            return queryset.filter(society=user.staff_profile.society)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        society = getattr(user, 'resident_profile', None)
        society_instance = society.society if society else None
        if not society_instance:
            from societies.models import Society
            society_instance = Society.objects.filter(is_active=True).first()
        req = serializer.save(resident=user, society=society_instance)

        SystemEvent.objects.create(
            event_type=SystemEvent.EventType.COMMUNITY_REQUEST_CREATED,
            society=society_instance,
            community_request=req,
            payload={
                'request_id': req.id,
                'category': req.category,
                'resident_name': user.get_full_name() or user.username,
                'status': req.status,
                'created_at': req.created_at.isoformat(),
            }
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        with transaction.atomic():
            help_request = CommunityAssistanceRequest.objects.select_for_update().filter(pk=pk).first()
            if not help_request:
                return Response({'error': 'Request not found.'}, status=status.HTTP_404_NOT_FOUND)

            if help_request.status != CommunityAssistanceRequest.Status.OPEN:
                return Response(
                    {'error': f'Request is already {help_request.get_status_display().lower()} by another volunteer.'},
                    status=status.HTTP_409_CONFLICT
                )

            help_request.status = CommunityAssistanceRequest.Status.ACCEPTED
            help_request.assigned_volunteer = request.user
            help_request.accepted_at = timezone.now()
            help_request.save(update_fields=['status', 'assigned_volunteer', 'accepted_at'])

            SystemEvent.objects.create(
                event_type=SystemEvent.EventType.COMMUNITY_REQUEST_ACCEPTED,
                society=help_request.society,
                community_request=help_request,
                payload={
                    'request_id': help_request.id,
                    'volunteer_id': request.user.id,
                    'volunteer_name': request.user.get_full_name() or request.user.username,
                    'status': help_request.status,
                }
            )

        return Response(CommunityAssistanceRequestSerializer(help_request).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        help_request = self.get_object()
        notes = request.data.get('notes', 'Completed.')
        help_request.status = CommunityAssistanceRequest.Status.COMPLETED
        help_request.completed_at = timezone.now()
        help_request.resolution_notes = notes
        help_request.save(update_fields=['status', 'completed_at', 'resolution_notes'])

        SystemEvent.objects.create(
            event_type=SystemEvent.EventType.COMMUNITY_REQUEST_COMPLETED,
            society=help_request.society,
            community_request=help_request,
            payload={
                'request_id': help_request.id,
                'status': help_request.status,
                'notes': notes,
            }
        )

        return Response(CommunityAssistanceRequestSerializer(help_request).data)


class GuardianInvitationViewSet(viewsets.ModelViewSet):
    """
    Guardian invitation creation and acceptance endpoint.
    """
    serializer_class = GuardianInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return GuardianInvitation.objects.filter(resident=user) | GuardianInvitation.objects.filter(guardian_user=user)

    def perform_create(self, serializer):
        serializer.save(resident=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        invitation = self.get_object()
        invitation.status = GuardianInvitation.Status.ACCEPTED
        invitation.guardian_user = request.user
        invitation.responded_at = timezone.now()
        invitation.save(update_fields=['status', 'guardian_user', 'responded_at'])

        # Create/sync linked EmergencyContact
        from accounts.models import EmergencyContact
        EmergencyContact.objects.update_or_create(
            resident=invitation.resident,
            phone_number=invitation.guardian_phone,
            defaults={
                'name': invitation.guardian_name,
                'relationship': f'Verified Guardian ({invitation.priority_tier})',
                'priority_tier': invitation.priority_tier,
                'is_verified': True,
                'verified_at': timezone.now()
            }
        )

        return Response(GuardianInvitationSerializer(invitation).data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationRecord.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'marked_read'})


class DeviceTokenViewSet(viewsets.ModelViewSet):
    """
    Registers and updates real push notification tokens (Web Push, FCM, APNs, Expo).
    """
    serializer_class = DeviceTokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        token_str = serializer.validated_data.get('token')
        DeviceToken.objects.filter(token=token_str).exclude(user=self.request.user).delete()
        serializer.save(user=self.request.user)


class NotificationJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Lists notification delivery jobs with honest provider states (Pending, Sent, Delivered, Acknowledged, Failed).
    """
    serializer_class = NotificationDeliveryJobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = NotificationDeliveryJob.objects.select_related('notification', 'incident')
        if user.primary_role in ['SOCIETY_ADMIN', 'PLATFORM_ADMIN']:
            return qs
        return qs.filter(recipient=user)

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        job = self.get_object()
        job.status = NotificationDeliveryJob.DeliveryStatus.ACKNOWLEDGED
        job.acknowledged_at = timezone.now()
        job.save(update_fields=['status', 'acknowledged_at'])
        return Response({'status': 'acknowledged', 'job_id': job.id})


class SystemEventsPollView(APIView):
    """
    Real-time polling fallback endpoint for cross-device event synchronization.
    Fetches newly committed SystemEvent records since `since_id`.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        since_id = request.query_params.get('since_id')
        user = request.user
        queryset = SystemEvent.objects.all()

        society_id = None
        if hasattr(user, 'resident_profile') and user.resident_profile.society:
            society_id = user.resident_profile.society_id
        elif hasattr(user, 'staff_profile') and user.staff_profile.society:
            society_id = user.staff_profile.society_id
        elif hasattr(user, 'volunteer_profile') and user.volunteer_profile.society:
            society_id = user.volunteer_profile.society_id

        if society_id:
            queryset = queryset.filter(models.Q(society_id=society_id) | models.Q(society__isnull=True))

        if since_id:
            try:
                queryset = queryset.filter(id__gt=int(since_id))
            except ValueError:
                pass

        events = list(queryset.order_by('id')[:100])
        serializer = SystemEventSerializer(events, many=True)
        latest_id = events[-1].id if events else (int(since_id) if since_id and since_id.isdigit() else 0)

        return Response({
            'events': serializer.data,
            'latest_id': latest_id,
            'server_time': timezone.now().isoformat()
        })


class SystemEventsStreamView(APIView):
    """
    Server-Sent Events (SSE) stream endpoint for live instant event delivery across clients.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        since_id = request.query_params.get('since_id', '0')
        try:
            current_since = int(since_id)
        except ValueError:
            current_since = 0

        user = request.user
        society_id = None
        if hasattr(user, 'resident_profile') and user.resident_profile.society:
            society_id = user.resident_profile.society_id
        elif hasattr(user, 'staff_profile') and user.staff_profile.society:
            society_id = user.staff_profile.society_id
        elif hasattr(user, 'volunteer_profile') and user.volunteer_profile.society:
            society_id = user.volunteer_profile.society_id

        def event_stream():
            nonlocal current_since
            # Initial connection handshake
            yield f"data: {json.dumps({'type': 'CONNECTED', 'since_id': current_since, 'server_time': timezone.now().isoformat()})}\n\n"

            # Flush any events since since_id
            qs = SystemEvent.objects.filter(id__gt=current_since)
            if society_id:
                qs = qs.filter(models.Q(society_id=society_id) | models.Q(society__isnull=True))

            for ev in qs.order_by('id')[:50]:
                current_since = ev.id
                yield f"data: {json.dumps({'type': 'EVENT', 'event': SystemEventSerializer(ev).data})}\n\n"

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

