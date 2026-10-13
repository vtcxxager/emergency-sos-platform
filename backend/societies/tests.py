from django.test import TestCase
from django.db import IntegrityError
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Society, Block, Tower, Flat

class SocietyHierarchyModelTests(TestCase):
    def setUp(self):
        self.society_a = Society.objects.create(
            name="Green Glen Heights",
            registration_code="GGH-2026-A",
            address_line1="Bellandur Main Road",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560103",
            emergency_desk_phone="+919800112233"
        )
        self.society_b = Society.objects.create(
            name="Silver Spring Villas",
            registration_code="SSV-2026-B",
            address_line1="Whitefield EPIP",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560066",
            emergency_desk_phone="+919800112244"
        )

    def test_society_creation(self):
        self.assertEqual(self.society_a.name, "Green Glen Heights")
        self.assertTrue(self.society_a.is_active)

    def test_block_uniqueness_within_society(self):
        Block.objects.create(society=self.society_a, name="Block 1")
        # Same block name in different society is allowed:
        Block.objects.create(society=self.society_b, name="Block 1")

        # Duplicate block name in same society must fail:
        with self.assertRaises(IntegrityError):
            Block.objects.create(society=self.society_a, name="Block 1")

    def test_tower_and_flat_partitioning(self):
        tower_a = Tower.objects.create(society=self.society_a, name="Tower Alpha", floors_count=12)
        flat_401 = Flat.objects.create(society=self.society_a, tower=tower_a, flat_number="401", floor=4)

        self.assertEqual(flat_401.society, self.society_a)
        self.assertEqual(flat_401.tower, tower_a)

        # Unique flat number per tower
        with self.assertRaises(IntegrityError):
            Flat.objects.create(society=self.society_a, tower=tower_a, flat_number="401", floor=4)

class SocietyAPITests(APITestCase):
    def setUp(self):
        self.soc1 = Society.objects.create(
            name="Sobha Silicon Oasis",
            registration_code="SSO-001",
            address_line1="Electronic City Phase 1",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560100",
            emergency_desk_phone="+919777888999"
        )
        self.soc2 = Society.objects.create(
            name="Prestige Lakeside",
            registration_code="PLS-002",
            address_line1="Varthur Lake Road",
            city="Bengaluru",
            state="Karnataka",
            postal_code="560087",
            emergency_desk_phone="+919777888111"
        )
        self.tower1 = Tower.objects.create(society=self.soc1, name="Tower A")
        self.flat1 = Flat.objects.create(society=self.soc1, tower=self.tower1, flat_number="101", floor=1)

    def test_list_societies(self):
        res = self.client.get('/api/v1/societies/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results'] if 'results' in res.data else res.data), 2)

    def test_filter_flats_by_society(self):
        res = self.client.get(f'/api/v1/flats/?society={self.soc1.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data['results'] if 'results' in res.data else res.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['flat_number'], '101')
