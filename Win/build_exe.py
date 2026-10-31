"""
build_exe.py — DAS CRM Windows PyInstaller Build
Produces a single standalone executable: DASCRM-Windows.exe
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
MAIN_SCRIPT = PROJECT_ROOT / "main.py"
DIST_DIR = PROJECT_ROOT / "dist"
BUILD_DIR = PROJECT_ROOT / "build"
SPEC_DIR = PROJECT_ROOT / "build_specs"

SPEC_DIR.mkdir(exist_ok=True)

HIDDEN_IMPORTS = [
    # Core
    'core.api_client',
    'core.auth_api',
    'core.sync_engine',
    'core.permissions',

    # UI — sidebar + login
    'ui.sidebar',
    'ui.login_window',

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
    'ui.views_interior_calculator',

    # PyQt6
    'PyQt6.QtCore',
    'PyQt6.QtGui',
    'PyQt6.QtWidgets',
    'PyQt6.QtCharts',

    # Third-party
    'httpx',
    'pydantic',
]


def clean():
    for d in [BUILD_DIR, DIST_DIR]:
        if d.exists():
            print(f"Removing {d}...")
            shutil.rmtree(d, ignore_errors=True)
    print("Clean complete.")


def build_exe(debug=False) -> bool:
    """Build Windows standalone .exe using PyInstaller via subprocess."""
    exe_name = "DASCRM"
    dist_exe = DIST_DIR / f"{exe_name}.exe"

    if dist_exe.exists():
        try:
            dist_exe.unlink()
        except Exception:
            pass

    args = [
        str(MAIN_SCRIPT),
        '--onefile',
        '--windowed',
        f'--distpath={DIST_DIR}',
        f'--workpath={BUILD_DIR}',
        f'--specpath={SPEC_DIR}',
        f'--name={exe_name}',
    ]

    # Package resources directory (icons, assets)
    res_path = PROJECT_ROOT / 'resources'
    if res_path.exists():
        args.append(f'--add-data={res_path};resources')

    # Collect heavy packages
    for pkg in ['PyQt6', 'httpx', 'pydantic']:
        args.append(f'--collect-all={pkg}')

    # Application icon
    ico_path = PROJECT_ROOT / 'resources' / 'icon.ico'
    if ico_path.exists():
        args.append(f'--icon={ico_path}')

    # Hidden imports
    for imp in HIDDEN_IMPORTS:
        args.append(f'--hidden-import={imp}')

    # Optimization
    if debug:
        args.extend(['--debug=imports', '--log-level=DEBUG'])
    else:
        args.append('--optimize=2')

    print("=" * 60)
    print("DAS CRM — Single Windows Build")
    print("=" * 60)
    print(f"Target : {dist_exe}")
    print(f"Imports: {len(HIDDEN_IMPORTS)} modules")
    print()

    cmd = [sys.executable, "-m", "PyInstaller"] + args
    try:
        res = subprocess.run(cmd, check=True)
        if res.returncode != 0:
            print(f"\n[ERROR] PyInstaller exited with code {res.returncode}")
            return False
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] PyInstaller build failed: {e}")
        return False
    except Exception as e:
        print(f"\n[ERROR] Unexpected error running PyInstaller: {e}")
        return False

    if not dist_exe.exists():
        # Look for any .exe produced in dist
        candidates = list(DIST_DIR.glob("*.exe"))
        if candidates:
            shutil.move(str(candidates[0]), str(dist_exe))
        else:
            print(f"\n[ERROR] Output not found at {dist_exe}")
            return False

    # Keep single canonical standalone executable: DASCRM.exe
    target_win = DIST_DIR / "DASCRM-Windows.exe"
    if target_win.exists() and dist_exe.exists() and target_win != dist_exe:
        try:
            target_win.unlink()
        except Exception:
            pass

    size_mb = dist_exe.stat().st_size / (1024 * 1024)
    print()
    print("=" * 60)
    print("BUILD SUCCESSFUL")
    print(f"File : {dist_exe.name}")
    print(f"Path : {dist_exe}")
    print(f"Size : {size_mb:.1f} MB")
    print("=" * 60)
    return True


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', action='store_true', help="Enable debug imports")
    parser.add_argument('--clean', action='store_true', help="Clean build directories")
    args = parser.parse_args()

    if args.clean:
        clean()
        sys.exit(0)

    clean()
    ok = build_exe(debug=args.debug)
    sys.exit(0 if ok else 1)
