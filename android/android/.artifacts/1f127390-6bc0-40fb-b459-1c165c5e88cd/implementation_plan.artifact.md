# Fix missing 'expo-module-gradle-plugin'

The project fails to sync because the `expo-module-gradle-plugin` is not found. This plugin is required by several Expo modules (including the `:expo` module) and is located within the `expo-modules-core` package. It needs to be included in the Gradle composite build in `settings.gradle`.

## Proposed Changes

### Build Configuration

#### [MODIFY] [settings.gradle](file:///C:/Users/Mighty/Downloads/DAS%20CRM/android/android/settings.gradle)
Add an `includeBuild` for `expo-module-gradle-plugin` by resolving its path via `expo-modules-core`.

## Verification Plan

### Manual Verification
- Run Gradle sync in Android Studio.
- Verify that the error `Plugin with id 'expo-module-gradle-plugin' not found` is resolved.
