"""Diagnostic minimal du service. Auteur : Jonathan Kakesa."""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer
class HealthView(APIView):
    """Retourne un état public sans secrets ni détails d'infrastructure."""
    permission_classes = [AllowAny]
    authentication_classes = []
    @extend_schema(responses=inline_serializer(name="HealthResponse", fields={"status": serializers.CharField(), "service": serializers.CharField()}))
    def get(self, request):
        return Response({"status": "ok", "service": "fluentia-api"})
