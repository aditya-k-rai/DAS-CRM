//
// LeadsMainView.swift
// DASCRM macOS App Leads Engine
// Supports Status Filter Tabs, Search, Quick Lead Creation, Optimistic Sync & 120 FPS Table Scrolling
//

import SwiftUI

public struct LeadsMainView: View {
    @StateObject private var viewModel = LeadsViewModel()
    @State private var showingAddSheet = false
    
    // New Lead Form State
    @State private var newTitle = ""
    @State private var newContact = ""
    @State private var newEmail = ""
    @State private var newPhone = ""
    @State private var newCompany = ""
    @State private var newValueStr = ""
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Header & Actions
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Leads Management Engine")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    
                    Text("Track, qualify and convert inbound CRM prospects")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button(action: { showingAddSheet = true }) {
                    HStack(spacing: 6) {
                        Image(systemName: "plus.circle.fill")
                        Text("Add New Lead")
                    }
                    .font(.system(size: 13, weight: .bold))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Color.accentColor)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            
            // Status Filter Tab Bar
            HStack(spacing: 8) {
                FilterTabChip(title: "All Statuses", isSelected: viewModel.selectedFilter == nil) {
                    viewModel.selectedFilter = nil
                }
                
                ForEach(LeadStatus.allCases) { status in
                    FilterTabChip(title: status.displayName, isSelected: viewModel.selectedFilter == status) {
                        viewModel.selectedFilter = status
                    }
                }
                Spacer()
            }
            .padding(.horizontal, 24)
            
            // Leads Data List / Table
            ScrollView(.vertical, showsIndicators: true) {
                LazyVStack(spacing: 10) {
                    ForEach(viewModel.filteredLeads) { lead in
                        LeadRowView(lead: lead) { newStatus in
                            viewModel.updateLeadStatus(id: lead.id, newStatus: newStatus)
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
        .sheet(isPresented: $showingAddSheet) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Create New Lead")
                    .font(.system(size: 18, weight: .bold))
                
                TextField("Lead Title / Opportunity", text: $newTitle)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                TextField("Contact Name", text: $newContact)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                HStack {
                    TextField("Email Address", text: $newEmail)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    TextField("Phone Number", text: $newPhone)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                HStack {
                    TextField("Company Name", text: $newCompany)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    TextField("Estimated Value ($)", text: $newValueStr)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                HStack {
                    Spacer()
                    Button("Cancel") { showingAddSheet = false }
                        .keyboardShortcut(.escape, modifiers: [])
                    
                    Button("Save Lead") {
                        let val = Double(newValueStr) ?? 10000.0
                        let lead = Lead(
                            title: newTitle.isEmpty ? "New Business Deal" : newTitle,
                            contactName: newContact.isEmpty ? "Client Contact" : newContact,
                            email: newEmail,
                            phone: newPhone,
                            companyName: newCompany.isEmpty ? "Prospective Enterprise" : newCompany,
                            value: val,
                            status: .new,
                            source: "Direct App Input"
                        )
                        viewModel.addLead(lead)
                        showingAddSheet = false
                        newTitle = ""; newContact = ""; newEmail = ""; newPhone = ""; newCompany = ""; newValueStr = ""
                    }
                    .keyboardShortcut(.return, modifiers: [])
                    .buttonStyle(.borderedProminent)
                }
                .padding(.top, 12)
            }
            .padding(24)
            .frame(width: 480)
        }
    }
}

struct FilterTabChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: isSelected ? .bold : .medium))
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(isSelected ? Color.accentColor : Color.secondary.opacity(0.12))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(16)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct LeadRowView: View {
    let lead: Lead
    let onStatusChange: (LeadStatus) -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.blue.opacity(0.15))
                    .frame(width: 42, height: 42)
                
                Image(systemName: "briefcase.fill")
                    .foregroundColor(.blue)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(lead.title)
                    .font(.system(size: 14, weight: .bold))
                
                Text("\(lead.contactName) • \(lead.companyName) • \(lead.email)")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                Text("$\(Int(lead.value))")
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                
                Menu {
                    ForEach(LeadStatus.allCases) { st in
                        Button(st.displayName) {
                            onStatusChange(st)
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(lead.status.displayName)
                        Image(systemName: "chevron.down")
                    }
                    .font(.system(size: 11, weight: .semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.accentColor.opacity(0.12))
                    .foregroundColor(.accentColor)
                    .cornerRadius(6)
                }
                .menuStyle(BorderlessButtonMenuStyle())
            }
        }
        .padding(14)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.02), radius: 3, x: 0, y: 1)
    }
}
