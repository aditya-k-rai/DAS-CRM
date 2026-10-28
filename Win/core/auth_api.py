"""
auth_api.py — DAS CRM Windows
Real HTTP authentication calls to the production backend.
Uses httpx in synchronous mode so it can be called from Qt threads safely.
"""

import os
import httpx

BACKEND_BASE = os.environ.get(
    "DASCRM_API_BASE_URL",
    "https://dascrm-backend.onrender.com/api/v1"
).rstrip("/")

# Ensure /api/v1 path is present
if "/api" not in BACKEND_BASE:
    BACKEND_BASE = BACKEND_BASE + "/api/v1"

TIMEOUT = 30  # seconds — Render free tier may cold-start


def _client() -> httpx.Client:
    return httpx.Client(timeout=TIMEOUT, follow_redirects=True)


# ─── Public Companies ────────────────────────────────────────────────────────

def fetch_public_companies() -> list[dict]:
    """
    GET /auth/public-companies
    Returns a list of {id, name, slug, ...} for the company dropdown.
    """
    try:
        with _client() as c:
            r = c.get(f"{BACKEND_BASE}/auth/public-companies")
            r.raise_for_status()
            data = r.json()
            if isinstance(data, list):
                return data
            # Some versions wrap in {companies: [...]}
            return data.get("companies", data.get("data", []))
    except Exception:
        return []


# ─── Workspace Login ─────────────────────────────────────────────────────────

def workspace_login(
    email: str,
    password: str,
    key: str,
    organization_id: str = "",
    company_name: str = "",
    selected_role: str = "",
) -> dict:
    """
    POST /auth/login
    Returns {"success": True, "user": {...}, "accessToken": "...", "companyName": "..."} on success
    or {"success": False, "message": "..."} on failure.
    """
    payload = {
        "email": email.strip().lower(),
        "password": password,
        "key": key.strip().upper(),
    }
    if organization_id:
        payload["organizationId"] = organization_id
    if company_name:
        payload["company"] = company_name
    if selected_role:
        payload["selectedRole"] = selected_role

    try:
        with _client() as c:
            r = c.post(f"{BACKEND_BASE}/auth/login", json=payload)
            body = r.json()
            if r.status_code in (200, 201):
                return {
                    "success": True,
                    "user": body.get("user") or {},
                    "accessToken": (
                        body.get("accessToken")
                        or body.get("access_token")
                        or body.get("token")
                        or ""
                    ),
                    "companyName": (
                        body.get("companyName")
                        or body.get("organizationName")
                        or body.get("organization", {}).get("name", "")
                        or company_name
                    ),
                    "organizationId": (
                        body.get("organizationId")
                        or body.get("companyId")
                        or (body.get("user") or {}).get("organizationId", "")
                        or organization_id
                    ),
                }
            else:
                msg = body.get("message") or body.get("error") or f"Login failed (HTTP {r.status_code})"
                return {"success": False, "message": msg}
    except httpx.ConnectError:
        return {
            "success": False,
            "message": "Cannot reach server. Check your internet connection or try again later.",
        }
    except httpx.TimeoutException:
        return {
            "success": False,
            "message": "Server took too long to respond. Try again in a moment.",
        }
    except Exception as exc:
        return {"success": False, "message": str(exc)}


# ─── Company Key Validation ───────────────────────────────────────────────────

def validate_company_key(key: str) -> dict:
    """
    GET /auth/validate-key?key=...
    Returns {valid, organizationId, organizationName, ...} or {valid: False, message: ...}
    """
    try:
        with _client() as c:
            r = c.get(f"{BACKEND_BASE}/auth/validate-key", params={"key": key.strip().upper()})
            body = r.json()
            if r.status_code == 200:
                return {
                    "valid": True,
                    "organizationId": body.get("organizationId", ""),
                    "organizationName": body.get("organizationName", ""),
                    "planTier": body.get("planTier", ""),
                    "memberLimit": body.get("memberLimit", 0),
                }
            return {"valid": False, "message": body.get("message", "Invalid key")}
    except Exception as exc:
        return {"valid": False, "message": str(exc)}


# ─── Staff Registration ───────────────────────────────────────────────────────

def staff_register(
    key: str,
    name: str,
    email: str,
    password: str,
) -> dict:
    """
    POST /auth/staff-register  (or staffLoginWithKey endpoint)
    Creates a staff account using the company invite key.
    """
    payload = {
        "key": key.strip().upper(),
        "name": name.strip(),
        "email": email.strip().lower(),
        "password": password,
    }
    try:
        with _client() as c:
            # Try dedicated staff-register endpoint first
            r = c.post(f"{BACKEND_BASE}/auth/staff-register", json=payload)
            if r.status_code == 404:
                # Fall back to staffLoginWithKey
                r = c.post(f"{BACKEND_BASE}/auth/staff-login-with-key", json=payload)
            body = r.json()
            if r.status_code in (200, 201):
                return {
                    "success": True,
                    "user": body.get("user") or {},
                    "accessToken": (
                        body.get("accessToken")
                        or body.get("access_token")
                        or body.get("token")
                        or ""
                    ),
                    "companyName": (
                        body.get("organizationName")
                        or body.get("companyName")
                        or ""
                    ),
                    "organizationId": (
                        body.get("organizationId")
                        or (body.get("user") or {}).get("organizationId", "")
                    ),
                }
            msg = body.get("message") or f"Registration failed (HTTP {r.status_code})"
            return {"success": False, "message": msg}
    except httpx.ConnectError:
        return {"success": False, "message": "Cannot reach server. Check your internet connection."}
    except httpx.TimeoutException:
        return {"success": False, "message": "Server timed out. Try again in a moment."}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


# ─── Forgot Password ──────────────────────────────────────────────────────────

def forgot_password_request(email: str) -> dict:
    """POST /auth/forgot-password — sends OTP to email."""
    try:
        with _client() as c:
            r = c.post(f"{BACKEND_BASE}/auth/forgot-password", json={"email": email.strip().lower()})
            body = r.json()
            if r.status_code in (200, 201):
                return {"success": True, "message": body.get("message", "OTP sent.")}
            return {"success": False, "message": body.get("message", f"Error (HTTP {r.status_code})")}
    except httpx.ConnectError:
        return {"success": False, "message": "Cannot reach server."}
    except Exception as exc:
        return {"success": False, "message": str(exc)}


def forgot_password_reset(email: str, otp: str, new_password: str) -> dict:
    """POST /auth/reset-password — verifies OTP and sets new password."""
    try:
        with _client() as c:
            r = c.post(
                f"{BACKEND_BASE}/auth/reset-password",
                json={"email": email.strip().lower(), "otp": otp.strip(), "newPassword": new_password},
            )
            body = r.json()
            if r.status_code in (200, 201):
                return {"success": True, "message": body.get("message", "Password reset.")}
            return {"success": False, "message": body.get("message", f"Error (HTTP {r.status_code})")}
    except httpx.ConnectError:
        return {"success": False, "message": "Cannot reach server."}
    except Exception as exc:
        return {"success": False, "message": str(exc)}

