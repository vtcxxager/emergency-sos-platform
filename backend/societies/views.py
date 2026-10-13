from rest_framework import viewsets, permissions, filters
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Society, Block, Tower, Flat
from .serializers import (
    SocietySerializer,
    BlockSerializer,
    TowerSerializer,
    FlatSerializer,
)

@extend_schema_view(
    list=extend_schema(summary="List residential societies"),
    retrieve=extend_schema(summary="Retrieve society details"),
)
class SocietyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing and retrieving registered residential societies.
    """
    queryset = Society.objects.filter(is_active=True).prefetch_related('blocks', 'towers', 'flats')
    serializer_class = SocietySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'city', 'registration_code']

@extend_schema_view(
    list=extend_schema(summary="List society blocks"),
    retrieve=extend_schema(summary="Retrieve block details"),
)
class BlockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for blocks within a society.
    """
    serializer_class = BlockSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Block.objects.select_related('society').prefetch_related('towers')
        society_id = self.request.query_params.get('society')
        if society_id:
            queryset = queryset.filter(society_id=society_id)
        return queryset

@extend_schema_view(
    list=extend_schema(summary="List towers/wings"),
    retrieve=extend_schema(summary="Retrieve tower details"),
)
class TowerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for towers within a society/block.
    """
    serializer_class = TowerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Tower.objects.select_related('society', 'block').prefetch_related('flats')
        society_id = self.request.query_params.get('society')
        block_id = self.request.query_params.get('block')
        if society_id:
            queryset = queryset.filter(society_id=society_id)
        if block_id:
            queryset = queryset.filter(block_id=block_id)
        return queryset

@extend_schema_view(
    list=extend_schema(summary="List residential flats"),
    retrieve=extend_schema(summary="Retrieve flat details"),
)
class FlatViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for flats within a tower.
    """
    serializer_class = FlatSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Flat.objects.select_related('society', 'tower')
        society_id = self.request.query_params.get('society')
        tower_id = self.request.query_params.get('tower')
        if society_id:
            queryset = queryset.filter(society_id=society_id)
        if tower_id:
            queryset = queryset.filter(tower_id=tower_id)
        return queryset
