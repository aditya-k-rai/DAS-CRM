"""
DAS CRM Windows Application - PyInstaller Build Script
Generates standalone DASCRM.exe executable for distribution.
"""

import PyInstaller.__main__
import sys
from pathlib import Path


def build_exe():
    """Build standalone Windows executable."""
    root_dir = Path(__file__).parent
    
    PyInstaller.__main__.run([
        str(root_dir / "main.py"),
        "--name=DASCRM",
        "--onefile",
        "--windowed",
        f"--icon={root_dir / 'resources' / 'icon.ico'}" if (root_dir / 'resources' / 'icon.ico').exists() else "",
        f"--distpath={root_dir / 'dist'}",
        f"--buildpath={root_dir / 'build'}",
        f"--specpath={root_dir}",
        "--add-data=resources:resources",
        "--hidden-import=PyQt6.QtCore",
        "--hidden-import=PyQt6.QtGui",
        "--hidden-import=PyQt6.QtWidgets",
        "--hidden-import=pydantic",
        "--hidden-import=httpx",
        "--collect-all=PyQt6",
        "--console=False",
    ])
    
    print(f"✓ Executable built: {root_dir / 'dist' / 'DASCRM.exe'}")


if __name__ == "__main__":
    build_exe()
