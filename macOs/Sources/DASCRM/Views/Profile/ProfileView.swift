"""
ProfileView.swift — DAS CRM macOS
User Profile & Account Settings
Feature parity with Android ProfileScreen.tsx
"""

import SwiftUI

struct ProfileView: View {
    @State private var firstName = "Mighty"
    @State private var lastName = "Rai"
    @State private var email = "mighty@dascrm.com"
    @State private var phone = "+91 98765 43210"
    @State private var organization = "DAS CRM Enterprise"
    @State private var jobTitle = "Tenant Admin"
    @State private var theme = "Dark"
    @State private var language = "English"
    @State private var emailNotifications = true
    @State private var twoFAEnabled = true
    @State private var showSaveAlert = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // 👤 PROFILE HEADER
                HStack(spacing: 16) {
                    Text("👤")
                        .font(.system(size: 48))
                        .frame(width: 80, height: 80)
                        .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                        .cornerRadius(12)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Mighty Rai")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                        Text("👑 Tenant Admin • DAS CRM Enterprise")
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        Text("📧 mighty@dascrm.com")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    }

                    Spacer()

                    Button(action: {}) {
                        Text("✏️ Edit Photo")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                }
                .padding(16)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                // 📋 PERSONAL INFORMATION
                VStack(alignment: .leading, spacing: 12) {
                    Text("📋 Personal Information")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)

                    VStack(spacing: 12) {
                        FormField(label: "First Name", value: $firstName)
                        FormField(label: "Last Name", value: $lastName)
                        FormField(label: "Email Address", value: $email)
                        FormField(label: "Phone Number", value: $phone)
                        FormField(label: "Organization", value: $organization)
                        FormField(label: "Job Title", value: $jobTitle)
                    }
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                // 🔐 ACCOUNT SECURITY
                VStack(alignment: .leading, spacing: 12) {
                    Text("🔐 Account Security")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)

                    // Password section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Password")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Text("Last changed: 45 days ago")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                        Button(action: {}) {
                            Text("🔄 Change Password")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(red: 0.97, green: 0.45, blue: 0.09))
                                .cornerRadius(6)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(10)
                    .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                    .cornerRadius(8)

                    // 2FA section
                    HStack {
                        Text("Two-Factor Authentication (2FA)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Spacer()
                        Toggle("", isOn: $twoFAEnabled)
                            .tint(Color(red: 0.2, green: 0.83, blue: 0.60))
                    }
                    .padding(10)
                    .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                    .cornerRadius(8)

                    // Active sessions
                    HStack {
                        Text("🖥️ Active Sessions: 2 devices")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        Spacer()
                    }
                    .padding(10)
                    .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                    .cornerRadius(8)
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                // ⚙️ PREFERENCES
                VStack(alignment: .leading, spacing: 12) {
                    Text("⚙️ Preferences")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)

                    VStack(spacing: 12) {
                        // Theme picker
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Theme")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                            Picker("Theme", selection: $theme) {
                                Text("🌙 Dark (Default)").tag("Dark")
                                Text("☀️ Light").tag("Light")
                                Text("🎨 Auto (System)").tag("Auto")
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // Language picker
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Language")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                            Picker("Language", selection: $language) {
                                Text("🇬🇧 English").tag("English")
                                Text("🇮🇳 Hindi").tag("Hindi")
                                Text("🇫🇷 French").tag("French")
                                Text("🇪🇸 Spanish").tag("Spanish")
                            }
                            .pickerStyle(.menu)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // Notifications toggle
                        HStack {
                            Text("Email Notifications")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                            Spacer()
                            Toggle("", isOn: $emailNotifications)
                                .tint(Color(red: 0.2, green: 0.83, blue: 0.60))
                        }
                    }
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                // Save button
                HStack {
                    Spacer()
                    Button(action: {
                        showSaveAlert = true
                    }) {
                        Text("💾 Save Changes")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 10)
                            .background(Color(red: 0.2, green: 0.83, blue: 0.60))
                            .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                }

                Spacer()
            }
            .padding(16)
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Profile")
        .alert("✓ Profile Updated", isPresented: $showSaveAlert) {
            Button("OK") { }
        } message: {
            Text("Your profile changes have been saved successfully!")
        }
    }
}

struct FormField: View {
    let label: String
    @Binding var value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
            TextField("", text: $value)
                .textFieldStyle(.roundedBorder)
                .font(.system(size: 10))
                .padding(.vertical, 4)
        }
    }
}

#Preview {
    NavigationView {
        ProfileView()
    }
}
