from django.contrib import admin
from .models import Society, Block, Tower, Flat

class BlockInline(admin.TabularInline):
    model = Block
    extra = 1

class TowerInline(admin.TabularInline):
    model = Tower
    extra = 1

class FlatInline(admin.TabularInline):
    model = Flat
    extra = 2
    fields = ('flat_number', 'floor', 'occupancy_status', 'intercom_number')

@admin.register(Society)
class SocietyAdmin(admin.ModelAdmin):
    list_display = ('name', 'registration_code', 'city', 'state', 'emergency_desk_phone', 'is_active')
    list_filter = ('city', 'state', 'is_active')
    search_fields = ('name', 'registration_code', 'city', 'address_line1')
    inlines = [BlockInline, TowerInline]

@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ('name', 'society', 'created_at')
    list_filter = ('society',)
    search_fields = ('name', 'society__name')

@admin.register(Tower)
class TowerAdmin(admin.ModelAdmin):
    list_display = ('name', 'society', 'block', 'floors_count', 'has_elevator')
    list_filter = ('society', 'has_elevator')
    search_fields = ('name', 'society__name')
    inlines = [FlatInline]

@admin.register(Flat)
class FlatAdmin(admin.ModelAdmin):
    list_display = ('flat_number', 'tower', 'floor', 'society', 'occupancy_status')
    list_filter = ('society', 'occupancy_status', 'floor')
    search_fields = ('flat_number', 'tower__name', 'society__name')
