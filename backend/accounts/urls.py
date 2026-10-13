from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, CurrentUserProfileView, EmergencyContactViewSet

router = DefaultRouter()
router.register(r'contacts', EmergencyContactViewSet, basename='emergency-contact')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', TokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', CurrentUserProfileView.as_view(), name='current-user-profile'),
    path('', include(router.urls)),
]
