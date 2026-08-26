"""
AutomationsView.swift — DAS CRM macOS
Workflow Automation Engine with Rules and Triggers
Feature parity with Android AutomationsScreen.tsx
"""

import SwiftUI

struct AutomationRule: Identifiable {
    let id: String
    let name: String
    let description: String
    let trigger: String
    let action: String
    let isActive: Bool
    let executionCount: Int
    let lastExecuted: String
}

let automationTriggers = [
    "LEAD_CREATED",
    "DEAL_UPDATED",
    "EMAIL_OPENED",
    "CALL_COMPLETED",
    "MEETING_SCHEDULED",
    "QUOTATION_SENT",
]

let automationActions = [
    "SEND_EMAIL",
    "ASSIGN_TASK",
    "UPDATE_FIELD",
    "NOTIFY_TEAM",
    "CREATE_ACTIVITY",
    "SEND_SMS",
]

let fallbackAutomations = [
    AutomationRule(id: "a1", name: "Auto-assign new leads", description: "Automatically assign leads to sales reps",
                  trigger: "LEAD_CREATED", action: "ASSIGN_TASK", isActive: true, executionCount: 342, lastExecuted: "2 hours ago"),
    AutomationRule(id: "a2", name: "Send follow-up email", description: "Send email 24h after lead creation",
                  trigger: "LEAD_CREATED", action: "SEND_EMAIL", isActive: true, executionCount: 156, lastExecuted: "1 day ago"),
    AutomationRule(id: "a3", name: "Update deal stage", description: "Auto-update deal status based on activity",
                  trigger: "CALL_COMPLETED", action: "UPDATE_FIELD", isActive: true, executionCount: 89, lastExecuted: "3 days ago"),
    AutomationRule(id: "a4", name: "Meeting notification", description: "Notify team when meeting is scheduled",
                  trigger: "MEETING_SCHEDULED", action: "NOTIFY_TEAM", isActive: false, executionCount: 0, lastExecuted: "Never"),
    AutomationRule(id: "a5", name: "Quotation reminder", description: "Send reminder 3 days before quotation expires",
                  trigger: "QUOTATION_SENT", action: "SEND_EMAIL", isActive: true, executionCount: 23, lastExecuted: "5 days ago"),
]

@MainActor
class AutomationsViewModel: ObservableObject {
    @Published var automations: [AutomationRule] = fallbackAutomations
    @Published var search: String = ""

    var filteredAutomations: [AutomationRule] {
        automations.filter { automation in
            if search.isEmpty {
                return true
            } else {
                let q = search.lowercased()
                return automation.name.lowercased().contains(q) ||
                       automation.trigger.lowercased().contains(q) ||
                       automation.action.lowercased().contains(q)
            }
        }
    }
}

struct AutomationsView: View {
    @StateObject private var viewModel = AutomationsViewModel()
    @State private var selectedAutomation: AutomationRule?
    @State private var showAutomationDetails = false
    @State private var showCreateAutomation = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("⚙️ Workflow Automations")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by rule name, trigger...", text: $viewModel.search)
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
                    Button(action: { showCreateAutomation = true }) {
                        Text("➕ New Automation")
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

            // Automations Table
            Table(viewModel.filteredAutomations) {
                TableColumn("Rule Name", value: \.name)
                TableColumn("Trigger", value: \.trigger)
                TableColumn("Action", value: \.action)
                TableColumn("Status") { automation in
                    Text(automation.isActive ? "ACTIVE" : "INACTIVE")
                        .foregroundColor(automation.isActive ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.30, blue: 0.40))
                }
                TableColumn("Executions") { automation in
                    Text(String(automation.executionCount))
                        .foregroundColor(Color(red: 0.38, green: 0.65, blue: 0.98))
                }
                TableColumn("Last Run", value: \.lastExecuted)
                TableColumn("Action") { automation in
                    Button(action: {
                        selectedAutomation = automation
                        showAutomationDetails = true
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
        .navigationTitle("Automations")
        .sheet(isPresented: $showAutomationDetails) {
            if let automation = selectedAutomation {
                AutomationDetailsSheet(automation: automation, isPresented: $showAutomationDetails)
            }
        }
        .sheet(isPresented: $showCreateAutomation) {
            CreateAutomationSheet(automations: $viewModel.automations, isPresented: $showCreateAutomation)
        }
    }
}

struct AutomationDetailsSheet: View {
    let automation: AutomationRule
    @Binding var isPresented: Bool
    @State private var showEditAlert = false
    @State private var showToggleAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("⚙️ \(automation.name)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Spacer()

                        Text(automation.isActive ? "ACTIVE" : "INACTIVE")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(automation.isActive ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.30, blue: 0.40))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                (automation.isActive ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.30, blue: 0.40)).opacity(0.15)
                            )
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Automation Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📋 Automation Details")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Name", value: automation.name)
                        DetailRow(label: "Description", value: automation.description)
                        DetailRow(label: "Trigger", value: automation.trigger)
                        DetailRow(label: "Action", value: automation.action)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Statistics
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📊 Statistics")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Executions", value: String(automation.executionCount))
                        DetailRow(label: "Last Run", value: automation.lastExecuted)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: { showEditAlert = true }) {
                            Text("✏️ Edit")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.98, green: 0.58, blue: 0.09))
                                .cornerRadius(6)
                        }
                        Button(action: { showToggleAlert = true }) {
                            Text("🔄 Toggle")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Automation Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("✏️ Edit Automation", isPresented: $showEditAlert) {
                Button("OK") { }
            } message: {
                Text("Editing \(automation.name)...")
            }
            .alert("🔄 Toggle Automation", isPresented: $showToggleAlert) {
                Button("OK") { }
            } message: {
                Text("Toggling \(automation.name)...")
            }
        }
    }
}

struct CreateAutomationSheet: View {
    @Binding var automations: [AutomationRule]
    @Binding var isPresented: Bool

    @State private var name = ""
    @State private var description = ""
    @State private var selectedTrigger = "LEAD_CREATED"
    @State private var selectedAction = "SEND_EMAIL"
    @State private var isActive = true

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("➕ Create New Automation")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text("Set up a new workflow automation rule.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Rule Name *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. Auto-assign new leads", text: $name)
                            .textFieldStyle(.roundedBorder)

                        Text("Description")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("What does this automation do?", text: $description)
                            .textFieldStyle(.roundedBorder)

                        Text("When (Trigger) *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Trigger", selection: $selectedTrigger) {
                            ForEach(automationTriggers, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Text("Then (Action) *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Action", selection: $selectedAction) {
                            ForEach(automationActions, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Toggle("Activate immediately", isOn: $isActive)
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
                            let newAutomation = AutomationRule(
                                id: "a-\(UUID())",
                                name: name,
                                description: description,
                                trigger: selectedTrigger,
                                action: selectedAction,
                                isActive: isActive,
                                executionCount: 0,
                                lastExecuted: "Just now"
                            )
                            automations.insert(newAutomation, at: 0)
                            isPresented = false
                        }) {
                            Text("Create Automation ✓")
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
            .navigationTitle("New Automation")
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
        AutomationsView()
    }
}
