"""
verify_imports.py — DAS CRM Windows
Pre-Build Import Verification Script
Ensures all modules can be imported correctly before PyInstaller build
"""

import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).parent / "Win"
sys.path.insert(0, str(PROJECT_ROOT))

print("=" * 80)
print("DAS CRM WINDOWS — PRE-BUILD IMPORT VERIFICATION")
print("=" * 80)
print()

# Track results
results = []

def test_import(module_path, description):
    """Test if a module can be imported"""
    try:
        __import__(module_path)
        print(f"✅ {description}")
        print(f"   Module: {module_path}")
        results.append((description, True))
        return True
    except ImportError as e:
        print(f"❌ {description}")
        print(f"   Module: {module_path}")
        print(f"   Error: {e}")
        results.append((description, False))
        return False
    except Exception as e:
        print(f"⚠️  {description}")
        print(f"   Module: {module_path}")
        print(f"   Error: {type(e).__name__}: {e}")
        results.append((description, False))
        return False

print("CORE MODULES:")
print("-" * 80)
test_import("core.api_client", "API Client Module")
print()
test_import("core.sync_engine", "Sync Engine Module")
print()
test_import("core.display_pacing", "Display Pacing Module")
print()

print("MODELS:")
print("-" * 80)
test_import("models.crm_models", "CRM Models Module")
print()

print("UI VIEWS (Sample):")
print("-" * 80)
test_import("ui.views.leads_view_enhanced", "Leads View Enhanced")
print()
test_import("ui.views.dashboard_view", "Dashboard View")
print()

print("THIRD-PARTY DEPENDENCIES:")
print("-" * 80)
test_import("PyQt6.QtWidgets", "PyQt6 Widgets")
print()
test_import("PyQt6.QtCore", "PyQt6 Core")
print()
test_import("PyQt6.QtGui", "PyQt6 GUI")
print()
test_import("httpx", "HTTPX HTTP Client")
print()
test_import("pydantic", "Pydantic Validation")
print()
test_import("sqlite3", "SQLite3 Database")
print()

print("=" * 80)
print("DETAILED IMPORT TESTS:")
print("=" * 80)
print()

# Test specific imports
try:
    from core.api_client import get_api_client, DASCRMApiClient
    print("✅ API Client imports correct")
    print(f"   get_api_client: {get_api_client}")
    print(f"   DASCRMApiClient: {DASCRMApiClient}")
    results.append(("Specific API Client imports", True))
except Exception as e:
    print(f"❌ API Client import failed: {e}")
    results.append(("Specific API Client imports", False))

print()

try:
    from core.sync_engine import get_sync_engine, DASCRMSyncEngine
    print("✅ Sync Engine imports correct")
    print(f"   get_sync_engine: {get_sync_engine}")
    print(f"   DASCRMSyncEngine: {DASCRMSyncEngine}")
    results.append(("Specific Sync Engine imports", True))
except Exception as e:
    print(f"❌ Sync Engine import failed: {e}")
    results.append(("Specific Sync Engine imports", False))

print()

try:
    from core.display_pacing import DisplayPacingEngine
    print("✅ Display Pacing Engine import correct")
    print(f"   DisplayPacingEngine: {DisplayPacingEngine}")
    results.append(("Display Pacing Engine import", True))
except Exception as e:
    print(f"❌ Display Pacing Engine import failed: {e}")
    results.append(("Display Pacing Engine import", False))

print()

try:
    from PyQt6.QtWidgets import QApplication, QMainWindow
    print("✅ PyQt6 main widgets import correct")
    print(f"   QApplication: {QApplication}")
    print(f"   QMainWindow: {QMainWindow}")
    results.append(("PyQt6 main widgets", True))
except Exception as e:
    print(f"❌ PyQt6 widgets import failed: {e}")
    results.append(("PyQt6 main widgets", False))

print()
print("=" * 80)
print("SUMMARY:")
print("=" * 80)

passed = sum(1 for _, success in results if success)
failed = sum(1 for _, success in results if not success)
total = len(results)

print(f"\n📊 Results: {passed}/{total} PASSED, {failed}/{total} FAILED\n")

if failed > 0:
    print("Failed checks:")
    for description, success in results:
        if not success:
            print(f"  ❌ {description}")

print()

if failed == 0:
    print("✅ ALL IMPORTS VERIFIED - Ready to build!")
    print()
    print("Next steps:")
    print("  1. Run: python build_exe.py")
    print("  2. Wait 2-5 minutes for build to complete")
    print("  3. Test: dist/DASCRM.exe")
    print()
    sys.exit(0)
else:
    print("❌ IMPORT VERIFICATION FAILED")
    print()
    print("To fix:")
    print("  1. Check that all required packages are installed:")
    print("     pip install -r requirements.txt")
    print("  2. Verify no syntax errors:")
    print("     python -m py_compile main.py")
    print("  3. Run this script again to verify")
    print()
    sys.exit(1)
