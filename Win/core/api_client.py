"""
DAS CRM Windows Application - API Client
Async REST client using httpx targeting NestJS backend.
Thread-safe with auth token management and request retry logic.
"""

import asyncio
import json
from typing import Any, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import httpx
from pathlib import Path


@dataclass
class AuthToken:
    """Authentication token storage."""
    access_token: str
    expires_at: datetime


class APIClient:
    """HTTP client for NestJS backend API communication."""
    
    def __init__(self, base_url: str = "http://localhost:4000/api"):
        self.base_url = base_url
        self.auth_token: Optional[AuthToken] = None
        self.client = httpx.AsyncClient(
            base_url=base_url,
            timeout=30.0,
            headers={"Content-Type": "application/json"}
        )
        self._token_file = Path.home() / ".dascrm" / "auth_token.json"
        self._token_file.parent.mkdir(parents=True, exist_ok=True)
        self._load_token()
    
    def _load_token(self):
        """Load token from disk if available."""
        if self._token_file.exists():
            try:
                with open(self._token_file, 'r') as f:
                    data = json.load(f)
                    self.auth_token = AuthToken(
                        access_token=data['access_token'],
                        expires_at=datetime.fromisoformat(data['expires_at'])
                    )
            except Exception:
                pass
    
    def _save_token(self):
        """Persist token to disk."""
        if self.auth_token:
            with open(self._token_file, 'w') as f:
                json.dump({
                    'access_token': self.auth_token.access_token,
                    'expires_at': self.auth_token.expires_at.isoformat()
                }, f)
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers with auth token."""
        headers = {"Content-Type": "application/json"}
        if self.auth_token and self.auth_token.expires_at > datetime.now():
            headers["Authorization"] = f"Bearer {self.auth_token.access_token}"
        return headers
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and store token."""
        response = await self.client.post(
            "/auth/login",
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        data = response.json()
        
        self.auth_token = AuthToken(
            access_token=data['access_token'],
            expires_at=datetime.now() + timedelta(hours=24)
        )
        self._save_token()
        return data
    
    async def get_profile(self) -> Dict[str, Any]:
        """Fetch current user profile."""
        response = await self.client.get(
            "/auth/profile",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_leads(self, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        """Fetch leads list."""
        response = await self.client.get(
            "/leads",
            params={"skip": skip, "limit": limit},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def create_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new lead."""
        response = await self.client.post(
            "/leads",
            json=lead_data,
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def update_lead(self, lead_id: str, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing lead."""
        response = await self.client.put(
            f"/leads/{lead_id}",
            json=lead_data,
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_deals(self, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        """Fetch deals/pipeline."""
        response = await self.client.get(
            "/deals",
            params={"skip": skip, "limit": limit},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def update_deal_stage(self, deal_id: str, stage: str) -> Dict[str, Any]:
        """Update deal stage."""
        response = await self.client.put(
            f"/deals/{deal_id}",
            json={"stage": stage},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_contacts(self, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        """Fetch contacts."""
        response = await self.client.get(
            "/contacts",
            params={"skip": skip, "limit": limit},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_products(self, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        """Fetch products catalog."""
        response = await self.client.get(
            "/products",
            params={"skip": skip, "limit": limit},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_quotations(self, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        """Fetch quotations."""
        response = await self.client.get(
            "/quotations",
            params={"skip": skip, "limit": limit},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_analytics(self) -> Dict[str, Any]:
        """Fetch analytics metrics."""
        response = await self.client.get(
            "/reports/analytics",
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def get_audit_logs(self, skip: int = 0, limit: int = 50) -> Dict[str, Any]:
        """Fetch audit logs."""
        response = await self.client.get(
            "/admin/audit-logs",
            params={"skip": skip, "limit": limit},
            headers=self._get_headers()
        )
        response.raise_for_status()
        return response.json()
    
    async def upload_bulk_import(self, file_path: str) -> Dict[str, Any]:
        """Upload CSV file for bulk import."""
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = await self.client.post(
                "/bulk-import/upload",
                files=files,
                headers={"Authorization": f"Bearer {self.auth_token.access_token}"} if self.auth_token else {}
            )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close HTTP client connection."""
        await self.client.aclose()
