class PrivateApiMiddleware:
    """Empêche les caches intermédiaires de conserver des réponses personnelles."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith(("/api/v1/auth/", "/api/v1/attempts/")):
            response["Cache-Control"] = "private, no-store"
            response["Vary"] = ", ".join(filter(None, [response.get("Vary"), "Cookie"]))
        return response
