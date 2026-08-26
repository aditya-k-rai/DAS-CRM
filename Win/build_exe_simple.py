"""
build_exe_simple.py — DAS CRM Windows
Simplified PyInstaller Build Script (Tested & Working)
Uses only verified PyInstaller arguments
"""

import os
import sys
import shutil
from pathlib import Path
import subprocess

# ─────────────────────────────────────────────────────────────────────────────────────
# BUILD CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent
MAIN_SCRIPT = PROJECT_ROOT / "main.py"
DIST_DIR = PROJECT_ROOT / "dist"
BUILD_DIR = PROJECT_ROOT / "build"
SPEC_DIR = PROJECT_ROOT / "build_specs"

# Create spec directory
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
# BUILD FUNCTION
# ─────────────────────────────────────────────────────────────────────────────────────

def build_exe(debug=False):
    """Build Windows .exe using PyInstaller"""

    # Build command with only verified arguments
    cmd = [
        'pyinstaller',
        str(MAIN_SCRIPT),
        '--onefile',
        '--windowed',
        f'--distpath={DIST_DIR}',
        f'--workpath={BUILD_DIR}',
        f'--specpath={SPEC_DIR}',
        '--name=DASCRM',
        '--collect-all=PyQt6',
    ]

    # Add hidden imports
    for hidden_import in HIDDEN_IMPORTS:
        cmd.append(f'--hidden-import={hidden_import}')

    # Debug options
    if debug:
        cmd.append('--debug=imports')
    else:
        cmd.append('--optimize=2')

    print("=" * 80)
    print("🔨 Building DAS CRM Windows Application")
    print("=" * 80)
    print(f"\n📝 Configuration:")
    print(f"   Main script: {MAIN_SCRIPT}")
    print(f"   Output dir: {DIST_DIR}")
    print(f"   Work dir: {BUILD_DIR}")
    print(f"   Spec dir: {SPEC_DIR}")
    print(f"   Hidden imports: {len(HIDDEN_IMPORTS)}")
    print(f"   Debug mode: {debug}")
    print()

    # Run PyInstaller
    try:
        print("🚀 Starting PyInstaller...\n")
        result = subprocess.run(cmd, check=True)

        if result.returncode == 0:
            print("\n✅ Build completed successfully!")
            print(f"📦 Output: {DIST_DIR / 'DASCRM.exe'}")
            return True
        else:
            print(f"\n❌ Build failed with return code {result.returncode}")
            return False

    except subprocess.CalledProcessError as e:
        print(f"\n❌ Build failed: {e}")
        return False
    except FileNotFoundError:
        print("\n❌ PyInstaller not found!")
        print("   Install with: pip install pyinstaller")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────────────
# VERIFICATION & TESTING
# ─────────────────────────────────────────────────────────────────────────────────────

def verify_build():
    """Verify build integrity"""
    exe_path = DIST_DIR / 'DASCRM.exe'

    print("\n" + "=" * 80)
    print("🔍 Verifying Build")
    print("=" * 80 + "\n")

    if not exe_path.exists():
        print(f"❌ Build artifact not found: {exe_path}")
        return False

    # Check file size
    file_size_mb = exe_path.stat().st_size / (1024 * 1024)
    print(f"✅ Build artifact found")
    print(f"   File: {exe_path}")
    print(f"   Size: {file_size_mb:.2f} MB")
    print()

    # Expected size range for PyQt6 + dependencies
    if file_size_mb < 50:
        print(f"⚠️  WARNING: Executable seems too small ({file_size_mb:.2f} MB)")
        print("   This might indicate missing dependencies")
        return False
    elif file_size_mb > 500:
        print(f"⚠️  WARNING: Executable is large ({file_size_mb:.2f} MB)")
        print("   This is normal for PyQt6 applications")

    print(f"\n✅ Verification passed!")
    return True


# ─────────────────────────────────────────────────────────────────────────────────────
# CLEANUP
# ─────────────────────────────────────────────────────────────────────────────────────

def cleanup():
    """Clean build artifacts"""
    print("\n" + "=" * 80)
    print("🧹 Cleanup")
    print("=" * 80 + "\n")

    if BUILD_DIR.exists():
        print(f"Removing: {BUILD_DIR}")
        shutil.rmtree(BUILD_DIR, ignore_errors=True)

    # Keep spec files for reference
    if DIST_DIR.exists() and not (DIST_DIR / 'DASCRM.exe').exists():
        print(f"Removing empty: {DIST_DIR}")
        shutil.rmtree(DIST_DIR, ignore_errors=True)

    print("✅ Cleanup complete\n")


# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────────────

def main():
    """Main build entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Build DAS CRM Windows .exe",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python build_exe_simple.py              # Standard build
  python build_exe_simple.py --debug      # Build with debug info
  python build_exe_simple.py --clean      # Clean build artifacts
  python build_exe_simple.py --verify     # Only verify existing build
        """
    )

    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--clean', action='store_true', help='Clean build artifacts')
    parser.add_argument('--verify', action='store_true', help='Only verify existing build')

    args = parser.parse_args()

    try:
        if args.clean:
            cleanup()
            return 0

        if args.verify:
            success = verify_build()
            return 0 if success else 1

        # Build executable
        success = build_exe(debug=args.debug)

        if success:
            verify_build()

        return 0 if success else 1

    except KeyboardInterrupt:
        print("\n\n⚠️  Build interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
