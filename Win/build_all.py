"""
build_all.py — DAS CRM Windows Multi-Architecture Build
Produces 3 executables:
  1. DASCRM-x64.exe    (x86_64 / AMD64)
  2. DASCRM-x86.exe    (x86 / 32-bit — requires 32-bit Python runtime)
  3. DASCRM-universal.exe  (all architectures)

Usage:
  python build_all.py          # build all 3
  python build_all.py x64      # build x64 only
  python build_all.py x86      # build x86 only
  python build_all.py universal # build universal only
  python build_all.py --clean  # clean build dirs
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).parent
MAIN_SCRIPT  = PROJECT_ROOT / "main.py"
DIST_DIR     = PROJECT_ROOT / "dist"
BUILD_DIR    = PROJECT_ROOT / "build"
SPEC_DIR     = PROJECT_ROOT / "build_specs"
PYTHON       = sys.executable

# ── Shared hidden imports ────────────────────────────────────────────────────

HIDDEN_IMPORTS = [
    'core.api_client', 'core.sync_engine', 'core.permissions',
    'ui.sidebar', 'ui.login_window',
    'ui.views', 'ui.views_dashboard', 'ui.views_leads', 'ui.views_deals',
    'ui.views_quotations', 'ui.views_products', 'ui.views_contacts',
    'ui.views_reports', 'ui.views_automation', 'ui.views_communications',
    'ui.views_hr', 'ui.views_integrations', 'ui.views_admin',
    'ui.views_settings', 'ui.views_help',
    'ui.views_add_company', 'ui.views_add_party', 'ui.views_create_quotation',
    'PyQt6.QtCore', 'PyQt6.QtGui', 'PyQt6.QtWidgets', 'PyQt6.QtCharts',
    'httpx', 'pydantic',
]

COLLECT_ALL = ['PyQt6', 'httpx', 'pydantic']

# ── Build Arguments ─────────────────────────────────────────────────────────

def _base_args(name: str) -> list[str]:
    """Base PyInstaller arguments for a given output name."""
    args = [
        str(MAIN_SCRIPT),
        '--onefile',
        '--windowed',
        f'--distpath={DIST_DIR}',
        f'--workpath={BUILD_DIR}',
        f'--specpath={SPEC_DIR}',
        f'--name={name}',
    ]
    for pkg in COLLECT_ALL:
        args.append(f'--collect-all={pkg}')
    for imp in HIDDEN_IMPORTS:
        args.append(f'--hidden-import={imp}')
    ico = PROJECT_ROOT / 'resources' / 'icon.ico'
    if ico.exists():
        args.append(f'--icon={ico}')
    return args


# ── Architecture-specific builds ────────────────────────────────────────────

def _clean():
    for d in [BUILD_DIR, DIST_DIR]:
        if d.exists():
            print(f"Removing {d} ...")
            shutil.rmtree(d)
    print("Clean complete.")


def build_x64(debug=False):
    """Build x86_64 (AMD64) executable."""
    print("\n>>> [1/3] Building x86_64 (AMD64)...")
    args = _base_args('DASCRM-x64')
    args.insert(1, '--target-architecture=x86_64')
    if debug:
        args.extend(['--debug=imports', '--log-level=DEBUG'])
    else:
        args.append('--optimize=2')
    _run(args, f'DASCRM-x64.exe', 'x86_64')


def build_x86(debug=False):
    """Build x86 (32-bit) executable.

    Requires 32-bit Python runtime installed on the build machine.
    Falls back gracefully if not available.
    """
    print("\n>>> [2/3] Building x86 (32-bit)...")

    # Check if 32-bit Python is available
    # On a 64-bit-only machine this will fail; check for DLL hints
    import struct
    if struct.calcsize('P') * 8 == 64:
        # We're on 64-bit Python — check for 32-bit python.exe
        try:
            result = subprocess.run(
                ['where', 'python32'],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode != 0:
                # Try Python 3.x in Program Files (x86)
                pf86 = Path(os.environ.get('ProgramFiles(x86)', 'C:\\Program Files (x86)'))
                py32 = pf86 / 'Python' / 'python.exe'
                if not py32.exists():
                    print("  ⚠ Skipping x86 build: 32-bit Python not found.")
                    print("    Install 32-bit Python to enable this build.")
                    return None
        except Exception:
            pass

    args = _base_args('DASCRM-x86')
    args.insert(1, '--target-architecture=x86')
    if debug:
        args.extend(['--debug=imports', '--log-level=DEBUG'])
    else:
        args.append('--optimize=2')

    exe = _run(args, 'DASCRM-x86.exe', 'x86')
    if exe is None:
        print("  ⚠ x86 build skipped — 32-bit Python not available on this machine.")
    return exe


def build_universal(debug=False):
    """Build universal (all architectures) executable."""
    print("\n>>> [3/3] Building Universal (all architectures)...")
    args = _base_args('DASCRM-universal')
    if debug:
        args.extend(['--debug=imports', '--log-level=DEBUG'])
    else:
        args.append('--optimize=2')
    return _run(args, 'DASCRM-universal.exe', 'universal')


def _run(args: list[str], exe_name: str, arch_label: str):
    """Run PyInstaller and verify output."""
    dist_exe = DIST_DIR / exe_name
    if dist_exe.exists():
        dist_exe.unlink()

    print(f"  Running: {' '.join(args[:4])} ... {args[-1]}")
    try:
        from PyInstaller import __main__
        PyInstaller.__main__.run(args)
    except Exception as e:
        print(f"  ✗ BUILD FAILED [{arch_label}]: {e}")
        return None

    if not dist_exe.exists():
        # Fallback: look for any exe in dist
        found = list(DIST_DIR.glob('*.exe'))
        if found:
            shutil.move(str(found[0]), str(dist_exe))
        else:
            print(f"  ✗ Output not found at {dist_exe}")
            return None

    size_mb = dist_exe.stat().st_size / (1024 * 1024)
    print(f"  ✓ {exe_name} — {size_mb:.1f} MB")
    return dist_exe


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        # Build all 3
        _clean()
        results = {}
        results['x64']      = build_x64()
        results['x86']      = build_x86()
        results['universal'] = build_universal()
        _report(results)
        return

    cmd = sys.argv[1].lower()

    if cmd == '--clean':
        _clean()
        return

    _clean()

    if cmd == 'x64':
        r = {'x64': build_x64()}
    elif cmd == 'x86':
        r = {'x86': build_x86()}
    elif cmd == 'universal':
        r = {'universal': build_universal()}
    else:
        print(f"Unknown argument: {cmd}")
        print("Usage: python build_all.py [x64|x86|universal|--clean]")
        return

    _report(r)


def _report(results: dict):
    print()
    print("=" * 60)
    print("  DAS CRM — Build Complete")
    print("=" * 60)
    for arch, exe in results.items():
        if exe:
            size_mb = exe.stat().st_size / (1024 * 1024)
            print(f"  ✓ {exe.name:35s} {size_mb:6.1f} MB")
        else:
            print(f"  ✗ {arch:35s} FAILED or SKIPPED")
    print("=" * 60)


if __name__ == '__main__':
    main()
