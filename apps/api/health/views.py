"""Diagnostic minimal du service. Auteur : Jonathan Kakesa."""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
class HealthView(APIView):
    """Retourne un état public sans secrets ni détails d'infrastructure."""
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        return Response({"status": "ok", "service": "fluentia-api"})
