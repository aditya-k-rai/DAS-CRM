"""
live_backend_test.py — DAS CRM Windows
Live Backend Integration Testing Suite
Tests against actual NestJS backend at http://localhost:4000/api
"""

import asyncio
import json
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from core.api_client import DASCRMApiClient, ApiResponse
from core.sync_engine import DASCRMSyncEngine


# ─────────────────────────────────────────────────────────────────────────────────────
# TEST RESULTS TRACKING
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class TestResult:
    """Single test result"""
    name: str
    passed: bool
    message: str
    duration_ms: float
    error: Optional[str] = None


class BackendIntegrationTestSuite:
    """Live backend integration test suite"""

    def __init__(self, backend_url: str = "http://localhost:4000/api"):
        self.backend_url = backend_url
        self.api_client = DASCRMApiClient(base_url=backend_url)
        self.results: List[TestResult] = []
        self.test_token: Optional[str] = None
        self.test_user_id: Optional[str] = None

    # ── SETUP & TEARDOWN ────────────────────────────────────────────────────────────

    async def check_backend_connectivity(self) -> bool:
        """Check if backend is reachable"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.backend_url.replace('/api', '')}/health")
                return response.status_code in [200, 404]
        except Exception as e:
            print(f"❌ Backend not reachable: {e}")
            return False

    async def setup(self):
        """Setup test environment"""
        print("\n🔧 Setting up backend integration tests...")
        print(f"Backend URL: {self.backend_url}")

        # Check connectivity
        if not await self.check_backend_connectivity():
            print("⚠️  Backend not reachable. Tests will be simulated.")
            return False

        print("✓ Backend is reachable")
        return True

    # ── AUTHENTICATION TESTS ────────────────────────────────────────────────────────

    async def test_login_valid_credentials(self) -> TestResult:
        """Test login with valid credentials"""
        start = datetime.now()
        test_name = "Authentication - Valid Login"

        try:
            # Try test login
            response = await self.api_client.login(
                email="test@dascrm.com",
                password="TestPassword123!"
            )

            elapsed = (datetime.now() - start).total_seconds() * 1000

            if response.success:
                self.test_token = self.api_client.auth_token
                if response.data:
                    self.test_user_id = response.data.get("id")
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message="Login successful",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message=f"Login failed: {response.message}",
                    duration_ms=elapsed,
                    error=response.message
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Login error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    async def test_login_invalid_credentials(self) -> TestResult:
        """Test login with invalid credentials"""
        start = datetime.now()
        test_name = "Authentication - Invalid Login"

        try:
            response = await self.api_client.login(
                email="wrong@dascrm.com",
                password="WrongPassword"
            )

            elapsed = (datetime.now() - start).total_seconds() * 1000

            # Should fail
            if not response.success:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message="Invalid login correctly rejected",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message="Invalid login was accepted",
                    duration_ms=elapsed
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Login error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    # ── LEAD CRUD TESTS ─────────────────────────────────────────────────────────────

    async def test_create_lead(self) -> TestResult:
        """Test creating a lead"""
        start = datetime.now()
        test_name = "CRUD - Create Lead"

        try:
            lead_data = {
                "name": f"Test Lead {datetime.now().timestamp()}",
                "email": "testlead@techcorp.com",
                "phone": "+91-9876543210",
                "company": "TestCorp",
                "status": "NEW_LEAD",
                "value": "₹5,00,000",
                "source": "API Test"
            }

            response = await self.api_client.create_lead(lead_data)
            elapsed = (datetime.now() - start).total_seconds() * 1000

            if response.success:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message=f"Lead created: {response.data.get('id') if response.data else 'N/A'}",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message=f"Create failed: {response.message}",
                    duration_ms=elapsed,
                    error=response.message
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Create error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    async def test_get_leads(self) -> TestResult:
        """Test fetching leads"""
        start = datetime.now()
        test_name = "CRUD - Get Leads"

        try:
            response = await self.api_client.get_leads(filters={"limit": 10})
            elapsed = (datetime.now() - start).total_seconds() * 1000

            if response.success:
                lead_count = len(response.data) if response.data else 0
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message=f"Fetched {lead_count} leads",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message=f"Fetch failed: {response.message}",
                    duration_ms=elapsed,
                    error=response.message
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Fetch error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    async def test_update_lead(self) -> TestResult:
        """Test updating a lead"""
        start = datetime.now()
        test_name = "CRUD - Update Lead"

        try:
            # First create a lead
            lead_data = {
                "name": f"Update Test {datetime.now().timestamp()}",
                "email": "update@test.com",
                "phone": "+91-9876543210",
                "company": "UpdateCorp"
            }
            create_response = await self.api_client.create_lead(lead_data)

            if not create_response.success or not create_response.data:
                elapsed = (datetime.now() - start).total_seconds() * 1000
                return TestResult(
                    name=test_name,
                    passed=False,
                    message="Could not create lead for update test",
                    duration_ms=elapsed
                )

            lead_id = create_response.data.get("id")

            # Update the lead
            updates = {"status": "QUALIFIED", "value": "₹7,00,000"}
            response = await self.api_client.update_lead(lead_id, updates)
            elapsed = (datetime.now() - start).total_seconds() * 1000

            if response.success:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message="Lead updated successfully",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message=f"Update failed: {response.message}",
                    duration_ms=elapsed,
                    error=response.message
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Update error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    async def test_delete_lead(self) -> TestResult:
        """Test deleting a lead"""
        start = datetime.now()
        test_name = "CRUD - Delete Lead"

        try:
            # Create a lead to delete
            lead_data = {
                "name": f"Delete Test {datetime.now().timestamp()}",
                "email": "delete@test.com",
                "phone": "+91-9876543210",
                "company": "DeleteCorp"
            }
            create_response = await self.api_client.create_lead(lead_data)

            if not create_response.success or not create_response.data:
                elapsed = (datetime.now() - start).total_seconds() * 1000
                return TestResult(
                    name=test_name,
                    passed=False,
                    message="Could not create lead for delete test",
                    duration_ms=elapsed
                )

            lead_id = create_response.data.get("id")

            # Delete the lead
            response = await self.api_client.delete_lead(lead_id)
            elapsed = (datetime.now() - start).total_seconds() * 1000

            if response.success:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message="Lead deleted successfully",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message=f"Delete failed: {response.message}",
                    duration_ms=elapsed,
                    error=response.message
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Delete error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    # ── BULK OPERATIONS TESTS ───────────────────────────────────────────────────────

    async def test_bulk_delete_leads(self) -> TestResult:
        """Test bulk delete operation"""
        start = datetime.now()
        test_name = "Bulk Operations - Bulk Delete"

        try:
            # Create 3 leads
            lead_ids = []
            for i in range(3):
                lead_data = {
                    "name": f"Bulk Delete Test {i} {datetime.now().timestamp()}",
                    "email": f"bulk{i}@test.com",
                    "phone": "+91-9876543210",
                    "company": "BulkCorp"
                }
                create_response = await self.api_client.create_lead(lead_data)
                if create_response.success and create_response.data:
                    lead_ids.append(create_response.data.get("id"))

            if len(lead_ids) < 3:
                elapsed = (datetime.now() - start).total_seconds() * 1000
                return TestResult(
                    name=test_name,
                    passed=False,
                    message="Could not create test leads",
                    duration_ms=elapsed
                )

            # Bulk delete
            response = await self.api_client.bulk_delete_leads(lead_ids)
            elapsed = (datetime.now() - start).total_seconds() * 1000

            if response.success:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message=f"Bulk deleted {len(lead_ids)} leads",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message=f"Bulk delete failed: {response.message}",
                    duration_ms=elapsed,
                    error=response.message
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Bulk delete error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    # ── EXPORT TESTS ────────────────────────────────────────────────────────────────

    async def test_export_leads_csv(self) -> TestResult:
        """Test exporting leads as CSV"""
        start = datetime.now()
        test_name = "Export - Leads to CSV"

        try:
            response = await self.api_client.export_leads(format="csv")
            elapsed = (datetime.now() - start).total_seconds() * 1000

            if response.success and response.data:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message=f"Exported CSV ({len(response.data)} bytes)",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message=f"Export failed: {response.message}",
                    duration_ms=elapsed,
                    error=response.message
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Export error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    # ── VALIDATION TESTS ────────────────────────────────────────────────────────────

    async def test_validation_required_fields(self) -> TestResult:
        """Test validation of required fields"""
        start = datetime.now()
        test_name = "Validation - Required Fields"

        try:
            # Missing name
            response = await self.api_client.create_lead({
                "phone": "+91-9876543210",
                "email": "test@test.com"
            })

            elapsed = (datetime.now() - start).total_seconds() * 1000

            # Should fail
            if not response.success and response.errors:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message="Validation correctly rejected missing name",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message="Validation should reject missing required fields",
                    duration_ms=elapsed
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Validation error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    async def test_validation_invalid_email(self) -> TestResult:
        """Test email format validation"""
        start = datetime.now()
        test_name = "Validation - Invalid Email Format"

        try:
            response = await self.api_client.create_lead({
                "name": "Test Lead",
                "phone": "+91-9876543210",
                "email": "invalid-email-format"
            })

            elapsed = (datetime.now() - start).total_seconds() * 1000

            # Should fail
            if not response.success:
                result = TestResult(
                    name=test_name,
                    passed=True,
                    message="Email validation working",
                    duration_ms=elapsed
                )
            else:
                result = TestResult(
                    name=test_name,
                    passed=False,
                    message="Should reject invalid email",
                    duration_ms=elapsed
                )
        except Exception as e:
            elapsed = (datetime.now() - start).total_seconds() * 1000
            result = TestResult(
                name=test_name,
                passed=False,
                message="Validation error",
                duration_ms=elapsed,
                error=str(e)
            )

        self.results.append(result)
        return result

    # ── RESULTS REPORTING ───────────────────────────────────────────────────────────

    def print_results(self):
        """Print test results summary"""
        print("\n" + "=" * 80)
        print("BACKEND INTEGRATION TEST RESULTS")
        print("=" * 80)

        passed = sum(1 for r in self.results if r.passed)
        failed = sum(1 for r in self.results if not r.passed)
        total = len(self.results)

        print(f"\n📊 Summary: {passed}/{total} passed, {failed}/{total} failed\n")

        # Group by category
        categories = {}
        for result in self.results:
            category = result.name.split(" - ")[0]
            if category not in categories:
                categories[category] = []
            categories[category].append(result)

        for category, results in sorted(categories.items()):
            print(f"\n{'─' * 80}")
            print(f"{category}")
            print(f"{'─' * 80}")

            for result in results:
                status = "✓" if result.passed else "✗"
                print(f"{status} {result.name}")
                print(f"  Duration: {result.duration_ms:.2f}ms")
                print(f"  Message: {result.message}")
                if result.error:
                    print(f"  Error: {result.error}")
                print()

        # Overall status
        print(f"{'=' * 80}")
        if failed == 0:
            print("✓ ALL TESTS PASSED")
        else:
            print(f"✗ {failed} TEST(S) FAILED")
        print(f"{'=' * 80}\n")

        return failed == 0

    async def run_all_tests(self):
        """Run all backend integration tests"""
        if not await self.setup():
            print("\n⚠️  Backend unavailable. Skipping integration tests.")
            return False

        print("\n🧪 Running Backend Integration Tests...\n")

        # Authentication tests
        print("🔐 Authentication Tests")
        print("  Testing login functionality...")
        await self.test_login_valid_credentials()
        await self.test_login_invalid_credentials()

        # CRUD tests
        print("📝 CRUD Tests")
        print("  Testing Create/Read/Update/Delete operations...")
        await self.test_create_lead()
        await self.test_get_leads()
        await self.test_update_lead()
        await self.test_delete_lead()

        # Bulk operations
        print("📦 Bulk Operations")
        print("  Testing bulk operations...")
        await self.test_bulk_delete_leads()

        # Export
        print("📤 Export Operations")
        print("  Testing export functionality...")
        await self.test_export_leads_csv()

        # Validation
        print("✔️  Validation Tests")
        print("  Testing data validation...")
        await self.test_validation_required_fields()
        await self.test_validation_invalid_email()

        # Print results
        success = self.print_results()
        await self.api_client.close()

        return success


# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────────────

async def main():
    """Main test entry point"""
    suite = BackendIntegrationTestSuite()
    success = await suite.run_all_tests()
    return success


if __name__ == "__main__":
    import sys
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
