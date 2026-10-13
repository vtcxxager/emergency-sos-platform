from rest_framework import serializers
from .models import Society, Block, Tower, Flat

class FlatSerializer(serializers.ModelSerializer):
    tower_name = serializers.CharField(source='tower.name', read_only=True)
    society_name = serializers.CharField(source='society.name', read_only=True)

    class Meta:
        model = Flat
        fields = [
            'id',
            'society',
            'society_name',
            'tower',
            'tower_name',
            'flat_number',
            'floor',
            'intercom_number',
            'occupancy_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class TowerSerializer(serializers.ModelSerializer):
    flats_count = serializers.IntegerField(source='flats.count', read_only=True)
    block_name = serializers.CharField(source='block.name', read_only=True, allow_null=True)

    class Meta:
        model = Tower
        fields = [
            'id',
            'society',
            'block',
            'block_name',
            'name',
            'floors_count',
            'has_elevator',
            'flats_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

class BlockSerializer(serializers.ModelSerializer):
    towers_count = serializers.IntegerField(source='towers.count', read_only=True)

    class Meta:
        model = Block
        fields = [
            'id',
            'society',
            'name',
            'description',
            'towers_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

class SocietySerializer(serializers.ModelSerializer):
    total_blocks = serializers.IntegerField(source='blocks.count', read_only=True)
    total_towers = serializers.IntegerField(source='towers.count', read_only=True)
    total_flats = serializers.IntegerField(source='flats.count', read_only=True)

    class Meta:
        model = Society
        fields = [
            'id',
            'name',
            'registration_code',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'emergency_desk_phone',
            'latitude',
            'longitude',
            'is_active',
            'total_blocks',
            'total_towers',
            'total_flats',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
