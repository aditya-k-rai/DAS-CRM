"""
api_client.py — DAS CRM Windows
Enhanced API Client with Backend Sync, Error Handling, and Real-time Updates
"""

import asyncio
import json
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime
import httpx

# ─────────────────────────────────────────────────────────────────────────────────────
# API RESPONSE MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class ApiResponse:
    """Standard API response wrapper"""
    success: bool
    data: Any = None
    message: str = ""
    errors: List[str] = None
    timestamp: str = ""

@dataclass
class SyncStatus:
    """Sync status indicator"""
    isSyncing: bool = False
    lastSyncedAt: Optional[str] = None
    syncProgress: int = 0  # 0-100
    pendingChanges: int = 0
    syncError: Optional[str] = None

@dataclass
class ValidationError:
    """Form field validation error"""
    field: str
    message: str
    code: str = "VALIDATION_ERROR"

# ─────────────────────────────────────────────────────────────────────────────────────
# API CLIENT WITH BACKEND INTEGRATION
# ─────────────────────────────────────────────────────────────────────────────────────

class DASCRMApiClient:
    """Enhanced API client with sync, validation, and error handling"""

    def __init__(self, base_url: str = "http://localhost:4000/api", timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.client = httpx.AsyncClient(base_url=base_url, timeout=timeout)
        self.auth_token: Optional[str] = None
        self.sync_status = SyncStatus()
        self.validation_errors: Dict[str, ValidationError] = {}

    async def login(self, email: str, password: str) -> ApiResponse:
        """Authenticate user and get auth token"""
        try:
            response = await self.client.post(
                "/auth/login",
                json={"email": email, "password": password}
            )
            data = response.json()
            if response.status_code == 200:
                self.auth_token = data.get("token")
                return ApiResponse(
                    success=True,
                    data=data.get("user"),
                    message="Login successful"
                )
            else:
                return ApiResponse(
                    success=False,
                    message=data.get("message", "Login failed"),
                    errors=data.get("errors", [])
                )
        except Exception as e:
            return ApiResponse(
                success=False,
                message="Network error",
                errors=[str(e)]
            )

    async def get_leads(self, filters: Dict[str, Any] = None) -> ApiResponse:
        """Fetch leads with optional filters"""
        try:
            self.sync_status.isSyncing = True

            params = {
                "page": filters.get("page", 1) if filters else 1,
                "limit": filters.get("limit", 50) if filters else 50,
                "search": filters.get("search", "") if filters else "",
                "status": filters.get("status", "") if filters else "",
            }

            response = await self.client.get(
                "/leads",
                params=params,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )

            self.sync_status.isSyncing = False
            self.sync_status.lastSyncedAt = datetime.now().isoformat()

            if response.status_code == 200:
                data = response.json()
                return ApiResponse(
                    success=True,
                    data=data.get("leads", []),
                    message=f"Fetched {len(data.get('leads', []))} leads"
                )
            else:
                return ApiResponse(
                    success=False,
                    message="Failed to fetch leads"
                )
        except Exception as e:
            self.sync_status.isSyncing = False
            self.sync_status.syncError = str(e)
            return ApiResponse(
                success=False,
                message="Network error",
                errors=[str(e)]
            )

    async def create_lead(self, lead_data: Dict[str, Any]) -> ApiResponse:
        """Create new lead with validation"""
        # Validation
        errors = self._validate_lead(lead_data)
        if errors:
            self.validation_errors = {e.field: e for e in errors}
            return ApiResponse(
                success=False,
                message="Validation failed",
                errors=[e.message for e in errors]
            )

        try:
            self.sync_status.isSyncing = True

            response = await self.client.post(
                "/leads",
                json=lead_data,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )

            self.sync_status.isSyncing = False

            if response.status_code == 201:
                return ApiResponse(
                    success=True,
                    data=response.json(),
                    message="Lead created successfully"
                )
            else:
                data = response.json()
                return ApiResponse(
                    success=False,
                    message=data.get("message", "Failed to create lead"),
                    errors=data.get("errors", [])
                )
        except Exception as e:
            self.sync_status.isSyncing = False
            return ApiResponse(
                success=False,
                message="Network error",
                errors=[str(e)]
            )

    async def update_lead(self, lead_id: str, lead_data: Dict[str, Any]) -> ApiResponse:
        """Update existing lead"""
        try:
            self.sync_status.isSyncing = True

            response = await self.client.put(
                f"/leads/{lead_id}",
                json=lead_data,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )

            self.sync_status.isSyncing = False

            if response.status_code == 200:
                return ApiResponse(
                    success=True,
                    data=response.json(),
                    message="Lead updated successfully"
                )
            else:
                return ApiResponse(
                    success=False,
                    message="Failed to update lead"
                )
        except Exception as e:
            self.sync_status.isSyncing = False
            return ApiResponse(
                success=False,
                message="Network error",
                errors=[str(e)]
            )

    async def delete_lead(self, lead_id: str) -> ApiResponse:
        """Delete lead"""
        try:
            response = await self.client.delete(
                f"/leads/{lead_id}",
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )

            if response.status_code == 200:
                return ApiResponse(
                    success=True,
                    message="Lead deleted successfully"
                )
            else:
                return ApiResponse(
                    success=False,
                    message="Failed to delete lead"
                )
        except Exception as e:
            return ApiResponse(
                success=False,
                message="Network error",
                errors=[str(e)]
            )

    async def bulk_delete_leads(self, lead_ids: List[str]) -> ApiResponse:
        """Bulk delete multiple leads"""
        try:
            response = await self.client.post(
                "/leads/bulk-delete",
                json={"ids": lead_ids},
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )

            if response.status_code == 200:
                data = response.json()
                return ApiResponse(
                    success=True,
                    message=f"Deleted {data.get('deletedCount', 0)} leads"
                )
            else:
                return ApiResponse(
                    success=False,
                    message="Failed to bulk delete leads"
                )
        except Exception as e:
            return ApiResponse(
                success=False,
                message="Network error",
                errors=[str(e)]
            )

    async def export_leads(self, format: str = "csv", filters: Dict[str, Any] = None) -> ApiResponse:
        """Export leads in specified format (csv, xlsx, pdf)"""
        try:
            params = {"format": format}
            if filters:
                params.update(filters)

            response = await self.client.get(
                "/leads/export",
                params=params,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )

            if response.status_code == 200:
                return ApiResponse(
                    success=True,
                    data=response.content,  # Binary content
                    message=f"Leads exported as {format.upper()}"
                )
            else:
                return ApiResponse(
                    success=False,
                    message="Failed to export leads"
                )
        except Exception as e:
            return ApiResponse(
                success=False,
                message="Network error",
                errors=[str(e)]
            )

    # ── VALIDATION METHODS ──────────────────────────────────────────────────────────

    def _validate_lead(self, data: Dict[str, Any]) -> List[ValidationError]:
        """Validate lead data"""
        errors = []

        # Name validation
        if not data.get("name", "").strip():
            errors.append(ValidationError("name", "Lead name is required", "REQUIRED"))

        # Phone validation
        phone = data.get("phone", "").strip()
        if not phone:
            errors.append(ValidationError("phone", "Phone number is required", "REQUIRED"))
        elif len(phone) < 10:
            errors.append(ValidationError("phone", "Phone number must be at least 10 digits", "INVALID"))

        # Email validation (optional but validate if provided)
        email = data.get("email", "").strip()
        if email and "@" not in email:
            errors.append(ValidationError("email", "Invalid email format", "INVALID"))

        # Value validation
        value_str = data.get("value", "").strip()
        if value_str:
            try:
                val = float(value_str.replace("₹", "").replace("$", "").replace(",", ""))
                if val < 0:
                    errors.append(ValidationError("value", "Lead value cannot be negative", "INVALID"))
            except ValueError:
                errors.append(ValidationError("value", "Lead value must be a valid number", "INVALID"))

        return errors

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# ─────────────────────────────────────────────────────────────────────────────────────
# SINGLETON INSTANCE
# ─────────────────────────────────────────────────────────────────────────────────────

_api_client: Optional[DASCRMApiClient] = None

def get_api_client() -> DASCRMApiClient:
    """Get or create API client singleton"""
    global _api_client
    if _api_client is None:
        _api_client = DASCRMApiClient()
    return _api_client
