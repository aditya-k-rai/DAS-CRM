"""
build_installer.py — DAS CRM Windows Installer Builder
Compiles installer.iss using Inno Setup (ISCC) to produce DASCRM_Setup_v2.0.0.exe
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path

WIN_DIR = Path(__file__).parent.resolve()
DIST_DIR = WIN_DIR / "dist"
INSTALLER_DIR = WIN_DIR / "installer"
ISS_FILE = WIN_DIR / "installer.iss"

# Known locations for ISCC.exe
ISCC_CANDIDATES = [
    Path(r"C:\Users\Mighty\AppData\Local\Programs\Antigravity IDE\resources\app\node_modules\innosetup\bin\ISCC.exe"),
    Path(r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe"),
    Path(r"C:\Program Files\Inno Setup 6\ISCC.exe"),
    Path(r"C:\Program Files (x86)\Inno Setup 5\ISCC.exe"),
    Path(r"C:\Program Files\Inno Setup 5\ISCC.exe"),
]

def find_iscc() -> Path | None:
    # 1. Check PATH
    which_iscc = shutil.which("iscc")
    if which_iscc:
        return Path(which_iscc)

    # 2. Check candidate paths
    for cand in ISCC_CANDIDATES:
        if cand.exists():
            return cand

    return None

def build_installer():
    print("=" * 70)
    print("DAS CRM — Windows Setup Installer Builder")
    print("=" * 70)

    # 1. Verify executable exists in dist/
    exe_target = DIST_DIR / "DASCRM.exe"
    if not exe_target.exists():
        # Check if DASCRM-Windows.exe exists and rename it
        alt_exe = DIST_DIR / "DASCRM-Windows.exe"
        if alt_exe.exists():
            print(f"Renaming {alt_exe.name} -> DASCRM.exe...")
            shutil.copy2(str(alt_exe), str(exe_target))
        else:
            print(f"[ERROR] Executable not found at {exe_target}.")
            print("Please build the executable first using: python build_exe.py")
            return False

    print(f"[OK] Found target executable: {exe_target} ({exe_target.stat().st_size / (1024*1024):.1f} MB)")

    # 2. Find Inno Setup Compiler
    iscc_path = find_iscc()
    if not iscc_path:
        print("[ERROR] Inno Setup compiler (ISCC.exe) not found on this machine.")
        print("Please download and install Inno Setup 6 from https://jrsoftware.org/isdl.php")
        return False

    print(f"[OK] Using Inno Setup Compiler: {iscc_path}")

    # 3. Compile installer.iss
    INSTALLER_DIR.mkdir(exist_ok=True)
    cmd = [str(iscc_path), str(ISS_FILE)]
    print(f"Running: {' '.join(cmd)}")

    try:
        res = subprocess.run(cmd, cwd=str(WIN_DIR), check=True)
        if res.returncode == 0:
            output_files = list(INSTALLER_DIR.glob("*.exe"))
            print("\n" + "=" * 70)
            print("[SUCCESS] Windows Setup Installer built successfully!")
            for f in output_files:
                size_mb = f.stat().st_size / (1024 * 1024)
                print(f"[OUTPUT] Installer: {f} ({size_mb:.2f} MB)")
            print("=" * 70)
            return True
        else:
            print(f"[ERROR] ISCC exited with code {res.returncode}")
            return False
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Inno Setup compilation failed: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False

if __name__ == "__main__":
    ok = build_installer()
    sys.exit(0 if ok else 1)
