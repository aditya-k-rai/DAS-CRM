"""
build_all.py — DAS CRM Windows Build Runner
Delegates to build_exe.py to produce a single standalone DASCRM-Windows.exe.
"""
import sys
from pathlib import Path
from build_exe import build_exe, clean

if __name__ == '__main__':
    clean()
    ok = build_exe(debug='--debug' in sys.argv)
    sys.exit(0 if ok else 1)
