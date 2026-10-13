from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SocietyViewSet, BlockViewSet, TowerViewSet, FlatViewSet

router = DefaultRouter()
router.register(r'societies', SocietyViewSet, basename='society')
router.register(r'blocks', BlockViewSet, basename='block')
router.register(r'towers', TowerViewSet, basename='tower')
router.register(r'flats', FlatViewSet, basename='flat')

urlpatterns = [
    path('', include(router.urls)),
]
