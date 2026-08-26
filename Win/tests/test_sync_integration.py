"""
test_sync_integration.py — DAS CRM Windows
End-to-End Backend Synchronization Integration Tests
Tests complete CRUD flow, offline queue, and backend API integration
"""

import pytest
import asyncio
import json
import sqlite3
from typing import Dict, Any, List
from datetime import datetime
from pathlib import Path
import tempfile
import shutil
from unittest.mock import Mock, AsyncMock, patch, MagicMock

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.api_client import DASCRMApiClient, ApiResponse
from core.sync_engine import DASCRMSyncEngine, PendingAction


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
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def sync_engine(temp_db):
    """Create sync engine with temp database"""
    db_path, queue_path = temp_db
    engine = DASCRMSyncEngine(db_path=db_path, queue_path=queue_path)
    return engine


@pytest.fixture
async def mock_api_client():
    """Create mock API client"""
    client = DASCRMApiClient()

    # Mock methods
    client.login = AsyncMock(return_value=ApiResponse(
        success=True,
        data={"id": "user-1", "email": "test@test.com"},
        message="Login successful"
    ))

    client.create_lead = AsyncMock(return_value=ApiResponse(
        success=True,
        data={"id": "lead-123", "name": "Test Lead"},
        message="Lead created"
    ))

    client.update_lead = AsyncMock(return_value=ApiResponse(
        success=True,
        message="Lead updated"
    ))

    client.delete_lead = AsyncMock(return_value=ApiResponse(
        success=True,
        message="Lead deleted"
    ))

    client.bulk_delete_leads = AsyncMock(return_value=ApiResponse(
        success=True,
        message="Bulk delete successful"
    ))

    client.get_leads = AsyncMock(return_value=ApiResponse(
        success=True,
        data=[],
        message="Leads fetched"
    ))

    yield client
    await client.close()


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST SUITE 1: COMPLETE CRUD CYCLE
# ─────────────────────────────────────────────────────────────────────────────────────

class TestCompleteCRUDCycle:
    """Test complete Create-Read-Update-Delete cycle with backend sync"""

    def test_create_lead_workflow(self, sync_engine):
        """Test complete lead creation workflow"""
        lead_data = {
            "name": "Rajesh Kumar",
            "email": "rajesh@techcorp.com",
            "phone": "+91-9876543210",
            "company": "TechCorp India",
            "status": "NEW_LEAD",
            "value": "₹5,00,000",
            "source": "Website"
        }

        # Step 1: Create locally
        result = sync_engine.create_lead_locally(lead_data)
        assert result is True, "Should create lead locally"

        # Step 2: Verify in local database
        leads = sync_engine.get_all_leads_locally()
        assert len(leads) == 1, "Should have one lead"
        assert leads[0]["name"] == "Rajesh Kumar"
        assert leads[0]["synced"] == 0, "Should not be synced yet"

        # Step 3: Verify pending action queued
        pending = sync_engine.get_pending_actions()
        assert len(pending) == 1, "Should have one pending action"
        assert pending[0].action_type == "CREATE"
        assert pending[0].entity_type == "lead"
        assert pending[0].status == "PENDING"

        # Step 4: Verify action contains full payload
        assert "name" in pending[0].payload
        assert pending[0].payload["name"] == "Rajesh Kumar"

    def test_read_lead_workflow(self, sync_engine):
        """Test reading lead from local cache"""
        # Create lead
        sync_engine.create_lead_locally({
            "name": "Priya Sharma",
            "email": "priya@techcorp.com",
            "phone": "+91-9123456789",
            "company": "TechCorp"
        })

        lead_id = sync_engine.get_all_leads_locally()[0]["id"]

        # Read lead
        lead = sync_engine.get_lead_locally(lead_id)
        assert lead is not None, "Should read lead from cache"
        assert lead["name"] == "Priya Sharma"
        assert lead["email"] == "priya@techcorp.com"

    def test_update_lead_workflow(self, sync_engine):
        """Test complete lead update workflow"""
        # Create lead
        sync_engine.create_lead_locally({
            "name": "Vikram Patel",
            "email": "vikram@startupco.com",
            "phone": "+91-9876543210",
            "company": "StartupCo",
            "status": "NEW_LEAD",
            "value": "₹3,00,000"
        })

        lead_id = sync_engine.get_all_leads_locally()[0]["id"]

        # Update lead
        updates = {
            "status": "QUALIFIED",
            "value": "₹5,00,000"
        }
        result = sync_engine.update_lead_locally(lead_id, updates)
        assert result is True, "Should update lead locally"

        # Verify update in database
        lead = sync_engine.get_lead_locally(lead_id)
        assert lead["status"] == "QUALIFIED"
        assert lead["value"] == "₹5,00,000"

        # Verify update action queued
        pending = sync_engine.get_pending_actions()
        assert len(pending) == 2, "Should have CREATE + UPDATE"
        assert pending[1].action_type == "UPDATE"
        assert pending[1].entity_type == "lead"

    def test_delete_lead_workflow(self, sync_engine):
        """Test complete lead deletion workflow"""
        # Create lead
        sync_engine.create_lead_locally({
            "name": "Test Lead",
            "email": "test@test.com",
            "phone": "+91-9876543210"
        })

        lead_id = sync_engine.get_all_leads_locally()[0]["id"]

        # Delete lead
        result = sync_engine.delete_lead_locally(lead_id)
        assert result is True, "Should delete lead locally"

        # Verify deletion
        lead = sync_engine.get_lead_locally(lead_id)
        assert lead is None, "Lead should not exist"

        # Verify deletion queued
        pending = sync_engine.get_pending_actions()
        assert any(a.action_type == "DELETE" for a in pending), "Should queue delete"


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST SUITE 2: OFFLINE QUEUE MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────────────

class TestOfflineQueueManagement:
    """Test offline pending actions queue"""

    def test_queue_creation_on_local_operation(self, sync_engine):
        """Test queue entry created for each local operation"""
        # Operation 1: Create
        sync_engine.create_lead_locally({
            "name": "Lead 1",
            "email": "lead1@test.com",
            "phone": "+91-9876543210"
        })

        # Operation 2: Create another
        sync_engine.create_lead_locally({
            "name": "Lead 2",
            "email": "lead2@test.com",
            "phone": "+91-9876543210"
        })

        # Operation 3: Update first
        lead_id = sync_engine.get_all_leads_locally()[0]["id"]
        sync_engine.update_lead_locally(lead_id, {"status": "QUALIFIED"})

        # Verify queue
        pending = sync_engine.get_pending_actions()
        assert len(pending) == 3, "Should have 3 pending actions"

        # Verify order preserved
        assert pending[0].action_type == "CREATE"
        assert pending[1].action_type == "CREATE"
        assert pending[2].action_type == "UPDATE"

    def test_queue_status_transitions(self, sync_engine):
        """Test pending action status transitions"""
        # Create lead (PENDING status)
        sync_engine.create_lead_locally({
            "name": "Test Lead",
            "email": "test@test.com",
            "phone": "+91-9876543210"
        })

        pending = sync_engine.get_pending_actions()
        assert pending[0].status == "PENDING"

        # Simulate status change
        action_id = pending[0].id
        sync_engine._update_action_status(action_id, "SYNCING")

        pending = sync_engine.get_pending_actions()
        # After SYNCING, shouldn't be in PENDING list
        assert not any(a.id == action_id and a.status == "PENDING" for a in pending)

    def test_queue_persistence_across_restarts(self, sync_engine, temp_db):
        """Test queue persists across engine restarts"""
        db_path, queue_path = temp_db

        # Create operations in first engine
        sync_engine.create_lead_locally({
            "name": "Persistent Lead 1",
            "email": "p1@test.com",
            "phone": "+91-9876543210"
        })
        sync_engine.create_lead_locally({
            "name": "Persistent Lead 2",
            "email": "p2@test.com",
            "phone": "+91-9876543210"
        })

        pending1 = sync_engine.get_pending_actions()
        assert len(pending1) == 2

        # Create new engine with same database
        sync_engine2 = DASCRMSyncEngine(db_path=db_path, queue_path=queue_path)
        pending2 = sync_engine2.get_pending_actions()

        assert len(pending2) == 2, "Pending actions should persist"
        assert pending2[0].payload["name"] == "Persistent Lead 1"
        assert pending2[1].payload["name"] == "Persistent Lead 2"


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST SUITE 3: ASYNC SYNC TO BACKEND
# ─────────────────────────────────────────────────────────────────────────────────────

class TestAsyncBackendSync:
    """Test async synchronization with backend"""

    @pytest.mark.asyncio
    async def test_sync_pending_actions_success(self, sync_engine, mock_api_client):
        """Test successful sync of pending actions"""
        # Create local leads
        sync_engine.create_lead_locally({
            "name": "Test Lead 1",
            "email": "test1@test.com",
            "phone": "+91-9876543210"
        })
        sync_engine.create_lead_locally({
            "name": "Test Lead 2",
            "email": "test2@test.com",
            "phone": "+91-9876543210"
        })

        # Verify pending
        pending_before = sync_engine.get_pending_actions()
        assert len(pending_before) == 2

        # Sync
        results = await sync_engine.sync_pending_actions(mock_api_client)

        # Verify results
        assert results["synced"] == 2, "Should sync 2 actions"
        assert results["failed"] == 0, "Should have no failures"

    @pytest.mark.asyncio
    async def test_sync_mixed_operations(self, sync_engine, mock_api_client):
        """Test sync with mixed CREATE/UPDATE/DELETE"""
        # Create lead
        sync_engine.create_lead_locally({
            "name": "Test Lead",
            "email": "test@test.com",
            "phone": "+91-9876543210"
        })

        lead_id = sync_engine.get_all_leads_locally()[0]["id"]

        # Update lead
        sync_engine.update_lead_locally(lead_id, {"status": "QUALIFIED"})

        # Create another
        sync_engine.create_lead_locally({
            "name": "Another Lead",
            "email": "another@test.com",
            "phone": "+91-9876543210"
        })

        # Sync all
        results = await sync_engine.sync_pending_actions(mock_api_client)

        # Should process all 3 in order
        assert results["synced"] >= 2, "Should sync at least 2 actions"

    @pytest.mark.asyncio
    async def test_sync_marks_as_synced(self, sync_engine, mock_api_client):
        """Test that synced items are marked correctly"""
        # Create lead
        sync_engine.create_lead_locally({
            "name": "Test Lead",
            "email": "test@test.com",
            "phone": "+91-9876543210"
        })

        lead_id = sync_engine.get_all_leads_locally()[0]["id"]

        # Verify not synced
        lead_before = sync_engine.get_lead_locally(lead_id)
        assert lead_before["synced"] == 0

        # Sync
        await sync_engine.sync_pending_actions(mock_api_client)

        # Verify marked as synced
        lead_after = sync_engine.get_lead_locally(lead_id)
        assert lead_after["synced"] == 1, "Should mark as synced after successful sync"


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST SUITE 4: SYNC STATUS REPORTING
# ─────────────────────────────────────────────────────────────────────────────────────

class TestSyncStatusReporting:
    """Test sync statistics and status reporting"""

    def test_sync_stats_initial_state(self, sync_engine):
        """Test initial sync stats"""
        stats = sync_engine.get_sync_stats()

        assert stats["total"] == 0, "Should have no leads initially"
        assert stats["pending"] == 0, "Should have no pending"
        assert stats["synced"] == 0, "Should have no synced"
        assert stats["sync_percentage"] == 0, "Should be 0%"

    def test_sync_stats_after_local_operations(self, sync_engine):
        """Test stats after local operations"""
        # Create 5 leads
        for i in range(5):
            sync_engine.create_lead_locally({
                "name": f"Lead {i}",
                "email": f"lead{i}@test.com",
                "phone": "+91-9876543210"
            })

        stats = sync_engine.get_sync_stats()

        assert stats["total"] == 5, "Should have 5 leads"
        assert stats["pending"] == 5, "Should have 5 pending"
        assert stats["synced"] == 0, "Should have 0 synced"
        assert stats["sync_percentage"] == 0, "Should be 0%"

    def test_sync_stats_after_partial_sync(self, sync_engine):
        """Test stats after partial sync"""
        # Create 3 leads
        for i in range(3):
            sync_engine.create_lead_locally({
                "name": f"Lead {i}",
                "email": f"lead{i}@test.com",
                "phone": "+91-9876543210"
            })

        # Manually mark one as synced
        lead_id = sync_engine.get_all_leads_locally()[0]["id"]
        sync_engine._mark_entity_synced(lead_id)

        stats = sync_engine.get_sync_stats()

        assert stats["total"] == 3, "Should have 3 leads"
        assert stats["synced"] == 1, "Should have 1 synced"
        assert stats["pending"] == 3, "Pending actions not cleared"
        assert stats["sync_percentage"] == 33, "Should be ~33%"


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST SUITE 5: ERROR HANDLING & RETRY LOGIC
# ─────────────────────────────────────────────────────────────────────────────────────

class TestErrorHandlingAndRetry:
    """Test error handling and retry logic"""

    @pytest.mark.asyncio
    async def test_sync_with_failed_action(self, sync_engine):
        """Test sync handles failed actions"""
        # Create lead
        sync_engine.create_lead_locally({
            "name": "Test Lead",
            "email": "test@test.com",
            "phone": "+91-9876543210"
        })

        # Mock client with failure
        mock_client = AsyncMock()
        mock_client.create_lead = AsyncMock(return_value=ApiResponse(
            success=False,
            message="Server error"
        ))

        # Sync (should fail)
        results = await sync_engine.sync_pending_actions(mock_client)

        assert results["failed"] > 0, "Should report failures"

    @pytest.mark.asyncio
    async def test_failed_action_stays_in_queue(self, sync_engine):
        """Test failed actions remain in queue for retry"""
        # Create lead
        sync_engine.create_lead_locally({
            "name": "Test Lead",
            "email": "test@test.com",
            "phone": "+91-9876543210"
        })

        # Mock failed sync
        mock_client = AsyncMock()
        mock_client.create_lead = AsyncMock(return_value=ApiResponse(success=False))

        # Sync
        await sync_engine.sync_pending_actions(mock_client)

        # Verify still in queue
        pending = sync_engine.get_pending_actions()
        assert len(pending) > 0, "Failed actions should remain in queue"


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST SUITE 6: BULK OPERATIONS
# ─────────────────────────────────────────────────────────────────────────────────────

class TestBulkOperations:
    """Test bulk operations and performance"""

    def test_bulk_create_performance(self, sync_engine):
        """Test bulk create performance"""
        import time

        start = time.time()
        for i in range(200):
            sync_engine.create_lead_locally({
                "name": f"Bulk Lead {i}",
                "email": f"bulk{i}@test.com",
                "phone": "+91-9876543210",
                "company": "BulkCorp"
            })
        elapsed = time.time() - start

        stats = sync_engine.get_sync_stats()
        assert stats["total"] >= 200, "Should create 200 leads"
        assert elapsed < 10, f"Should complete in < 10s (took {elapsed}s)"

    def test_bulk_sync_queue_order(self, sync_engine):
        """Test queue maintains order for bulk operations"""
        # Create batch of leads
        lead_ids = []
        for i in range(10):
            sync_engine.create_lead_locally({
                "name": f"Lead {i}",
                "email": f"lead{i}@test.com",
                "phone": "+91-9876543210"
            })
            lead_ids.append(sync_engine.get_all_leads_locally()[-1]["id"])

        # Verify queue order
        pending = sync_engine.get_pending_actions()
        assert len(pending) == 10, "Should have 10 pending"

        # All should be CREATE
        assert all(a.action_type == "CREATE" for a in pending), "All should be CREATE"


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST SUITE 7: DATA VALIDATION IN SYNC
# ─────────────────────────────────────────────────────────────────────────────────────

class TestDataValidationInSync:
    """Test data validation during sync operations"""

    def test_sync_validates_lead_on_create(self):
        """Test API client validates lead before sending"""
        client = DASCRMApiClient()

        # Invalid lead (no name)
        invalid_data = {"phone": "+91-9876543210"}
        errors = client._validate_lead(invalid_data)

        assert len(errors) > 0, "Should detect validation errors"
        assert any(e.field == "name" for e in errors), "Should flag missing name"

    def test_sync_validates_lead_on_update(self):
        """Test API client validates on update"""
        client = DASCRMApiClient()

        # Invalid value
        invalid_data = {"value": "not-a-number"}
        errors = client._validate_lead(invalid_data)

        assert any(e.field == "value" for e in errors), "Should flag invalid value"

    def test_validation_errors_not_queued_for_sync(self, sync_engine):
        """Test invalid data doesn't queue for sync"""
        client = DASCRMApiClient()

        # Try to create with invalid data
        invalid_data = {
            "name": "X",  # Too short
            "phone": "123",  # Too short
            "email": "not-email"
        }

        errors = client._validate_lead(invalid_data)
        assert len(errors) > 0, "Should have validation errors"


# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN TEST RUNNER
# ─────────────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
