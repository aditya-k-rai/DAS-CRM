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

TIMEOUT = 60  # seconds — Render free tier may cold-start


def _client() -> httpx.Client:
    return httpx.Client(timeout=TIMEOUT, follow_redirects=True)


def _extract_msg(body: dict, default: str = "Request failed") -> str:
    """Extract clean error string from API response body, handling lists."""
    if not isinstance(body, dict):
        return default
    msg = body.get("message") or body.get("error") or default
    if isinstance(msg, list):
        return "; ".join(str(m) for m in msg)
    return str(msg)


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
    clean_email = email.strip().lower()
    clean_key = key.strip().upper()

    def _attempt(include_org: bool):
        payload = {
            "email": clean_email,
            "password": password,
            "key": clean_key,
        }
        if include_org and organization_id:
            payload["organizationId"] = organization_id
        if include_org and company_name:
            payload["company"] = company_name
        if selected_role:
            payload["selectedRole"] = selected_role

        with _client() as c:
            r = c.post(f"{BACKEND_BASE}/auth/login", json=payload)
            body = r.json() if r.content else {}
            return r, body

    try:
        r, body = _attempt(include_org=True)

        # If rejected specifically because key does not belong to the selected dropdown org,
        # retry automatically without organizationId so backend auto-resolves workspace from key.
        if r.status_code == 401 and organization_id:
            err_text = _extract_msg(body, "")
            if "does not belong" in err_text.lower() or "no user found" in err_text.lower():
                r, body = _attempt(include_org=False)

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
            msg = _extract_msg(body, f"Login failed (HTTP {r.status_code})")
            return {"success": False, "message": msg}
    except httpx.ConnectError:
        return {
            "success": False,
            "message": "Cannot reach server. Check your internet connection or try again later.",
        }
    except httpx.TimeoutException:
        return {
            "success": False,
            "message": "Server took too long to respond. Render cloud instance may be waking up, please retry.",
        }
    except Exception as exc:
        return {"success": False, "message": str(exc)}


# ─── Company Key Validation ───────────────────────────────────────────────────

def validate_company_key(key: str) -> dict:
    """
    POST /auth/validate-user-key (and fallback to POST /auth/validate-company-key)
    Returns {valid, organizationId, organizationName, ...} or {valid: False, message: ...}
    """
    clean_key = key.strip().upper()
    try:
        with _client() as c:
            # First try validate-user-key (staff member joining active company workspace)
            r = c.post(f"{BACKEND_BASE}/auth/validate-user-key", json={"key": clean_key})
            if r.status_code == 200:
                body = r.json()
                if body.get("valid"):
                    return {
                        "valid": True,
                        "organizationId": body.get("organizationId", ""),
                        "organizationName": body.get("organizationName", ""),
                        "keyType": body.get("keyType", "COMPANY_KEY"),
                        "expiresAt": body.get("expiresAt", ""),
                    }
                else:
                    return {"valid": False, "message": _extract_msg(body, "Invalid key.")}

            # Fallback to validate-company-key (unlinked company registration key preview)
            r2 = c.post(f"{BACKEND_BASE}/auth/validate-company-key", json={"key": clean_key})
            if r2.status_code == 200:
                body2 = r2.json()
                if body2.get("valid"):
                    return {
                        "valid": True,
                        "organizationId": body2.get("organizationId", ""),
                        "organizationName": body2.get("organizationName", ""),
                        "planTier": body2.get("planTier", ""),
                        "memberLimit": body2.get("memberLimit", 0),
                    }
                return {"valid": False, "message": _extract_msg(body2, "Invalid key.")}
            return {"valid": False, "message": _extract_msg(r.json() if r.content else {}, "Invalid key.")}
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
    POST /auth/staff-register (or staffLoginWithKey endpoint)
    Creates a staff account using the company invite key.
    """
    clean_key = key.strip().upper()
    payload = {
        "userKey": clean_key,
        "key": clean_key,
        "name": name.strip(),
        "email": email.strip().lower(),
        "password": password,
    }
    try:
        with _client() as c:
            r = c.post(f"{BACKEND_BASE}/auth/staff-register", json=payload)
            if r.status_code == 404:
                # Fall back to legacy staff-login-with-key
                r = c.post(f"{BACKEND_BASE}/auth/staff-login-with-key", json=payload)
            body = r.json() if r.content else {}
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
            msg = _extract_msg(body, f"Registration failed (HTTP {r.status_code})")
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
            body = r.json() if r.content else {}
            if r.status_code in (200, 201):
                return {"success": True, "message": _extract_msg(body, "OTP sent successfully.")}
            return {"success": False, "message": _extract_msg(body, f"Error (HTTP {r.status_code})")}
    except httpx.ConnectError:
        return {"success": False, "message": "Cannot reach server. Check your internet connection."}
    except httpx.TimeoutException:
        return {"success": False, "message": "Server timed out. Try again in a moment."}
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
            body = r.json() if r.content else {}
            if r.status_code in (200, 201):
                return {"success": True, "message": _extract_msg(body, "Password reset successfully.")}
            return {"success": False, "message": _extract_msg(body, f"Error (HTTP {r.status_code})")}
    except httpx.ConnectError:
        return {"success": False, "message": "Cannot reach server. Check your internet connection."}
    except httpx.TimeoutException:
        return {"success": False, "message": "Server timed out. Try again in a moment."}
    except Exception as exc:
        return {"success": False, "message": str(exc)}
    except httpx.ConnectError:
        return {"success": False, "message": "Cannot reach server."}
    except Exception as exc:
        return {"success": False, "message": str(exc)}

