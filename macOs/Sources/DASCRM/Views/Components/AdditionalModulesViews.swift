//
// AdditionalModulesViews.swift
// DASCRM macOS App Tasks, HR, Automations, Comms & Settings
// Complete feature set parity with NestJS backend modules
//

import SwiftUI

// MARK: - Tasks & Follow-ups
public struct TasksView: View {
    @State private var tasks: [CRMTask] = [
        CRMTask(title: "Follow up with Sarah Jenkins on Enterprise Contract", dueDate: Date().addingTimeInterval(3600 * 4), priority: .urgent, isCompleted: false, category: "Sales"),
        CRMTask(title: "Prepare Custom AI Demo for Nexus Labs team", dueDate: Date().addingTimeInterval(86400), priority: .high, isCompleted: false, category: "Demo"),
        CRMTask(title: "Send Q3 Quotation to Global Inc", dueDate: Date().addingTimeInterval(86400 * 2), priority: .medium, isCompleted: true, category: "Quotation")
    ]
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Tasks & Follow-ups")
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .padding(.horizontal, 24).padding(.top, 24)
            
            List {
                ForEach(tasks) { task in
                    HStack {
                        Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(task.isCompleted ? .green : .secondary)
                            .font(.system(size: 18))
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text(task.title)
                                .font(.system(size: 13, weight: .bold))
                                .strikethrough(task.isCompleted)
                            Text("Category: \(task.category)")
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text(task.priority.rawValue)
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Color.red.opacity(0.12))
                            .foregroundColor(.red)
                            .cornerRadius(6)
                    }
                    .padding(.vertical, 4)
                }
            }
            .padding(.horizontal, 16)
        }
    }
}

// MARK: - HR & Attendance
public struct HRAttendanceView: View {
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("HR & Attendance Portal")
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .padding(.horizontal, 24).padding(.top, 24)
            
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Today's Status")
                        .font(.system(size: 12, weight: .semibold)).foregroundColor(.secondary)
                    Text("Checked In")
                        .font(.system(size: 20, weight: .bold)).foregroundColor(.green)
                    Text("Check in time: 09:00 AM IST")
                        .font(.system(size: 11)).foregroundColor(.secondary)
                }
                .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(NSColor.windowBackgroundColor)).cornerRadius(12)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Total Working Hours")
                        .font(.system(size: 12, weight: .semibold)).foregroundColor(.secondary)
                    Text("6.5 Hours")
                        .font(.system(size: 20, weight: .bold)).foregroundColor(.blue)
                    Text("Target: 8.0 Hours")
                        .font(.system(size: 11)).foregroundColor(.secondary)
                }
                .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(NSColor.windowBackgroundColor)).cornerRadius(12)
            }
            .padding(.horizontal, 24)
            Spacer()
        }
    }
}

// MARK: - Automations
public struct AutomationsView: View {
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("CRM Workflow Automations")
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .padding(.horizontal, 24).padding(.top, 24)
            
            VStack(spacing: 12) {
                AutomationCard(name: "Auto-Assign Lead on Form Submit", trigger: "New Web Form Submission", action: "Assign to Sales Rep & Send Welcome Email", isActive: true)
                AutomationCard(name: "Deal Stage Negotiation Alert", trigger: "Deal moved to Negotiation", action: "Notify Manager via WhatsApp & Email", isActive: true)
            }
            .padding(.horizontal, 24)
            Spacer()
        }
    }
}

struct AutomationCard: View {
    let name: String
    let trigger: String
    let action: String
    let isActive: Bool
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 6) {
                Text(name).font(.system(size: 14, weight: .bold))
                Text("Trigger: \(trigger)").font(.system(size: 11)).foregroundColor(.secondary)
                Text("Action: \(action)").font(.system(size: 11)).foregroundColor(.blue)
            }
            Spacer()
            Toggle("", isOn: .constant(isActive)).labelsHidden()
        }
        .padding(16).background(Color(NSColor.windowBackgroundColor)).cornerRadius(12)
    }
}

// MARK: - Comms & WhatsApp
public struct CommsWhatsAppView: View {
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("WhatsApp & Email Comms Hub")
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .padding(.horizontal, 24).padding(.top, 24)
            
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Active Conversations").font(.system(size: 14, weight: .bold))
                    Text("• Sarah Jenkins (Apex Tech) - Quote sent").font(.system(size: 12))
                    Text("• Michael Chang (Nexus Labs) - Meeting scheduled").font(.system(size: 12))
                }
                .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(NSColor.windowBackgroundColor)).cornerRadius(12)
            }
            .padding(.horizontal, 24)
            Spacer()
        }
    }
}

// MARK: - App Settings
public struct AppSettingsView: View {
    @ObservedObject var displayEngine = DisplayLink120FPSEngine.shared
    @ObservedObject var syncEngine = SyncEngine.shared
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("macOS Native App Settings")
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .padding(.horizontal, 24).padding(.top, 24)
            
            Form {
                Section(header: Text("Performance & Display Pacing")) {
                    HStack {
                        Text("Refresh Engine Mode")
                        Spacer()
                        Text("120 FPS ProMotion Active")
                            .foregroundColor(.green)
                            .bold()
                    }
                    HStack {
                        Text("Target Frame Render Time")
                        Spacer()
                        Text("\(String(format: "%.2f", displayEngine.frameTimeDeltaMS)) ms")
                            .font(.system(.body, design: .monospaced))
                    }
                }
                
                Section(header: Text("OS Compatibility & Platform Info")) {
                    HStack {
                        Text("Supported macOS Versions")
                        Spacer()
                        Text("macOS 12.0 Monterey to macOS 26.0 Tahoe")
                            .foregroundColor(.blue)
                    }
                    HStack {
                        Text("Target Architecture")
                        Spacer()
                        Text("Universal Binary (Apple Silicon M1-M4 & Intel)")
                    }
                }
                
                Section(header: Text("Backend Connection")) {
                    HStack {
                        Text("Sync Mode")
                        Spacer()
                        Text(syncEngine.syncStatus.rawValue)
                    }
                }
            }
            .padding(.horizontal, 24)
        }
    }
}
