//
// AdminControlView.swift
// DASCRM macOS App SuperAdmin, Manager & HR Control Panel
// Full RBAC governance, audit logging & organization system settings
//

import SwiftUI

public struct AdminControlView: View {
    @State private var selectedTab = 0
    @State private var auditLogs: [AuditLogItem] = [
        AuditLogItem(id: UUID().uuidString, action: "ROLE_TRANSITION", actorName: "Aditya (Super Admin)", role: "SUPER_ADMIN", timestamp: Date(), details: "Promoted Sales Rep to Manager role"),
        AuditLogItem(id: UUID().uuidString, action: "BULK_LEAD_IMPORT", actorName: "Sarah Jenkins", role: "ORG_ADMIN", timestamp: Date().addingTimeInterval(-3600 * 2), details: "Imported 1,450 leads into pipeline"),
        AuditLogItem(id: UUID().uuidString, action: "ORGANIZATION_UPDATE", actorName: "Aditya (Super Admin)", role: "SUPER_ADMIN", timestamp: Date().addingTimeInterval(-86400), details: "Updated API billing & seat limits")
    ]
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Admin & RBAC Control Hub")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("SuperAdmin governance, role transitions, audit logs & organization control")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            
            // Picker Tabs
            Picker("", selection: $selectedTab) {
                Text("Audit Logs").tag(0)
                Text("Role Management").tag(1)
                Text("System Config").tag(2)
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding(.horizontal, 24)
            
            if selectedTab == 0 {
                ScrollView(.vertical, showsIndicators: true) {
                    VStack(spacing: 10) {
                        ForEach(auditLogs) { log in
                            HStack(spacing: 14) {
                                ZStack {
                                    Circle()
                                        .fill(Color.orange.opacity(0.15))
                                        .frame(width: 36, height: 36)
                                    Image(systemName: "shield.fill")
                                        .foregroundColor(.orange)
                                }
                                
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("\(log.action) • \(log.actorName)")
                                        .font(.system(size: 13, weight: .bold))
                                    Text(log.details)
                                        .font(.system(size: 11))
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Text(log.role)
                                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                                    .padding(.horizontal, 6).padding(.vertical, 2)
                                    .background(Color.secondary.opacity(0.12))
                                    .cornerRadius(4)
                            }
                            .padding(12)
                            .background(Color(NSColor.windowBackgroundColor))
                            .cornerRadius(10)
                        }
                    }
                    .padding(.horizontal, 24)
                }
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    Text("RBAC Role Matrix & Access Control")
                        .font(.system(size: 16, weight: .bold))
                    Text("Configure permissions for SuperAdmin, OrgAdmin, Manager, Team Leader, and Sales Exec roles.")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                }
                .padding(24)
                .background(Color(NSColor.windowBackgroundColor))
                .cornerRadius(12)
                .padding(.horizontal, 24)
            }
            
            Spacer()
        }
    }
}
