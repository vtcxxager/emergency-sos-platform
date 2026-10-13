import django.core.validators
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Society',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(db_index=True, max_length=255)),
                ('registration_code', models.CharField(db_index=True, help_text='Unique regulatory registration or society identifier.', max_length=64, unique=True)),
                ('address_line1', models.CharField(max_length=255)),
                ('address_line2', models.CharField(blank=True, max_length=255)),
                ('city', models.CharField(db_index=True, max_length=100)),
                ('state', models.CharField(max_length=100)),
                ('postal_code', models.CharField(max_length=20)),
                ('emergency_desk_phone', models.CharField(help_text='24/7 security or control room emergency contact number.', max_length=20, validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')])),
                ('latitude', models.DecimalField(blank=True, decimal_places=7, help_text='Centroid GPS latitude of society gates/campus.', max_digits=10, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=7, help_text='Centroid GPS longitude of society gates/campus.', max_digits=10, null=True)),
                ('is_active', models.BooleanField(db_index=True, default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Society',
                'verbose_name_plural': 'Societies',
                'db_table': 'societies',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Block',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('society', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='blocks', to='societies.society')),
            ],
            options={
                'verbose_name': 'Block',
                'verbose_name_plural': 'Blocks',
                'db_table': 'blocks',
                'ordering': ['society', 'name'],
                'unique_together': {('society', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Tower',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text="Tower name/number e.g. 'Tower 1', 'Aster Wing'", max_length=100)),
                ('floors_count', models.PositiveIntegerField(default=1)),
                ('has_elevator', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('block', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='towers', to='societies.block')),
                ('society', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='towers', to='societies.society')),
            ],
            options={
                'verbose_name': 'Tower',
                'verbose_name_plural': 'Towers',
                'db_table': 'towers',
                'ordering': ['society', 'name'],
                'unique_together': {('society', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Flat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('flat_number', models.CharField(help_text="Unit number, e.g. '402', '12B', 'Villa 5'", max_length=30)),
                ('floor', models.IntegerField(default=1)),
                ('intercom_number', models.CharField(blank=True, max_length=30)),
                ('occupancy_status', models.CharField(choices=[('OCCUPIED', 'Occupied'), ('VACANT', 'Vacant'), ('UNDER_MAINTENANCE', 'Under Maintenance')], default='OCCUPIED', max_length=25)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('society', models.ForeignKey(help_text='Direct link for fast multi-tenant security partitioning.', on_delete=django.db.models.deletion.CASCADE, related_name='flats', to='societies.society')),
                ('tower', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='flats', to='societies.tower')),
            ],
            options={
                'verbose_name': 'Flat',
                'verbose_name_plural': 'Flats',
                'db_table': 'flats',
                'ordering': ['tower', 'floor', 'flat_number'],
                'unique_together': {('tower', 'flat_number')},
            },
        ),
        migrations.AddIndex(
            model_name='society',
            index=models.Index(fields=['city', 'is_active'], name='societies_city_9ea22e_idx'),
        ),
        migrations.AddIndex(
            model_name='society',
            index=models.Index(fields=['registration_code'], name='societies_registr_645543_idx'),
        ),
        migrations.AddIndex(
            model_name='flat',
            index=models.Index(fields=['society', 'occupancy_status'], name='flats_society_9fe43a_idx'),
        ),
    ]
