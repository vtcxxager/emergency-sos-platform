from rest_framework import serializers

class DatabaseHealthSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['connected', 'disconnected', 'error'])
    vendor = serializers.CharField()
    database_name = serializers.CharField()
    latency_ms = serializers.FloatField(required=False)
    server_version = serializers.CharField(required=False, allow_null=True)
    error = serializers.CharField(required=False, allow_null=True)

class ServiceStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    details = serializers.CharField(required=False)

class HealthCheckResponseSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['healthy', 'degraded', 'unhealthy'])
    platform = serializers.CharField(default="Community Emergency Response Platform")
    version = serializers.CharField(default="1.0.0")
    timestamp = serializers.DateTimeField()
    environment = serializers.CharField()
    database = DatabaseHealthSerializer()
    services = serializers.DictField(child=serializers.CharField())
