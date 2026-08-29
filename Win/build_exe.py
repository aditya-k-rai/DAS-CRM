"""
build_exe.py — DAS CRM Windows PyInstaller Build
"""
import os
import sys
from pathlib import Path
import PyInstaller.__main__

PROJECT_ROOT = Path(__file__).parent
MAIN_SCRIPT = PROJECT_ROOT / "main.py"
DIST_DIR = PROJECT_ROOT / "dist"
BUILD_DIR = PROJECT_ROOT / "build"
SPEC_DIR = PROJECT_ROOT / "build_specs"

SPEC_DIR.mkdir(exist_ok=True)

HIDDEN_IMPORTS = [
    # Core
    'core.api_client',
    'core.sync_engine',

    # UI — sidebar
    'ui.sidebar',

    # UI — views (all in ui/ directory)
    'ui.views',
    'ui.views_dashboard',
    'ui.views_leads',
    'ui.views_deals',
    'ui.views_quotations',
    'ui.views_products',
    'ui.views_contacts',
    'ui.views_reports',
    'ui.views_automation',
    'ui.views_communications',
    'ui.views_hr',
    'ui.views_integrations',
    'ui.views_admin',
    'ui.views_settings',
    'ui.views_help',
    'ui.views_add_company',
    'ui.views_add_party',
    'ui.views_create_quotation',

    # PyQt6
    'PyQt6.QtCore',
    'PyQt6.QtGui',
    'PyQt6.QtWidgets',
    'PyQt6.QtCharts',

    # Third-party
    'httpx',
    'pydantic',
    'pydantic_settings',
    'pydantic-settings',
    'aiofiles',
    'python_dotenv',
]


def build_exe(debug=False):
    """Build Windows .exe using PyInstaller."""
    args = [
        str(MAIN_SCRIPT),
        '--onefile',
        '--windowed',
        f'--distpath={DIST_DIR}',
        f'--workpath={BUILD_DIR}',
        f'--specpath={SPEC_DIR}',
        '--name=DASCRM',
    ]

    # Collect all for heavy deps
    for pkg in ['PyQt6', 'httpx', 'pydantic', 'pydantic_settings', 'aiofiles']:
        args.append(f'--collect-all={pkg}')

    # Icon
    ico_path = PROJECT_ROOT / 'resources' / 'icon.ico'
    if ico_path.exists():
        args.append(f'--icon={ico_path}')

    # Hidden imports
    for imp in HIDDEN_IMPORTS:
        args.append(f'--hidden-import={imp}')

    # Debug / Release
    if debug:
        args.extend(['--debug=imports', '--log-level=DEBUG'])
    else:
        args.append('--optimize=2')

    print("=" * 60)
    print("DAS CRM — Windows Build")
    print("=" * 60)
    print(f"Output : {DIST_DIR / 'DASCRM.exe'}")
    print(f"Imports: {len(HIDDEN_IMPORTS)} modules")
    print()

    try:
        PyInstaller.__main__.run(args)
        print()
        print("=" * 60)
        print("BUILD SUCCESSFUL")
        print("=" * 60)
        _verify_build()
        return True
    except Exception as e:
        print(f"\nBUILD FAILED: {e}")
        return False


def _verify_build():
    """Verify build artifact."""
    exe_path = DIST_DIR / 'DASCRM.exe'
    if not exe_path.exists():
        print(f"ERROR: {exe_path} not found")
        return
    size_mb = exe_path.stat().st_size / (1024 * 1024)
    print(f"File  : {exe_path}")
    print(f"Size  : {size_mb:.1f} MB")
    if size_mb < 80:
        print("WARNING: File is unusually small — some imports may be missing")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true')
    parser.add_argument('--clean', action='store_true')
    args = parser.parse_args()

    if args.clean:
        import shutil
        for d in [BUILD_DIR, DIST_DIR]:
            if d.exists():
                print(f"Removing {d}...")
                shutil.rmtree(d)
        print("Clean complete.")
        sys.exit(0)

    ok = build_exe(debug=args.debug)
    sys.exit(0 if ok else 1)
