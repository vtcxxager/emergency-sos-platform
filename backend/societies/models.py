"""
Society hierarchy models: Society, Block, Tower, and Flat.
Enforces multi-tenancy and data partitioning through strict Foreign Key relationships.
"""
from django.db import models
from django.core.validators import RegexValidator

phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
)

class Society(models.Model):
    """
    Top-level organizational tenant representing a residential gated community,
    apartment complex, or housing society.
    """
    name = models.CharField(max_length=255, db_index=True)
    registration_code = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Unique regulatory registration or society identifier."
    )
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    emergency_desk_phone = models.CharField(
        validators=[phone_regex],
        max_length=20,
        help_text="24/7 security or control room emergency contact number."
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Centroid GPS latitude of society gates/campus."
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
        help_text="Centroid GPS longitude of society gates/campus."
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'societies'
        verbose_name = 'Society'
        verbose_name_plural = 'Societies'
        ordering = ['name']
        indexes = [
            models.Index(fields=['city', 'is_active']),
            models.Index(fields=['registration_code']),
        ]

    def __str__(self):
        return f"{self.name} ({self.city})"


class Block(models.Model):
    """
    Sub-division or sector within a Society (e.g., Phase 1, Block A, Green Meadows Sector).
    Partitioned by Society foreign key.
    """
    society = models.ForeignKey(
        Society,
        on_delete=models.CASCADE,
        related_name='blocks',
        db_index=True
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blocks'
        verbose_name = 'Block'
        verbose_name_plural = 'Blocks'
        ordering = ['society', 'name']
        unique_together = [['society', 'name']]

    def __str__(self):
        return f"{self.society.name} - {self.name}"


class Tower(models.Model):
    """
    Specific building structure or tower within a block or directly within a society.
    """
    society = models.ForeignKey(
        Society,
        on_delete=models.CASCADE,
        related_name='towers',
        db_index=True
    )
    block = models.ForeignKey(
        Block,
        on_delete=models.CASCADE,
        related_name='towers',
        null=True,
        blank=True,
        db_index=True
    )
    name = models.CharField(max_length=100, help_text="Tower name/number e.g. 'Tower 1', 'Aster Wing'")
    floors_count = models.PositiveIntegerField(default=1)
    has_elevator = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'towers'
        verbose_name = 'Tower'
        verbose_name_plural = 'Towers'
        ordering = ['society', 'name']
        unique_together = [['society', 'name']]

    def __str__(self):
        block_prefix = f" [{self.block.name}]" if self.block else ""
        return f"{self.society.name}{block_prefix} - {self.name}"


class Flat(models.Model):
    """
    Individual residential unit within a Tower.
    Retains direct society FK for efficient society-level partition queries.
    """
    class OccupancyStatus(models.TextChoices):
        OCCUPIED = 'OCCUPIED', 'Occupied'
        VACANT = 'VACANT', 'Vacant'
        UNDER_MAINTENANCE = 'UNDER_MAINTENANCE', 'Under Maintenance'

    society = models.ForeignKey(
        Society,
        on_delete=models.CASCADE,
        related_name='flats',
        db_index=True,
        help_text="Direct link for fast multi-tenant security partitioning."
    )
    tower = models.ForeignKey(
        Tower,
        on_delete=models.CASCADE,
        related_name='flats',
        db_index=True
    )
    flat_number = models.CharField(max_length=30, help_text="Unit number, e.g. '402', '12B', 'Villa 5'")
    floor = models.IntegerField(default=1)
    intercom_number = models.CharField(max_length=30, blank=True)
    occupancy_status = models.CharField(
        max_length=25,
        choices=OccupancyStatus.choices,
        default=OccupancyStatus.OCCUPIED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'flats'
        verbose_name = 'Flat'
        verbose_name_plural = 'Flats'
        ordering = ['tower', 'floor', 'flat_number']
        unique_together = [['tower', 'flat_number']]
        indexes = [
            models.Index(fields=['society', 'occupancy_status']),
        ]

    def save(self, *args, **kwargs):
        # Enforce consistency: flat's society must match tower's society
        if self.tower and not self.society_id:
            self.society = self.tower.society
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tower.name} - Flat {self.flat_number}"
