from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SOSTriggerView,
    IncidentViewSet,
    NotificationViewSet,
    CommunityAssistanceRequestViewSet,
    GuardianInvitationViewSet,
    DeviceTokenViewSet,
    NotificationJobViewSet,
    SystemEventsPollView,
    SystemEventsStreamView,
)

router = DefaultRouter()
router.register(r'incidents', IncidentViewSet, basename='incident')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'notification-jobs', NotificationJobViewSet, basename='notification-job')
router.register(r'device-tokens', DeviceTokenViewSet, basename='device-token')
router.register(r'community-requests', CommunityAssistanceRequestViewSet, basename='community-request')
router.register(r'guardian-invitations', GuardianInvitationViewSet, basename='guardian-invitation')

urlpatterns = [
    path('sos/trigger/', SOSTriggerView.as_view(), name='sos-trigger'),
    path('events/poll/', SystemEventsPollView.as_view(), name='events-poll'),
    path('events/stream/', SystemEventsStreamView.as_view(), name='events-stream'),
    path('', include(router.urls)),
]

