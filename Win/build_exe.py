"""
DAS CRM Windows Application - PyInstaller Build Script
Generates standalone DASCRM.exe executable for distribution.
"""

import PyInstaller.__main__
import sys
import os
from pathlib import Path


def build_exe():
    """Build standalone Windows executable."""
    root_dir = Path(__file__).parent

    # Use OS-appropriate separator for --add-data (';' on Windows, ':' on Unix)
    sep = ";" if sys.platform == "win32" else ":"

    args = [
        str(root_dir / "main.py"),
        "--name=DASCRM",
        "--onefile",
        "--windowed",           # --windowed already suppresses the console window
        f"--distpath={root_dir / 'dist'}",
        f"--workpath={root_dir / 'build'}",
        f"--specpath={root_dir}",
        f"--add-data=resources{sep}resources",
        "--hidden-import=PyQt6.QtCore",
        "--hidden-import=PyQt6.QtGui",
        "--hidden-import=PyQt6.QtWidgets",
        "--hidden-import=pydantic",
        "--hidden-import=httpx",
        "--collect-all=PyQt6",
    ]

    # Only pass --icon if the file actually exists (avoid empty-string arg crash)
    icon_path = root_dir / "resources" / "icon.ico"
    if icon_path.exists():
        args.append(f"--icon={icon_path}")

    PyInstaller.__main__.run(args)

    print(f"[OK] Executable built: {root_dir / 'dist' / 'DASCRM.exe'}")


if __name__ == "__main__":
    build_exe()
