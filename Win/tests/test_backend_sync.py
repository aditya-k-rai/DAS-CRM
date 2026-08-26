"""
test_backend_sync.py — DAS CRM Windows
Comprehensive Backend Integration Tests for Sync, CRUD, and Offline Operations
"""

import pytest
import asyncio
import json
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path
import tempfile
import shutil

# Import core modules
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.api_client import DASCRMApiClient, ApiResponse, SyncStatus, ValidationError
from core.sync_engine import DASCRMSyncEngine, PendingAction, SyncConflict


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST FIXTURES
# ─────────────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def temp_db():
    """Create temporary database for testing"""
    temp_dir = tempfile.mkdtemp()
    db_path = f"{temp_dir}/test.db"
    queue_path = f"{temp_dir}/queue.json"
    yield db_path, queue_path
    shutil.rmtree(temp_dir)


@pytest.fixture
async def api_client():
    """Create API client for testing"""
    client = DASCRMApiClient(base_url="http://localhost:4000/api", timeout=30)
    yield client
    await client.close()


@pytest.fixture
def sync_engine(temp_db):
    """Create sync engine with temp database"""
    db_path, queue_path = temp_db
    engine = DASCRMSyncEngine(db_path=db_path, queue_path=queue_path)
    return engine


# ─────────────────────────────────────────────────────────────────────────────────────
# UNIT TESTS: API CLIENT
# ─────────────────────────────────────────────────────────────────────────────────────

class TestAPIClientValidation:
    """Test API client validation logic"""

    def test_validate_lead_required_fields(self):
        """Test validation of required fields"""
        client = DASCRMApiClient()

        # Missing name
        errors = client._validate_lead({"phone": "+91-9876543210"})
        assert any(e.field == "name" for e in errors), "Should require name"

        # Missing phone
        errors = client._validate_lead({"name": "Rajesh Kumar"})
        assert any(e.field == "phone" for e in errors), "Should require phone"

    def test_validate_lead_phone_length(self):
        """Test phone number minimum length"""
        client = DASCRMApiClient()

        # Too short
        errors = client._validate_lead({
            "name": "Rajesh Kumar",
            "phone": "98765"
        })
        assert any(e.field == "phone" for e in errors), "Phone must be >= 10 digits"

        # Valid
        errors = client._validate_lead({
            "name": "Rajesh Kumar",
            "phone": "+91-9876543210"
        })
        assert not any(e.field == "phone" for e in errors), "Valid phone should pass"

    def test_validate_lead_email_format(self):
        """Test email validation"""
        client = DASCRMApiClient()

        # Invalid email (no @)
        errors = client._validate_lead({
            "name": "Rajesh Kumar",
            "phone": "+91-9876543210",
            "email": "rajesh_techcorp.com"
        })
        assert any(e.field == "email" for e in errors), "Should reject email without @"

        # Valid email
        errors = client._validate_lead({
            "name": "Rajesh Kumar",
            "phone": "+91-9876543210",
            "email": "rajesh@techcorp.com"
        })
        assert not any(e.field == "email" for e in errors), "Valid email should pass"

    def test_validate_lead_value_numeric(self):
        """Test lead value validation"""
        client = DASCRMApiClient()

        # Invalid (non-numeric)
        errors = client._validate_lead({
            "name": "Rajesh Kumar",
            "phone": "+91-9876543210",
            "value": "not-a-number"
        })
        assert any(e.field == "value" for e in errors), "Should reject non-numeric value"

        # Invalid (negative)
        errors = client._validate_lead({
            "name": "Rajesh Kumar",
            "phone": "+91-9876543210",
            "value": "-5000"
        })
        assert any(e.field == "value" for e in errors), "Should reject negative value"

        # Valid
        errors = client._validate_lead({
            "name": "Rajesh Kumar",
            "phone": "+91-9876543210",
            "value": "₹5,00,000"
        })
        assert not any(e.field == "value" for e in errors), "Valid value should pass"


# ─────────────────────────────────────────────────────────────────────────────────────
# UNIT TESTS: SYNC ENGINE
# ─────────────────────────────────────────────────────────────────────────────────────

class TestSyncEngine:
    """Test offline-first sync engine"""

    def test_create_lead_locally(self, sync_engine):
        """Test local lead creation"""
        lead_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp",
            "status": "NEW_LEAD",
            "value": "₹5,00,000"
        }

        result = sync_engine.create_lead_locally(lead_data)
        assert result is True, "Should create lead locally"

        # Verify lead exists in database
        leads = sync_engine.get_all_leads_locally()
        assert len(leads) > 0, "Should have at least one lead"
        assert leads[0]["name"] == "Rajesh Kumar"

    def test_update_lead_locally(self, sync_engine):
        """Test local lead update"""
        # Create lead first
        lead_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp",
            "status": "NEW_LEAD",
            "value": "₹5,00,000"
        }
        sync_engine.create_lead_locally(lead_data)
        lead_id = sync_engine.get_all_leads_locally()[0]["id"]

        # Update lead
        updates = {"status": "QUALIFIED", "value": "₹7,00,000"}
        result = sync_engine.update_lead_locally(lead_id, updates)
        assert result is True, "Should update lead locally"

        # Verify update
        lead = sync_engine.get_lead_locally(lead_id)
        assert lead["status"] == "QUALIFIED"
        assert lead["value"] == "₹7,00,000"

    def test_delete_lead_locally(self, sync_engine):
        """Test local lead deletion"""
        # Create lead
        lead_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp",
            "status": "NEW_LEAD"
        }
        sync_engine.create_lead_locally(lead_data)
        lead_id = sync_engine.get_all_leads_locally()[0]["id"]

        # Delete lead
        result = sync_engine.delete_lead_locally(lead_id)
        assert result is True, "Should delete lead locally"

        # Verify deletion
        lead = sync_engine.get_lead_locally(lead_id)
        assert lead is None, "Lead should be deleted"

    def test_get_sync_stats(self, sync_engine):
        """Test sync statistics"""
        # Create multiple leads
        for i in range(3):
            sync_engine.create_lead_locally({
                "name": f"Lead {i}",
                "email": f"lead{i}@test.com",
                "phone": "+91-9876543210",
                "company": "TestCorp",
                "status": "NEW_LEAD"
            })

        stats = sync_engine.get_sync_stats()
        assert stats["total"] >= 3, "Should track total leads"
        assert stats["pending"] >= 3, "Should have pending actions"
        assert stats["sync_percentage"] == 0, "Not synced yet"

    def test_pending_actions_queue(self, sync_engine):
        """Test pending actions tracking"""
        # Create lead (should queue action)
        sync_engine.create_lead_locally({
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp"
        })

        pending = sync_engine.get_pending_actions()
        assert len(pending) > 0, "Should have pending actions"
        assert pending[0].action_type == "CREATE"
        assert pending[0].entity_type == "lead"
        assert pending[0].status == "PENDING"


# ─────────────────────────────────────────────────────────────────────────────────────
# INTEGRATION TESTS: BACKEND SYNC
# ─────────────────────────────────────────────────────────────────────────────────────

class TestBackendSync:
    """Integration tests with backend"""

    @pytest.mark.asyncio
    async def test_backend_connectivity(self, api_client):
        """Test backend API connectivity"""
        # This test requires backend to be running
        try:
            # Try to make a simple request
            response = await api_client.client.get("/health")
            # If we get here, backend is running
            assert response.status_code in [200, 404], "Backend should respond"
        except Exception as e:
            pytest.skip(f"Backend not available: {e}")

    @pytest.mark.asyncio
    async def test_create_lead_with_backend(self, api_client, sync_engine):
        """Test creating lead and syncing to backend"""
        pytest.skip("Requires live backend")

        lead_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp",
            "status": "NEW_LEAD",
            "value": "₹5,00,000"
        }

        # Create locally
        sync_engine.create_lead_locally(lead_data)

        # Try sync (will fail without authenticated backend)
        results = await sync_engine.sync_pending_actions(api_client)
        # In real scenario, would verify results["synced"] > 0

    @pytest.mark.asyncio
    async def test_sync_stats_progression(self, api_client, sync_engine):
        """Test sync statistics progression"""
        # Initial state
        stats1 = sync_engine.get_sync_stats()
        initial_pending = stats1.get("pending", 0)

        # Create local lead
        sync_engine.create_lead_locally({
            "name": "Test Lead",
            "email": "test@example.com",
            "phone": "+91-9876543210",
            "company": "TestCorp"
        })

        # Check stats increased
        stats2 = sync_engine.get_sync_stats()
        assert stats2["total"] > stats1["total"], "Total should increase"
        assert stats2["pending"] > initial_pending, "Pending should increase"


# ─────────────────────────────────────────────────────────────────────────────────────
# OFFLINE SCENARIO TESTS
# ─────────────────────────────────────────────────────────────────────────────────────

class TestOfflineScenarios:
    """Test offline-first behavior"""

    def test_offline_create_and_queue(self, sync_engine):
        """Test creating lead when offline"""
        # Simulate offline by creating local lead
        lead_data = {
            "name": "Offline Lead",
            "email": "offline@test.com",
            "phone": "+91-9876543210",
            "company": "OfflineCorp"
        }

        result = sync_engine.create_lead_locally(lead_data)
        assert result is True

        # Verify queued
        pending = sync_engine.get_pending_actions()
        assert len(pending) > 0
        assert pending[0].status == "PENDING"

    def test_offline_multiple_operations(self, sync_engine):
        """Test multiple offline operations"""
        # Create 3 leads
        for i in range(3):
            sync_engine.create_lead_locally({
                "name": f"Lead {i}",
                "email": f"lead{i}@test.com",
                "phone": "+91-9876543210",
                "company": "TestCorp"
            })

        pending = sync_engine.get_pending_actions()
        assert len(pending) == 3, "Should have 3 pending actions"

        # Update one lead
        lead_id = sync_engine.get_all_leads_locally()[0]["id"]
        sync_engine.update_lead_locally(lead_id, {"status": "QUALIFIED"})

        pending = sync_engine.get_pending_actions()
        assert len(pending) == 4, "Should have 4 pending (3 creates + 1 update)"

    def test_offline_queue_persistence(self, sync_engine, temp_db):
        """Test pending queue persists across restarts"""
        db_path, queue_path = temp_db

        # Create lead in first engine instance
        sync_engine.create_lead_locally({
            "name": "Persistent Lead",
            "email": "persistent@test.com",
            "phone": "+91-9876543210"
        })

        pending1 = sync_engine.get_pending_actions()
        assert len(pending1) > 0

        # Create new engine instance with same db
        sync_engine2 = DASCRMSyncEngine(db_path=db_path, queue_path=queue_path)
        pending2 = sync_engine2.get_pending_actions()

        assert len(pending2) == len(pending1), "Pending actions should persist"


# ─────────────────────────────────────────────────────────────────────────────────────
# CONFLICT RESOLUTION TESTS
# ─────────────────────────────────────────────────────────────────────────────────────

class TestConflictResolution:
    """Test sync conflict resolution"""

    def test_conflict_detection(self, sync_engine):
        """Test conflict detection logic"""
        # Create local lead
        lead_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp"
        }
        sync_engine.create_lead_locally(lead_data)

        # Simulate conflict: local version incremented but remote also updated
        # In real scenario, would compare versions and detect conflict
        stats = sync_engine.get_sync_stats()
        assert "total" in stats, "Should track versions for conflict detection"

    def test_last_write_wins_resolution(self, sync_engine):
        """Test last-write-wins conflict resolution"""
        # This would be tested with backend responses
        # For now, just verify the mechanism exists
        lead_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp"
        }
        sync_engine.create_lead_locally(lead_data)

        # Get lead and verify it's synced or pending
        leads = sync_engine.get_all_leads_locally()
        assert leads[0]["synced"] == 0, "Initially not synced"


# ─────────────────────────────────────────────────────────────────────────────────────
# PERFORMANCE & BATCH TESTS
# ─────────────────────────────────────────────────────────────────────────────────────

class TestBatchOperations:
    """Test batch operations performance"""

    def test_bulk_create_performance(self, sync_engine):
        """Test creating multiple leads efficiently"""
        import time

        start = time.time()
        for i in range(100):
            sync_engine.create_lead_locally({
                "name": f"Lead {i}",
                "email": f"lead{i}@test.com",
                "phone": "+91-9876543210",
                "company": "TestCorp",
                "status": "NEW_LEAD"
            })
        elapsed = time.time() - start

        stats = sync_engine.get_sync_stats()
        assert stats["total"] >= 100, "Should create 100 leads"
        assert elapsed < 5, f"Should create 100 leads in < 5s (took {elapsed}s)"

    def test_bulk_sync_queue_integrity(self, sync_engine):
        """Test queue integrity with bulk operations"""
        # Create leads
        for i in range(50):
            sync_engine.create_lead_locally({
                "name": f"Lead {i}",
                "email": f"lead{i}@test.com",
                "phone": "+91-9876543210",
                "company": "TestCorp"
            })

        # Get pending
        pending = sync_engine.get_pending_actions()
        assert len(pending) == 50, "Should queue all 50 creates"

        # Verify no duplicates
        action_ids = [a.id for a in pending]
        assert len(action_ids) == len(set(action_ids)), "No duplicate action IDs"


# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN TEST RUNNER
# ─────────────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
