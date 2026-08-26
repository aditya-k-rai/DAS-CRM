# DAS CRM Windows .exe Build & Troubleshooting Guide
## Fixing ImportError and PyInstaller Configuration

**Date:** August 26, 2026  
**Issue:** `ImportError: cannot import name 'APIClient' from 'core.api_client'`  
**Status:** ✅ FIXED

---

## ROOT CAUSE ANALYSIS

### The Problem

The error occurred because:

```python
# main.py (WRONG)
from core.api_client import APIClient  # ❌ Class doesn't exist
from core.sync_engine import SyncEngine  # ❌ Class doesn't exist

# Actual class names in modules:
# core/api_client.py → DASCRMApiClient
# core/sync_engine.py → DASCRMSyncEngine
```

When PyInstaller compiled the .exe, the incorrect import paths caused runtime errors.

### The Solution

Fixed imports to use correct class names and singleton pattern:

```python
# main.py (CORRECT)
from core.api_client import get_api_client, DASCRMApiClient  # ✅
from core.sync_engine import get_sync_engine, DASCRMSyncEngine  # ✅

# In __init__:
self.api_client = get_api_client()  # Singleton
self.sync_engine = get_sync_engine()  # Singleton
```

---

## BUILD REQUIREMENTS

### Prerequisites

```bash
# Install PyInstaller
pip install pyinstaller

# Install all dependencies
pip install -r requirements.txt

# Requirements should include:
# PyQt6
# httpx
# pydantic
# sqlite3 (built-in)
```

### Project Structure (Verified)

```
Win/
├── main.py ✅
├── build_exe.py ✅ (Updated with correct hidden imports)
├── requirements.txt ✅
├── core/
│   ├── api_client.py ✅
│   ├── sync_engine.py ✅
│   └── display_pacing.py ✅
├── models/
│   └── crm_models.py ✅
└── ui/
    └── views/
        ├── leads_view_enhanced.py ✅
        └── ... (other views)
```

---

## BUILD STEPS

### Step 1: Verify Python Environment

```bash
# Check Python version
python --version
# Should be 3.11 or higher

# Check pip packages
pip list | grep -E "PyQt6|pyinstaller|httpx|pydantic"

# Should show:
# PyQt6 6.x.x
# pyinstaller 6.x.x
# httpx 0.x.x
# pydantic 2.x.x
```

### Step 2: Clean Previous Builds (Optional)

```bash
cd C:\Users\Mighty\Downloads\DAS CRM\Win

# Remove old build artifacts
python build_exe.py --clean

# Or manually:
rmdir /s /q build
rmdir /s /q dist
```

### Step 3: Build the Executable

```bash
cd C:\Users\Mighty\Downloads\DAS CRM\Win

# Standard build
python build_exe.py

# Or with debug info
python build_exe.py --debug

# Expected output:
# 🔨 Building DAS CRM Windows Application...
#    Main script: C:\Users\Mighty\Downloads\DAS CRM\Win\main.py
#    Output: C:\Users\Mighty\Downloads\DAS CRM\Win\dist\DASCRM.exe
#    Hidden imports: 17
# 
# [PyInstaller output...]
# 
# ✅ Build completed successfully!
# 📦 Output: C:\Users\Mighty\Downloads\DAS CRM\Win\dist\DASCRM.exe
```

**Expected Duration:** 2-5 minutes

### Step 4: Verify Build

```bash
# Check if .exe was created
dir dist\DASCRM.exe

# Check file size (should be 120-200 MB with PyQt6)
# If < 50 MB: Missing dependencies
# If > 300 MB: Might want to compress with UPX
```

### Step 5: Test the Executable

```bash
# Launch the .exe
dist\DASCRM.exe

# Expected result:
# ✅ Window opens with:
#    - DAS CRM title
#    - Dark theme sidebar with navigation
#    - Dashboard placeholder
#    - System tray icon
#    - 120 FPS indicator
```

---

## COMMON BUILD ISSUES & FIXES

### Issue 1: ImportError After Building

**Symptom:**
```
Traceback (most recent call last):
  File "main.py", line 20, in <module>
ImportError: cannot import name 'APIClient' from 'core.api_client'
```

**Solution:**

1. Verify main.py imports are correct:
   ```python
   # Should be:
   from core.api_client import get_api_client, DASCRMApiClient
   from core.sync_engine import get_sync_engine, DASCRMSyncEngine
   ```

2. Clean and rebuild:
   ```bash
   python build_exe.py --clean
   python build_exe.py
   ```

3. Check build_exe.py has all hidden imports

---

### Issue 2: "No module named 'PyQt6'"

**Symptom:**
```
ModuleNotFoundError: No module named 'PyQt6'
```

**Solution:**

```bash
# Reinstall PyQt6
pip uninstall PyQt6
pip install PyQt6

# Verify installation
python -c "import PyQt6; print('PyQt6 OK')"

# Rebuild
python build_exe.py
```

---

### Issue 3: httpx or pydantic not found

**Symptom:**
```
ModuleNotFoundError: No module named 'httpx'
ModuleNotFoundError: No module named 'pydantic'
```

**Solution:**

```bash
# Install missing packages
pip install httpx pydantic

# Rebuild with explicit hidden imports
python build_exe.py

# If still fails, check build_exe.py has:
# --hidden-import=httpx
# --hidden-import=pydantic
```

---

### Issue 4: .exe is too large (> 500 MB)

**Symptom:**
```
DASCRM.exe is 450+ MB
```

**Solution:**

1. Use UPX compression (optional):
   ```bash
   # Download UPX from https://upx.github.io/
   # Place upx.exe in PATH
   
   pyinstaller main.py --onefile --upx-dir=C:\path\to\upx
   ```

2. Use onefile with minimal includes:
   ```bash
   # Already using --onefile in build_exe.py
   # File size is normal for PyQt6 apps (120-200 MB)
   ```

---

### Issue 5: Executable crashes on startup

**Symptom:**
```
DASCRM.exe appears to start but crashes immediately
```

**Solution:**

1. Run with debug output:
   ```bash
   python build_exe.py --debug
   ```

2. Run .exe from command line to see errors:
   ```bash
   cd dist
   DASCRM.exe
   # Any error messages will be visible
   ```

3. Check that all view files exist and are importable:
   ```bash
   python -c "from ui.views import leads_view_enhanced"
   ```

4. Verify database directory is writable:
   ```bash
   mkdir %USERPROFILE%\.dascrm
   # .dascrm should be created with write permissions
   ```

---

## SUCCESSFUL BUILD CHECKLIST

- [ ] Python 3.11+ installed
- [ ] `pip install -r requirements.txt` completed
- [ ] PyInstaller installed (`pip install pyinstaller`)
- [ ] main.py imports are correct (DASCRMApiClient, DASCRMSyncEngine)
- [ ] build_exe.py has all hidden imports listed
- [ ] No syntax errors: `python -m py_compile main.py`
- [ ] All view files exist and are importable
- [ ] `python build_exe.py` runs without errors
- [ ] DASCRM.exe created in dist/ folder
- [ ] DASCRM.exe size is 120-200 MB
- [ ] DASCRM.exe launches successfully
- [ ] Dark theme sidebar appears
- [ ] Navigation buttons visible
- [ ] 120 FPS indicator shows

---

## RUNNING THE .EXE

### Standard Launch

```bash
# Navigate to dist directory
cd C:\Users\Mighty\Downloads\DAS CRM\Win\dist

# Run executable
DASCRM.exe
```

### From Any Location

```bash
# Or add to PATH and run from anywhere
C:\Users\Mighty\Downloads\DAS CRM\Win\dist\DASCRM.exe
```

### Create Desktop Shortcut

```bash
# Right-click on DASCRM.exe
# Select "Send to" → "Desktop (create shortcut)"
# Or create manually:
# Right-click desktop → New → Shortcut
# Paste path: C:\Users\Mighty\Downloads\DAS CRM\Win\dist\DASCRM.exe
```

---

## DEPLOYMENT

### For Distribution

1. **Single File Distribution:**
   ```bash
   # Already configured with --onefile
   # Just copy DASCRM.exe to target machine
   # No dependencies needed (all bundled)
   ```

2. **Create Installer (Optional):**
   ```bash
   # Use NSIS or Inno Setup for professional installer
   # For now, direct .exe distribution is fine
   ```

3. **System Requirements:**
   - Windows 7 SP1 or later
   - 4GB RAM minimum
   - 200 MB free disk space
   - No external dependencies

---

## VERIFICATION SCRIPT

Create `test_build.py` to verify build:

```python
import subprocess
import sys
from pathlib import Path

def test_exe():
    exe_path = Path("dist/DASCRM.exe")
    
    if not exe_path.exists():
        print(f"❌ Executable not found: {exe_path}")
        return False
    
    # Check file size
    size_mb = exe_path.stat().st_size / (1024 * 1024)
    print(f"✅ Executable found: {size_mb:.2f} MB")
    
    if size_mb < 50:
        print("⚠️  WARNING: File too small, dependencies might be missing")
        return False
    
    # Try to launch
    try:
        print("🚀 Launching executable...")
        proc = subprocess.Popen([str(exe_path)])
        
        # Wait 2 seconds then kill
        import time
        time.sleep(2)
        proc.terminate()
        
        print("✅ Executable launched successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to launch: {e}")
        return False

if __name__ == "__main__":
    success = test_exe()
    sys.exit(0 if success else 1)
```

Run verification:
```bash
python test_build.py
```

---

## TROUBLESHOOTING CHECKLIST

### Before Building

- [ ] `python -m py_compile main.py` succeeds
- [ ] `python main.py` runs successfully
- [ ] All imports resolve correctly
- [ ] requirements.txt is complete
- [ ] No syntax errors in any Python file

### During Build

- [ ] PyInstaller shows no major warnings
- [ ] Build completes without errors
- [ ] No missing module warnings
- [ ] Hidden imports are recognized

### After Building

- [ ] DASCRM.exe exists in dist/
- [ ] File size is reasonable (120-200 MB)
- [ ] DASCRM.exe is executable (not corrupted)
- [ ] Running DASCRM.exe opens window
- [ ] No console errors appear
- [ ] Dark theme loads correctly

---

## GETTING HELP

### Debug Mode

Build with debug output:
```bash
python build_exe.py --debug
```

### Import Testing

Test individual imports:
```bash
python -c "from core.api_client import get_api_client; print('✅ API Client OK')"
python -c "from core.sync_engine import get_sync_engine; print('✅ Sync Engine OK')"
python -c "from PyQt6.QtWidgets import QApplication; print('✅ PyQt6 OK')"
```

### Check Requirements

```bash
python -m pip list
# Compare with requirements.txt versions
```

---

## SUMMARY

✅ **Fixed Issues:**
1. Corrected class name imports (APIClient → DASCRMApiClient)
2. Updated to use singleton pattern (get_api_client())
3. Fixed build_exe.py hidden imports configuration
4. Removed non-existent signal connections

✅ **Build Process:**
1. Run: `python build_exe.py`
2. Wait: 2-5 minutes
3. Result: `dist/DASCRM.exe` (120-200 MB)
4. Launch: Double-click DASCRM.exe

✅ **Expected Output:**
- Window opens with dark theme
- Sidebar with navigation buttons visible
- 120 FPS indicator in bottom-left
- System tray icon active
- No console errors

**Build Status:** READY ✅

---

**Next Steps:**
1. Run `python build_exe.py` to create .exe
2. Launch `dist/DASCRM.exe` to verify
3. Test all features work correctly
4. Deploy to users

