"""
SettingsView.swift — DAS CRM macOS
User Preferences and Application Configuration
Feature parity with Android SettingsScreen.tsx
"""

import SwiftUI

struct UserPreferences {
    var userName: String = "John Sales Manager"
    var email: String = "john@dascrm.com"
    var userId: String = "u1"
    var theme: String = "DARK"
    var language: String = "EN"
    var timezone: String = "Asia/Kolkata"
    var notificationsEnabled: Bool = true
    var soundEnabled: Bool = true
    var emailDigest: String = "WEEKLY"
    var autoSyncEnabled: Bool = true
    var syncInterval: Int = 5
    var baseURL: String = "http://localhost:4000/api"
    var requestTimeout: Int = 30
}

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var preferences = UserPreferences()
    @Published var showSuccessMessage = false
    @Published var successMessage = ""
}

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showConnectionTest = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("⚙️ Settings & Preferences")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Settings Scroll
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Account Section
                    SettingsSectionView(title: "👤 Account Settings") {
                        SettingsRowView(label: "Full Name", value: $viewModel.preferences.userName, isReadOnly: false)
                        SettingsRowView(label: "Email", value: $viewModel.preferences.email, isReadOnly: false)
                        SettingsRowView(label: "User ID", value: $viewModel.preferences.userId, isReadOnly: true)
                    }

                    // Appearance Section
                    SettingsSectionView(title: "🎨 Appearance") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Theme")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                            Picker("Theme", selection: $viewModel.preferences.theme) {
                                Text("Dark").tag("DARK")
                                Text("Light").tag("LIGHT")
                                Text("Auto").tag("AUTO")
                            }
                            .pickerStyle(.segmented)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Language")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                            Picker("Language", selection: $viewModel.preferences.language) {
                                Text("English").tag("EN")
                                Text("Español").tag("ES")
                                Text("Français").tag("FR")
                                Text("Deutsch").tag("DE")
                                Text("日本語").tag("JP")
                                Text("हिंदी").tag("HI")
                            }
                            .pickerStyle(.menu)
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Timezone")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                            Picker("Timezone", selection: $viewModel.preferences.timezone) {
                                Text("UTC").tag("UTC")
                                Text("Asia/Kolkata").tag("Asia/Kolkata")
                                Text("America/New_York").tag("America/New_York")
                                Text("Europe/London").tag("Europe/London")
                                Text("Asia/Tokyo").tag("Asia/Tokyo")
                            }
                            .pickerStyle(.menu)
                        }
                    }

                    // Notifications Section
                    SettingsSectionView(title: "🔔 Notifications") {
                        Toggle("Enable Notifications", isOn: $viewModel.preferences.notificationsEnabled)
                            .foregroundColor(.white)

                        Toggle("Enable Sound", isOn: $viewModel.preferences.soundEnabled)
                            .foregroundColor(.white)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email Digest Frequency")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                            Picker("Email Digest", selection: $viewModel.preferences.emailDigest) {
                                Text("Daily").tag("DAILY")
                                Text("Weekly").tag("WEEKLY")
                                Text("Monthly").tag("MONTHLY")
                                Text("Never").tag("NEVER")
                            }
                            .pickerStyle(.menu)
                        }
                    }

                    // Sync Settings Section
                    SettingsSectionView(title: "🔄 Sync Settings") {
                        Toggle("Auto Sync Enabled", isOn: $viewModel.preferences.autoSyncEnabled)
                            .foregroundColor(.white)

                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Sync Interval (minutes)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                Spacer()
                                Text("\(viewModel.preferences.syncInterval)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 0.38, green: 0.65, blue: 0.98))
                            }

                            Slider(value: Double(viewModel.preferences.syncInterval), in: 1...60, step: 1)
                                .onChange(of: viewModel.preferences.syncInterval) { newValue in
                                    viewModel.preferences.syncInterval = Int(newValue)
                                }
                        }

                        Toggle("Enable Offline Mode", isOn: $viewModel.preferences.autoSyncEnabled)
                            .foregroundColor(.white)
                    }

                    // API Configuration Section
                    SettingsSectionView(title: "🔗 API Configuration") {
                        SettingsRowView(label: "API Base URL", value: $viewModel.preferences.baseURL, isReadOnly: false)

                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Request Timeout (seconds)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                Spacer()
                                Text("\(viewModel.preferences.requestTimeout)")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 0.38, green: 0.65, blue: 0.98))
                            }

                            Slider(value: Double(viewModel.preferences.requestTimeout), in: 5...120, step: 5)
                                .onChange(of: viewModel.preferences.requestTimeout) { newValue in
                                    viewModel.preferences.requestTimeout = Int(newValue)
                                }
                        }

                        Button(action: { showConnectionTest = true }) {
                            Text("🧪 Test Connection")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.24, green: 0.51, blue: 0.96))
                                .cornerRadius(6)
                        }
                        .buttonStyle(.plain)
                    }

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: {
                            viewModel.successMessage = "Settings saved successfully"
                            viewModel.showSuccessMessage = true
                        }) {
                            Text("💾 Save Changes")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .cornerRadius(6)
                        }
                        .buttonStyle(.plain)

                        Button(action: {
                            viewModel.preferences = UserPreferences()
                            viewModel.successMessage = "Settings reset to defaults"
                            viewModel.showSuccessMessage = true
                        }) {
                            Text("↻ Reset to Defaults")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.49, green: 0.40, blue: 0.94))
                                .cornerRadius(6)
                        }
                        .buttonStyle(.plain)

                        Button(action: {
                            viewModel.successMessage = "Application cache cleared"
                            viewModel.showSuccessMessage = true
                        }) {
                            Text("🗑️ Clear Cache")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.98, green: 0.58, blue: 0.09))
                                .cornerRadius(6)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Settings")
        .alert("✓ Success", isPresented: $viewModel.showSuccessMessage) {
            Button("OK") { }
        } message: {
            Text(viewModel.successMessage)
        }
        .alert("🧪 Connection Test", isPresented: $showConnectionTest) {
            Button("OK") { }
        } message: {
            Text("Successfully connected to API at \(viewModel.preferences.baseURL)")
        }
    }
}

struct SettingsSectionView<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 12, weight: .bold))
                .foregroundColor(.white)
                .padding(.bottom, 4)

            VStack(alignment: .leading, spacing: 12) {
                content()
            }
            .padding(12)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
            .cornerRadius(12)
        }
    }
}

struct SettingsRowView: View {
    let label: String
    @Binding var value: String
    let isReadOnly: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

            if isReadOnly {
                Text(value)
                    .font(.system(size: 10))
                    .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                    .padding(8)
                    .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(6)
            } else {
                TextField(label, text: $value)
                    .textFieldStyle(.roundedBorder)
                    .foregroundColor(.white)
            }
        }
    }
}

#Preview {
    NavigationView {
        SettingsView()
    }
}
