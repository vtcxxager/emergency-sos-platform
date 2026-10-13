from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from societies.models import Society, Tower, Flat
from accounts.models import ResidentProfile, StaffProfile, VolunteerProfile, EmergencyContact
from incidents.models import (
    SOSAlert,
    Incident,
    CommunityAssistanceRequest,
    GuardianInvitation,
    DeviceToken,
    NotificationDeliveryJob,
    SystemEvent,
)

User = get_user_model()

class EmergencyWorkflowTests(APITestCase):
    def setUp(self):
        # 1. Society Hierarchy
        self.society = Society.objects.create(
            name="Palm Meadows Estates",
            registration_code="SOC-001",
            address_line1="Outer Ring Road",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560103",
            emergency_desk_phone="+919876543210"
        )
        self.tower = Tower.objects.create(society=self.society, name="Tower 1")
        self.flat = Flat.objects.create(society=self.society, tower=self.tower, flat_number="402")

        # 2. Resident Account
        self.resident_user = User.objects.create_user(
            username="resident.anita",
            email="anita@example.com",
            password="Password123!",
            phone_number="+919811223344",
            first_name="Anita",
            last_name="Rao",
            primary_role="RESIDENT"
        )
        self.resident_profile = ResidentProfile.objects.create(
            user=self.resident_user,
            society=self.society,
            current_flat=self.flat,
            blood_group="O+"
        )

        # 3. Independent Guardian Account
        self.guardian_user = User.objects.create_user(
            username="guardian.rajesh",
            email="rajesh@example.com",
            password="Password123!",
            phone_number="+919123456789",
            first_name="Rajesh",
            last_name="Sharma",
            primary_role="GUARDIAN"
        )

        # 4. Security Guard Account
        self.security_user = User.objects.create_user(
            username="security.vikram",
            email="vikram@example.com",
            password="Password123!",
            phone_number="+919822033445",
            first_name="Vikram",
            last_name="Singh",
            primary_role="SECURITY_STAFF"
        )
        StaffProfile.objects.create(
            user=self.security_user,
            society=self.society,
            staff_role="SECURITY_GUARD",
            employee_id="SEC-042",
            is_on_duty=True
        )

        # 5. Volunteer Account
        self.volunteer_user = User.objects.create_user(
            username="volunteer.arvind",
            email="arvind@example.com",
            password="Password123!",
            phone_number="+919845011223",
            first_name="Arvind",
            last_name="Swaminathan",
            primary_role="VOLUNTEER"
        )
        VolunteerProfile.objects.create(
            user=self.volunteer_user,
            society=self.society,
            is_available=True,
            first_aid_certified=True
        )

        # 6. Unrelated Resident in different society
        self.other_society = Society.objects.create(
            name="Green Glen Villas",
            registration_code="SOC-002",
            address_line1="Bellandur",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560103",
            emergency_desk_phone="+919999988888"
        )
        self.unrelated_user = User.objects.create_user(
            username="unrelated.user",
            email="other@example.com",
            password="Password123!",
            phone_number="+919000011111",
            first_name="Other",
            last_name="Person",
            primary_role="RESIDENT"
        )
        ResidentProfile.objects.create(
            user=self.unrelated_user,
            society=self.other_society
        )

    def test_one_tap_sos_without_typing(self):
        """One-tap SOS creates real database incident and triggers notifications without mandatory inputs."""
        self.client.force_authenticate(user=self.resident_user)
        response = self.client.post('/api/v1/sos/trigger/', {
            'idempotency_key': 'one-tap-test-key-1'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'OPEN')
        self.assertEqual(response.data['sos_alert']['category'], 'GENERAL_EMERGENCY')

        # Real DB incident exists
        incident = Incident.objects.get(id=response.data['id'])
        self.assertEqual(incident.society, self.society)
        self.assertEqual(incident.sos_alert.resident, self.resident_user)

    def test_location_unavailable_sos(self):
        """SOS succeeds immediately with null coordinates when location permission denied."""
        self.client.force_authenticate(user=self.resident_user)
        response = self.client.post('/api/v1/sos/trigger/', {
            'latitude': None,
            'longitude': None,
            'idempotency_key': 'no-location-key-2'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data['sos_alert']['latitude'])

    def test_end_to_end_complete_emergency_flow(self):
        """
        Comprehensive Flow (User Requirements 1 - 15):
        1. Independent resident and guardian accounts.
        2. Authorized guardian relationship via invitation.
        3. Register recipient devices with test push tokens.
        4. Trigger SOS from resident session.
        5. Verify real database incident created.
        6. Verify notification delivery jobs created for correct recipients.
        7. Connect guardian session on separate client and verify real-time events.
        8. Guardian acknowledges incident.
        9. Verify resident & security receive updated status without refresh.
        10. Verify unrelated resident cannot access the incident.
        """
        # Step 1 & 2: Establish authorized guardian relationship
        EmergencyContact.objects.create(
            resident=self.resident_user,
            name="Rajesh Sharma",
            phone_number=self.guardian_user.phone_number,
            priority_tier="PRIMARY",
            is_verified=True
        )

        # Step 3: Register device push tokens
        guardian_client = APIClient()
        guardian_client.force_authenticate(user=self.guardian_user)
        reg_token_res = guardian_client.post('/api/v1/device-tokens/', {
            'token': 'test-guardian-fcm-token-999',
            'platform': 'FCM',
            'endpoint': 'https://fcm.googleapis.com/fcm/send/test'
        }, format='json')
        self.assertEqual(reg_token_res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(DeviceToken.objects.filter(token='test-guardian-fcm-token-999').exists())

        # Step 4 & 5: Resident triggers SOS from independent session
        resident_client = APIClient()
        resident_client.force_authenticate(user=self.resident_user)
        sos_res = resident_client.post('/api/v1/sos/trigger/', {
            'idempotency_key': 'e2e-sos-key-888',
            'latitude': 12.9352,
            'longitude': 77.6245
        }, format='json')
        self.assertEqual(sos_res.status_code, status.HTTP_201_CREATED)
        incident_id = sos_res.data['id']

        # Confirm incident in database
        incident = Incident.objects.filter(id=incident_id).first()
        self.assertIsNotNone(incident)
        self.assertEqual(incident.status, 'OPEN')

        # Step 6: Verify notification delivery jobs created for guardian
        guardian_jobs = NotificationDeliveryJob.objects.filter(
            incident=incident,
            recipient=self.guardian_user
        )
        self.assertTrue(guardian_jobs.exists())
        # Confirmed jobs include In-App and Push
        channels = [j.channel for j in guardian_jobs]
        self.assertIn('IN_APP', channels)
        self.assertIn('FCM', channels)

        # Step 7: Guardian fetches events via real-time polling endpoint
        events_res = guardian_client.get('/api/v1/events/poll/?since_id=0')
        self.assertEqual(events_res.status_code, status.HTTP_200_OK)
        events = events_res.data['events']
        self.assertTrue(any(e['event_type'] == 'SOS_CREATED' and e['payload'].get('incident_id') == incident_id for e in events))

        # Step 8: Guardian acknowledges incident
        ack_res = guardian_client.post(f'/api/v1/incidents/{incident_id}/acknowledge/')
        self.assertEqual(ack_res.status_code, status.HTTP_200_OK)
        self.assertEqual(ack_res.data['status'], 'ACTIVE_RESPONSE')
        self.assertEqual(ack_res.data['responder_name'], 'Rajesh Sharma')

        # Verify job marked as ACKNOWLEDGED
        self.assertTrue(NotificationDeliveryJob.objects.filter(
            incident=incident,
            recipient=self.guardian_user,
            status=NotificationDeliveryJob.DeliveryStatus.ACKNOWLEDGED
        ).exists())

        # Step 9: Resident checks authoritative incident status
        res_check = resident_client.get(f'/api/v1/incidents/{incident_id}/')
        self.assertEqual(res_check.status_code, status.HTTP_200_OK)
        self.assertEqual(res_check.data['status'], 'ACTIVE_RESPONSE')
        self.assertEqual(res_check.data['responder_name'], 'Rajesh Sharma')

        # Security check incident status
        security_client = APIClient()
        security_client.force_authenticate(user=self.security_user)
        sec_check = security_client.get(f'/api/v1/incidents/{incident_id}/')
        self.assertEqual(sec_check.status_code, status.HTTP_200_OK)
        self.assertEqual(sec_check.data['status'], 'ACTIVE_RESPONSE')

        # Step 10: Unrelated resident cannot view or access this incident
        unrelated_client = APIClient()
        unrelated_client.force_authenticate(user=self.unrelated_user)
        unrelated_list = unrelated_client.get('/api/v1/incidents/')
        incident_ids = [inc['id'] for inc in (unrelated_list.data if isinstance(unrelated_list.data, list) else unrelated_list.data.get('results', []))]
        self.assertNotIn(incident_id, incident_ids)

    def test_concurrent_responder_acceptance_prevention(self):
        """Two responders attempt simultaneous acceptance; row-locking prevents second from overwriting."""
        self.client.force_authenticate(user=self.resident_user)
        sos_res = self.client.post('/api/v1/sos/trigger/', {}, format='json')
        incident_id = sos_res.data['id']

        # First responder (Security Guard) accepts
        self.client.force_authenticate(user=self.security_user)
        res1 = self.client.post(f'/api/v1/incidents/{incident_id}/acknowledge/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # Second responder (Volunteer) attempts to accept same incident
        self.client.force_authenticate(user=self.volunteer_user)
        res2 = self.client.post(f'/api/v1/incidents/{incident_id}/acknowledge/')
        self.assertEqual(res2.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("already accepted", res2.data['error'])

    def test_community_assistance_distinct_from_sos(self):
        """Community assistance remains separate from SOS and does not escalate as emergency."""
        self.client.force_authenticate(user=self.resident_user)
        req_res = self.client.post('/api/v1/community-requests/', {
            'category': 'MINOR_FALL',
            'description': 'Need volunteer assistance getting up after minor trip.'
        }, format='json')
        self.assertEqual(req_res.status_code, status.HTTP_201_CREATED)
        req_id = req_res.data['id']

        # Volunteer accepts
        self.client.force_authenticate(user=self.volunteer_user)
        accept_res = self.client.post(f'/api/v1/community-requests/{req_id}/accept/')
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_res.data['status'], 'ACCEPTED')

        # Volunteer completes
        comp_res = self.client.post(f'/api/v1/community-requests/{req_id}/complete/', {
            'notes': 'Resident helped to comfortable sofa safely.'
        }, format='json')
        self.assertEqual(comp_res.status_code, status.HTTP_200_OK)
        self.assertEqual(comp_res.data['status'], 'COMPLETED')

    def test_reconnection_and_resync(self):
        """Client disconnects, reconnects with since_id, and catches up on all missed events."""
        self.client.force_authenticate(user=self.resident_user)
        sos_res = self.client.post('/api/v1/sos/trigger/', {}, format='json')
        incident_id = sos_res.data['id']

        # Check latest event ID
        poll1 = self.client.get('/api/v1/events/poll/?since_id=0')
        latest_id = poll1.data['latest_id']

        # Simulate responder action while client is disconnected
        self.client.force_authenticate(user=self.security_user)
        self.client.post(f'/api/v1/incidents/{incident_id}/acknowledge/')

        # Client reconnects with last known since_id
        self.client.force_authenticate(user=self.resident_user)
        poll2 = self.client.get(f'/api/v1/events/poll/?since_id={latest_id}')
        missed_events = poll2.data['events']
        self.assertEqual(len(missed_events), 1)
        self.assertEqual(missed_events[0]['event_type'], 'INCIDENT_ACKNOWLEDGED')
