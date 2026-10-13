from unittest.mock import patch
from django.urls import reverse
from django.db import DatabaseError
from rest_framework import status
from rest_framework.test import APITestCase

class HealthCheckAPITests(APITestCase):
    """
    Test suite for System and Database Health Check API.
    """

    def setUp(self):
        self.health_url = reverse('health-check')

    def test_health_check_endpoint_accessible(self):
        """Verify GET /api/v1/health/ is accessible without authentication."""
        response = self.client.get(self.health_url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('status', response.data)
        self.assertIn('database', response.data)
        self.assertIn('timestamp', response.data)
        self.assertIn('services', response.data)

    def test_health_check_payload_structure(self):
        """Verify response conforms to expected health check schema."""
        response = self.client.get(self.health_url)
        db_info = response.data['database']
        self.assertIn('status', db_info)
        self.assertIn('vendor', db_info)
        self.assertIn('database_name', db_info)

    @patch('django.db.connection.cursor')
    def test_health_check_database_failure_returns_503(self, mock_cursor):
        """Verify 503 is returned when database connection throws an exception."""
        mock_cursor.side_effect = DatabaseError("Connection to PostgreSQL failed: timeout")
        response = self.client.get(self.health_url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data['status'], 'unhealthy')
        self.assertEqual(response.data['database']['status'], 'disconnected')
        self.assertIn('Connection to PostgreSQL failed', response.data['database']['error'])
