"""
IntegrationsView.swift — DAS CRM macOS
Third-Party Integration Management and Configuration
Feature parity with Android IntegrationsScreen.tsx
"""

import SwiftUI

struct Integration: Identifiable {
    let id: String
    let name: String
    let category: String
    let provider: String
    let status: String
    let lastSyncedAt: String
    let syncEnabled: Bool
    let apiKey: String
}

let integrationCategories = ["CRM", "COMMUNICATION", "ANALYTICS", "PAYMENT", "STORAGE", "OTHER"]

let fallbackIntegrations = [
    Integration(id: "i1", name: "Salesforce Sync", category: "CRM", provider: "Salesforce", status: "ACTIVE", lastSyncedAt: "2 hours ago", syncEnabled: true, apiKey: "****...key1"),
    Integration(id: "i2", name: "Slack Notifications", category: "COMMUNICATION", provider: "Slack", status: "ACTIVE", lastSyncedAt: "1 hour ago", syncEnabled: true, apiKey: "****...key2"),
    Integration(id: "i3", name: "Google Analytics", category: "ANALYTICS", provider: "Google", status: "ACTIVE", lastSyncedAt: "3 hours ago", syncEnabled: true, apiKey: "****...key3"),
    Integration(id: "i4", name: "Stripe Payments", category: "PAYMENT", provider: "Stripe", status: "INACTIVE", lastSyncedAt: "Never", syncEnabled: false, apiKey: "****...key4"),
    Integration(id: "i5", name: "AWS S3 Storage", category: "STORAGE", provider: "Amazon", status: "ACTIVE", lastSyncedAt: "30 minutes ago", syncEnabled: true, apiKey: "****...key5"),
]

@MainActor
class IntegrationsViewModel: ObservableObject {
    @Published var integrations: [Integration] = fallbackIntegrations
    @Published var search: String = ""

    var filteredIntegrations: [Integration] {
        integrations.filter { integration in
            if search.isEmpty {
                return true
            } else {
                let q = search.lowercased()
                return integration.name.lowercased().contains(q) ||
                       integration.provider.lowercased().contains(q)
            }
        }
    }
}

struct IntegrationsView: View {
    @StateObject private var viewModel = IntegrationsViewModel()
    @State private var selectedIntegration: Integration?
    @State private var showIntegrationDetails = false
    @State private var showAddIntegration = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("🔗 Integrations")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by name, provider...", text: $viewModel.search)
                        .textFieldStyle(.plain)
                        .foregroundColor(.white)

                    if !viewModel.search.isEmpty {
                        Button(action: { viewModel.search = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(8)

                // Action buttons
                HStack {
                    Button(action: { showAddIntegration = true }) {
                        Text("🔗 Add Integration")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Integrations Table
            Table(viewModel.filteredIntegrations) {
                TableColumn("Name", value: \.name)
                TableColumn("Provider", value: \.provider)
                TableColumn("Category", value: \.category)
                TableColumn("Status") { integration in
                    Text(integration.status)
                        .foregroundColor(
                            integration.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                            integration.status == "INACTIVE" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                            Color(red: 0.98, green: 0.30, blue: 0.40)
                        )
                }
                TableColumn("Last Synced", value: \.lastSyncedAt)
                TableColumn("Action") { integration in
                    Button(action: {
                        selectedIntegration = integration
                        showIntegrationDetails = true
                    }) {
                        Text("👁️ View")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .cornerRadius(4)
                    }
                    .buttonStyle(.plain)
                }
            }
            .background(Color(red: 0.03, green: 0.04, blue: 0.07))
            .onDoubleClickSelectAll(false)
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Integrations")
        .sheet(isPresented: $showIntegrationDetails) {
            if let integration = selectedIntegration {
                IntegrationDetailsSheet(integration: integration, isPresented: $showIntegrationDetails)
            }
        }
        .sheet(isPresented: $showAddIntegration) {
            AddIntegrationSheet(integrations: $viewModel.integrations, isPresented: $showAddIntegration)
        }
    }
}

struct IntegrationDetailsSheet: View {
    let integration: Integration
    @Binding var isPresented: Bool
    @State private var showTestAlert = false
    @State private var showDisconnectAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("🔗 \(integration.name)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Spacer()

                        Text(integration.status)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(
                                integration.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                integration.status == "INACTIVE" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)
                            )
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                (integration.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                integration.status == "INACTIVE" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)).opacity(0.15)
                            )
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Integration Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📋 Integration Details")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Name", value: integration.name)
                        DetailRow(label: "Provider", value: integration.provider)
                        DetailRow(label: "Category", value: integration.category)
                        DetailRow(label: "Status", value: integration.status)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Sync Status
                    VStack(alignment: .leading, spacing: 8) {
                        Text("🔄 Sync Status")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Auto Sync", value: integration.syncEnabled ? "Enabled" : "Disabled")
                        DetailRow(label: "Last Synced", value: integration.lastSyncedAt)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: { showTestAlert = true }) {
                            Text("🧪 Test")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                                .cornerRadius(6)
                        }
                        Button(action: { showDisconnectAlert = true }) {
                            Text("🔌 Disconnect")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.98, green: 0.30, blue: 0.40))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Integration Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("🧪 Test Connection", isPresented: $showTestAlert) {
                Button("OK") { }
            } message: {
                Text("Testing \(integration.name) connection...")
            }
            .alert("🔌 Disconnect", isPresented: $showDisconnectAlert) {
                Button("Disconnect", role: .destructive) { }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("Disconnect \(integration.name) from DAS CRM?")
            }
        }
    }
}

struct AddIntegrationSheet: View {
    @Binding var integrations: [Integration]
    @Binding var isPresented: Bool

    @State private var name = ""
    @State private var provider = "Salesforce"
    @State private var category = "CRM"
    @State private var apiKey = ""
    @State private var enableSync = true

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("🔗 Add New Integration")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text("Connect a third-party service to DAS CRM.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Integration Name *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. Salesforce Sync", text: $name)
                            .textFieldStyle(.roundedBorder)

                        Text("Provider *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Provider", selection: $provider) {
                            ForEach(["Salesforce", "Slack", "Google", "Stripe", "AWS", "Microsoft", "Other"], id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Text("Category *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Category", selection: $category) {
                            ForEach(integrationCategories, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Text("API Key / Token *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        SecureField("Paste your API key or token", text: $apiKey)
                            .textFieldStyle(.roundedBorder)

                        Toggle("Enable Auto Sync", isOn: $enableSync)
                            .foregroundColor(.white)
                    }

                    Spacer()

                    HStack(spacing: 8) {
                        Button(action: { isPresented = false }) {
                            Text("Cancel")
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                .cornerRadius(6)
                        }
                        Button(action: {
                            let newIntegration = Integration(
                                id: "i-\(UUID())",
                                name: name,
                                category: category,
                                provider: provider,
                                status: "ACTIVE",
                                lastSyncedAt: "Just now",
                                syncEnabled: enableSync,
                                apiKey: "****...key"
                            )
                            integrations.insert(newIntegration, at: 0)
                            isPresented = false
                        }) {
                            Text("Add Integration ✓")
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Add Integration")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text("\(label):")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                .frame(width: 100, alignment: .leading)
            Text(value)
                .font(.system(size: 10))
                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                .lineLimit(2)
            Spacer()
        }
    }
}

#Preview {
    NavigationView {
        IntegrationsView()
    }
}
