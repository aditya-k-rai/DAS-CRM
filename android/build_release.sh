#!/usr/bin/env bash
# build_release.sh — Build Single Universal Release APK for DAS CRM Android
# Usage: ./build_release.sh [clean]
# Must be run from the android/ directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

# Clean if requested
if [ "$1" == "clean" ]; then
  echo "Cleaning build directories..."
  rm -rf android/app/build
  rm -rf android/build
  echo "Clean complete."
fi

echo ""
echo "============================================================"
echo "  DAS CRM — Building Single Universal Release APK"
echo "  (Compatible with 100% of Android phones & emulators)"
echo "============================================================"
echo ""

cd "$SCRIPT_DIR/android"
./gradlew assembleRelease \
  -PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86,x86_64 \
  -PreactNativeArchitecturesOnly=false \
  --no-daemon

UNIV_APK=$(find app/build/outputs/apk -name "*.apk" 2>/dev/null | head -1)
if [ -f "$UNIV_APK" ]; then
  DEST="$SCRIPT_DIR/android/app/build/outputs/apk/release/app-universal-release.apk"
  cp "$UNIV_APK" "$DEST" 2>/dev/null || true
  echo ""
  echo "============================================================"
  echo "  ✓ Universal APK Built Successfully!"
  echo "  Location: $UNIV_APK"
  echo "============================================================"
else
  echo ""
  echo "✗ Universal APK build failed."
  exit 1
fi

