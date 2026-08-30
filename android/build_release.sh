#!/usr/bin/env bash
# build_release.sh — Build 3 release APKs for DAS CRM Android
# Usage: ./build_release.sh [clean]
# Must be run from the android/ directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$SCRIPT_DIR"

# Clean if requested
if [ "$1" == "clean" ]; then
  echo "Cleaning build directories..."
  rm -rf app/build
  rm -rf build
  rm -rf ../android_bak
  echo "Clean complete."
fi

# Ensure prebuild is up-to-date
if [ ! -d "app/build/outputs/apk" ]; then
  echo "Running expo prebuild..."
  cd "$PROJECT_ROOT"
  npx expo prebuild --clean 2>/dev/null || npx expo prebuild
  cd "$SCRIPT_DIR"
fi

echo ""
echo "============================================================"
echo "  DAS CRM — Building 3 Release APKs"
echo "============================================================"

# ── APK 1: arm64-v8a (arm64) ───────────────────────────────────────
echo ""
echo ">>> [1/3] Building arm64-v8a APK..."
cd "$PROJECT_ROOT/android"
./gradlew assembleRelease \
  -PreactNativeArchitectures=arm64-v8a \
  -PreactNativeArchitecturesOnly=true \
  --no-daemon --quiet 2>&1 | tail -5

ARM64_APK=$(find app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)
if [ -f "$ARM64_APK" ]; then
  DEST="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk"
  cp "$ARM64_APK" "$DEST"
  echo "✓ arm64-v8a APK: $DEST"
else
  echo "✗ arm64-v8a APK build failed"
fi

# ── APK 2: armeabi-v7a (arm32) ─────────────────────────────────────
echo ""
echo ">>> [2/3] Building armeabi-v7a APK..."
./gradlew assembleRelease \
  -PreactNativeArchitectures=armeabi-v7a \
  -PreactNativeArchitecturesOnly=true \
  --no-daemon --quiet 2>&1 | tail -5

ARMV7_APK=$(find app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)
if [ -f "$ARMV7_APK" ]; then
  DEST="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk"
  cp "$ARMV7_APK" "$DEST"
  echo "✓ armeabi-v7a APK: $DEST"
else
  echo "✗ armeabi-v7a APK build failed"
fi

# ── APK 3: Universal (all architectures) ───────────────────────────
echo ""
echo ">>> [3/3] Building Universal APK (all architectures)..."
./gradlew assembleRelease \
  -PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86,x86_64 \
  -PreactNativeArchitecturesOnly=false \
  --no-daemon --quiet 2>&1 | tail -5

UNIV_APK=$(find app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)
if [ -f "$UNIV_APK" ]; then
  DEST="$PROJECT_ROOT/android/app/build/outputs/apk/release/app-universal-release.apk"
  cp "$UNIV_APK" "$DEST"
  echo "✓ Universal APK: $DEST"
else
  echo "✗ Universal APK build failed"
fi

echo ""
echo "============================================================"
echo "  Build Complete"
echo "============================================================"
ls -lh "$PROJECT_ROOT/android/app/build/outputs/apk/release/"*.apk 2>/dev/null || echo "No APKs found."
