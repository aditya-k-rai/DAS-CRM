"""
build_exe.py — DAS CRM Windows
PyInstaller Build Configuration for .exe Generation
Fixed: Correct module imports and hidden dependencies
"""

import os
import sys
from pathlib import Path
import PyInstaller.__main__

# ─────────────────────────────────────────────────────────────────────────────────────
# BUILD CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent
MAIN_SCRIPT = PROJECT_ROOT / "main.py"
DIST_DIR = PROJECT_ROOT / "dist"
BUILD_DIR = PROJECT_ROOT / "build"
SPEC_DIR = PROJECT_ROOT / "build_specs"

# Ensure directories exist
SPEC_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────────────
# HIDDEN IMPORTS & DEPENDENCIES
# ─────────────────────────────────────────────────────────────────────────────────────

HIDDEN_IMPORTS = [
    # Core modules
    'core.api_client',
    'core.sync_engine',
    'core.display_pacing',

    # Models
    'models.crm_models',

    # UI Views
    'ui.views.leads_view_enhanced',
    'ui.views.dashboard_view',
    'ui.views.deals_pipeline_view',
    'ui.views.contacts_view',
    'ui.views.products_view',
    'ui.views.quotations_view',
    'ui.views.reports_view',
    'ui.views.bulk_ingestion_view',
    'ui.views.admin_view',
    'ui.views.automations_view',
    'ui.views.communications_view',
    'ui.views.help_view',
    'ui.views.hr_view',
    'ui.views.integrations_view',
    'ui.views.settings_view',
    'ui.views.tasks_view',
    'ui.views.additional_views',

    # PyQt6 modules
    'PyQt6.QtCore',
    'PyQt6.QtGui',
    'PyQt6.QtWidgets',

    # Third-party
    'httpx',
    'pydantic',
    'sqlite3',
    'json',
    'asyncio',
]

# ─────────────────────────────────────────────────────────────────────────────────────
# PYINSTALLER ARGUMENTS
# ─────────────────────────────────────────────────────────────────────────────────────

def build_exe(debug=False):
    """Build Windows .exe using PyInstaller"""

    args = [
        str(MAIN_SCRIPT),
        '--onefile',  # Single .exe file
        '--windowed',  # No console window
        f'--distpath={DIST_DIR}',
        f'--buildpath={BUILD_DIR}',
        f'--specpath={SPEC_DIR}',
        '--name=DASCRM',
        '--icon=resources/icon.ico' if (PROJECT_ROOT / 'resources' / 'icon.ico').exists() else '',
        '--add-data=resources:resources' if (PROJECT_ROOT / 'resources').exists() else '',
        '--collect-all=PyQt6',
        '--collect-all=httpx',
        '--collect-all=pydantic',
    ]

    # Add hidden imports
    for hidden_import in HIDDEN_IMPORTS:
        args.append(f'--hidden-import={hidden_import}')

    # Debug options
    if debug:
        args.extend(['--debug=imports', '--log-level=DEBUG'])
    else:
        args.append('--optimize=2')

    # Remove empty strings from args
    args = [arg for arg in args if arg]

    print(f"🔨 Building DAS CRM Windows Application...")
    print(f"   Main script: {MAIN_SCRIPT}")
    print(f"   Output: {DIST_DIR / 'DASCRM.exe'}")
    print(f"   Hidden imports: {len(HIDDEN_IMPORTS)}")
    print()

    # Run PyInstaller
    try:
        PyInstaller.__main__.run(args)
        print("\n✅ Build completed successfully!")
        print(f"📦 Output: {DIST_DIR / 'DASCRM.exe'}")
        return True
    except Exception as e:
        print(f"\n❌ Build failed: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────────────
# VERIFICATION & TESTING
# ─────────────────────────────────────────────────────────────────────────────────────

def verify_build():
    """Verify build integrity"""
    exe_path = DIST_DIR / 'DASCRM.exe'

    if not exe_path.exists():
        print(f"❌ Build artifact not found: {exe_path}")
        return False

    file_size_mb = exe_path.stat().st_size / (1024 * 1024)
    print(f"✅ Build artifact found")
    print(f"   File: {exe_path}")
    print(f"   Size: {file_size_mb:.2f} MB")

    # Expected size range for PyQt6 + dependencies
    if file_size_mb < 50:
        print(f"⚠️  WARNING: Executable seems too small ({file_size_mb:.2f} MB)")
        print("    This might indicate missing dependencies")
        return False
    elif file_size_mb > 500:
        print(f"⚠️  WARNING: Executable is large ({file_size_mb:.2f} MB)")
        print("    Consider using UPX for compression")

    return True


# ─────────────────────────────────────────────────────────────────────────────────────
# CLEANUP
# ─────────────────────────────────────────────────────────────────────────────────────

def cleanup():
    """Clean build artifacts"""
    import shutil

    if BUILD_DIR.exists():
        print(f"🧹 Removing build directory: {BUILD_DIR}")
        shutil.rmtree(BUILD_DIR)

    if SPEC_DIR.exists():
        # Keep spec files for reference
        pass

    print("✅ Cleanup complete")


# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Build DAS CRM Windows .exe")
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--clean', action='store_true', help='Clean build artifacts')
    parser.add_argument('--verify-only', action='store_true', help='Only verify existing build')

    args = parser.parse_args()

    if args.clean:
        cleanup()
        sys.exit(0)

    if args.verify_only:
        success = verify_build()
        sys.exit(0 if success else 1)

    # Build executable
    success = build_exe(debug=args.debug)

    # Verify build
    if success:
        verify_build()

    sys.exit(0 if success else 1)
