"""Recette HTTP de développement Compose ; aucun mot de passe ou jeton affiché."""

import http.cookiejar
import json
import urllib.error
import urllib.request

base = "http://127.0.0.1:3000/api/v1/"
client = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
)
results = []


def request(path, method="GET", data=None, csrf=None, expected=200):
    headers = {"Origin": "http://localhost:3000", "Content-Type": "application/json"}
    if csrf:
        headers["X-CSRFToken"] = csrf
    req = urllib.request.Request(
        base + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers=headers,
        method=method,
    )
    try:
        response = client.open(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    assert response.code == expected, (path, response.code, expected)
    payload = response.read()
    results.append({"path": path, "method": method, "status": response.code})
    return (
        json.loads(payload)
        if response.headers.get_content_type() == "application/json"
        else {}
    )


assert request("health/")["status"] == "ok"
csrf = request("auth/csrf/")["csrf_token"]
request(
    "auth/register/",
    "POST",
    {
        "email": "compose-fixture@example.test",
        "password": "Compose!Lecture-7294",
        "display_name": "Recette Compose",
    },
    csrf=csrf,
    expected=202,
)
request(
    "auth/login/",
    "POST",
    {"email": "compose-fixture@example.test", "password": "Compose!Lecture-7294"},
    csrf=csrf,
)
profile = request("auth/profile/")
assert (
    profile["email"] == "compose-fixture@example.test"
    and profile["email_verified"] is False
)
request("auth/logout/", "POST", {}, expected=403)
csrf = request("auth/csrf/")["csrf_token"]
request("auth/logout/", "POST", {}, csrf=csrf)
request("auth/profile/", expected=403)
print(
    json.dumps(
        {
            "notice": "Base Compose éphémère de recette ; aucun courrier externe.",
            "requests": results,
        }
    )
)
