"""
LeadsView.swift — DAS CRM macOS
Complete Lead Management & Interactive Excel Spreadsheet Data Grid
Feature parity with Android LeadsScreen.tsx

Features:
  1. 📊 Interactive Excel Spreadsheet Data Grid (macOS native)
  2. ⚡ Lead Funnel with 3-Model Lead Routing
  3. 🎯 Leads Collections with search, filters, and inline editing
"""

import SwiftUI

// ─────────────────────────────────────────────────────────────────────────────────────
// DATA MODELS
// ─────────────────────────────────────────────────────────────────────────────────────

struct LeadItem: Identifiable, Codable {
    let id: String
    var name: String
    var email: String
    var phone: String
    var company: String
    var source: String
    var status: String  // NEW LEAD, QUALIFIED, IN NEGOTIATION, WON, PROPOSAL
    var value: String
    var assignedRep: String
    var city: String
    var budget: String
    var requirement: String
    var callSyncStatus: String
    var priority: String
}

extension LeadItem {
    static let fallbackLeads: [LeadItem] = [
        LeadItem(id: "lead-1", name: "Rajesh Kumar", email: "rajesh@techcorp.com", phone: "+91 98765 43210",
                company: "TechCorp Ltd", source: "Web Form", status: "PROPOSAL", value: "₹5,20,000",
                assignedRep: "Rajesh Kumar", city: "Mumbai", budget: "50k-1L", requirement: "CRM Enterprise",
                callSyncStatus: "Synced: Today 2:45 PM • Connected", priority: "High"),
        LeadItem(id: "lead-2", name: "Priya Sharma", email: "priya@logitech.com", phone: "+91 98123 45678",
                company: "LogiTech Solutions", source: "Referral", status: "WON", value: "₹3,50,000",
                assignedRep: "Priya Sharma", city: "Bangalore", budget: "1L-5L", requirement: "CRM Suite",
                callSyncStatus: "Synced: Today 1:30 PM • Connected", priority: "High"),
        LeadItem(id: "lead-3", name: "Vikram Mehta", email: "vikram@acme.com", phone: "+91 99876 54321",
                company: "Acme Sales Solutions", source: "Cold Call", status: "QUALIFIED", value: "₹1,42,000",
                assignedRep: "Amit Patel", city: "Delhi", budget: "10k-50k", requirement: "Sales Tools",
                callSyncStatus: "Synced: Today 12:15 PM • Connected", priority: "Medium"),
        LeadItem(id: "lead-4", name: "Sunita Rao", email: "sunita@realestate.com", phone: "+91 97222 11111",
                company: "Real Estate Group", source: "Email", status: "IN NEGOTIATION", value: "₹8,50,000",
                assignedRep: "Rajesh Kumar", city: "Pune", budget: "5L-10L", requirement: "Enterprise Suite",
                callSyncStatus: "Synced: Today 11:00 AM • Connected", priority: "High"),
        LeadItem(id: "lead-5", name: "Amit Patel", email: "amit@globalfreight.com", phone: "+91 96333 22222",
                company: "Global Freight Ltd", source: "Google Ads", status: "NEW LEAD", value: "₹90,000",
                assignedRep: "Priya Sharma", city: "Chennai", budget: "20k-100k", requirement: "Starter Pack",
                callSyncStatus: "Synced: Today 10:30 AM • Connected", priority: "Low"),
    ]
}

enum LeadsSegment: String, CaseIterable {
    case funnel = "⚡ Lead Funnel"
    case collections = "🎯 Leads Collections"
}

enum LeadStatus: String, CaseIterable {
    case all = "ALL"
    case new = "NEW LEAD"
    case qualified = "QUALIFIED"
    case negotiation = "IN NEGOTIATION"
    case won = "WON"
}

// ─────────────────────────────────────────────────────────────────────────────────────
// VIEW MODELS
// ─────────────────────────────────────────────────────────────────────────────────────

@MainActor
class LeadsViewModel: ObservableObject {
    @Published var leads: [LeadItem] = LeadItem.fallbackLeads
    @Published var search: String = ""
    @Published var activeSegment: LeadsSegment = .collections
    @Published var activeFilter: LeadStatus = .all
    @Published var viewMode: String = "EXCEL_GRID"  // EXCEL_GRID or CARD_LIST

    // Column management
    @Published var columnOrder: [String] = ["name", "email", "phone", "company", "source", "status", "value", "assignedRep", "city", "budget", "requirement"]
    @Published var columnNames: [String: String] = [
        "name": "NAME COLUMN",
        "email": "EMAIL COLUMN",
        "phone": "NUMBER / PHONE COLUMN",
        "company": "COMPANY COLUMN",
        "source": "SOURCE",
        "status": "SALES STAGE",
        "value": "LEAD VALUE",
        "assignedRep": "ASSIGNED REP",
        "city": "CITY (CUSTOM)",
        "budget": "BUDGET (CUSTOM)",
        "requirement": "REQUIREMENT (CUSTOM)",
    ]
    @Published var columnWidths: [String: CGFloat] = [
        "name": 140, "email": 175, "phone": 165, "company": 150, "source": 110,
        "status": 125, "value": 115, "assignedRep": 135, "city": 110, "budget": 100, "requirement": 150,
    ]

    // Funnel state
    @Published var strategy: String = "BATCH_QUOTA"
    @Published var quotaCap: Int = 25
    @Published var vanishTimeout: Int = 30

    // Modal states
    @Published var showCreateLeadModal = false
    @Published var showColumnReorderModal = false
    @Published var showGoogleSheetsModal = false
    @Published var showCSVImportModal = false

    var filteredLeads: [LeadItem] {
        leads.filter { lead in
            let passesFilter = activeFilter == .all || lead.status == activeFilter.rawValue
            let passesSearch: Bool
            if search.isEmpty {
                passesSearch = true
            } else {
                let q = search.lowercased()
                passesSearch = lead.name.lowercased().contains(q) ||
                              lead.company.lowercased().contains(q) ||
                              lead.phone.lowercased().contains(q) ||
                              lead.email.lowercased().contains(q) ||
                              lead.status.lowercased().contains(q) ||
                              lead.city.lowercased().contains(q) ||
                              lead.budget.lowercased().contains(q) ||
                              lead.value.lowercased().contains(q) ||
                              lead.assignedRep.lowercased().contains(q)
            }
            return passesFilter && passesSearch
        }
    }

    func createLead(_ lead: LeadItem) {
        leads.insert(lead, at: 0)
    }

    func moveColumnLeft(_ colKey: String) {
        guard let idx = columnOrder.firstIndex(of: colKey), idx > 0 else { return }
        columnOrder.swapAt(idx - 1, idx)
    }

    func moveColumnRight(_ colKey: String) {
        guard let idx = columnOrder.firstIndex(of: colKey), idx < columnOrder.count - 1 else { return }
        columnOrder.swapAt(idx + 1, idx)
    }

    func toggleColumnWidth(_ colKey: String) {
        let current = columnWidths[colKey] ?? 140
        let next = current == 140 ? 210 : (current == 210 ? 280 : 140)
        columnWidths[colKey] = next
    }
}

// ─────────────────────────────────────────────────────────────────────────────────────
// MAIN VIEW
// ─────────────────────────────────────────────────────────────────────────────────────

struct LeadsView: View {
    @StateObject private var viewModel = LeadsViewModel()

    var body: some View {
        VStack(spacing: 0) {
            // Segmented Picker
            HStack {
                Picker("", selection: $viewModel.activeSegment) {
                    ForEach(LeadsSegment.allCases, id: \.self) { segment in
                        Text(segment.rawValue).tag(segment)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 300)

                Spacer()
            }
            .padding(12)
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            if viewModel.activeSegment == .funnel {
                FunnelView(viewModel: viewModel)
            } else {
                CollectionsView(viewModel: viewModel)
            }
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
    }
}

// ─────────────────────────────────────────────────────────────────────────────────────
// FUNNEL VIEW
// ─────────────────────────────────────────────────────────────────────────────────────

struct FunnelView: View {
    @ObservedObject var viewModel: LeadsViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Title
                VStack(alignment: .leading, spacing: 6) {
                    Text("🔄 Lead Distribution Strategy Engine")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                    Text("Choose how incoming lead traffic is routed across rep quotas.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.top, 16)

                // Strategy Chips
                HStack(spacing: 6) {
                    ForEach(["BATCH_QUOTA", "VANISH_POOL", "MANUAL"], id: \.self) { strategy in
                        let labels = [
                            "BATCH_QUOTA": "📦 Batch Quota (25 Leads/Rep)",
                            "VANISH_POOL": "⏱️ Vanishing Pool (30m Claim)",
                            "MANUAL": "👤 Manual Allocation Only"
                        ]

                        Button(action: { viewModel.strategy = strategy }) {
                            Text(labels[strategy] ?? strategy)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(viewModel.strategy == strategy ? Color(red: 0.62, green: 0.65, blue: 0.98) : Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .background(viewModel.strategy == strategy ? Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.15) : Color(red: 0.02, green: 0.06, blue: 0.12))
                        .border(viewModel.strategy == strategy ? Color(red: 0.62, green: 0.65, blue: 0.98).opacity(0.3) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(8)
                    }
                    Spacer()
                }
                .padding(.horizontal, 16)

                // Ingestion Cards
                VStack(spacing: 10) {
                    ForEach([
                        ("🟢 Google Sheets Live Sync", "1,890 Leads Ingested • Active 2-Way Sync", "Connect Sheet →"),
                        ("📥 CSV / Excel Spreadsheet Uploads", "1,240 Leads Processed • SheetJS Engine", "Import File →")
                    ], id: \.0) { title, desc, btnText in
                        HStack(spacing: 12) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(title)
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)
                                Text(desc)
                                    .font(.system(size: 9))
                                    .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                            }
                            Spacer()
                            Button(action: { viewModel.showGoogleSheetsModal = true }) {
                                Text(btnText)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 0.21, green: 0.81, blue: 0.80))
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                            .border(Color(red: 0.20, green: 0.27, blue: 0.33), width: 1)
                            .cornerRadius(6)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 16)

                Spacer()
            }
            .padding(.vertical, 12)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────────────
// COLLECTIONS VIEW
// ─────────────────────────────────────────────────────────────────────────────────────

struct CollectionsView: View {
    @ObservedObject var viewModel: LeadsViewModel
    @State private var hoveredLeadId: String?

    var body: some View {
        VStack(spacing: 0) {
            // Top Control Bar
            VStack(spacing: 12) {
                // Search Bar
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by name, company, phone, email, status...", text: $viewModel.search)
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

                // Search Counter
                if !viewModel.search.isEmpty {
                    HStack {
                        Text(viewModel.filteredLeads.isEmpty ?
                             "✗ No results found" :
                             "✓ \(viewModel.filteredLeads.count) match\(viewModel.filteredLeads.count == 1 ? "" : "es") found")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(viewModel.filteredLeads.isEmpty ? Color(red: 0.94, green: 0.27, blue: 0.27) : Color(red: 0.2, green: 0.83, blue: 0.60))
                        Spacer()
                    }
                    .padding(.horizontal, 4)
                }

                // Action Buttons
                HStack(spacing: 6) {
                    Button(action: { viewModel.showCreateLeadModal = true }) {
                        Text("+ New Lead")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Button(action: {
                        viewModel.viewMode = viewModel.viewMode == "EXCEL_GRID" ? "CARD_LIST" : "EXCEL_GRID"
                    }) {
                        Text(viewModel.viewMode == "EXCEL_GRID" ? "📊 Excel Grid" : "📱 Card View")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.00, green: 0.50, blue: 0.78))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Button(action: { viewModel.showColumnReorderModal = true }) {
                        Text("🔀 Reorder")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.65, green: 0.68, blue: 0.99))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.15))
                            .border(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.3), width: 1)
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Spacer()
                }

                // Filter Chips
                HStack(spacing: 6) {
                    ForEach(LeadStatus.allCases, id: \.self) { status in
                        Button(action: { viewModel.activeFilter = status }) {
                            Text(status.rawValue)
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(viewModel.activeFilter == status ? Color(red: 0.62, green: 0.65, blue: 0.98) : Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(viewModel.activeFilter == status ? Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.2) : Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(viewModel.activeFilter == status ? Color(red: 0.62, green: 0.65, blue: 0.98) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(6)
                    }
                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Excel Grid or Card View
            if viewModel.viewMode == "EXCEL_GRID" {
                ExcelGridView(viewModel: viewModel)
            } else {
                CardListView(viewModel: viewModel)
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────────────
// EXCEL GRID VIEW
// ─────────────────────────────────────────────────────────────────────────────────────

struct ExcelGridView: View {
    @ObservedObject var viewModel: LeadsViewModel

    var body: some View {
        ScrollView([.horizontal, .vertical]) {
            VStack(spacing: 0) {
                // Header Row
                HStack(spacing: 0) {
                    ForEach(viewModel.columnOrder, id: \.self) { colKey in
                        let colWidth = viewModel.columnWidths[colKey] ?? 140

                        HStack(spacing: 4) {
                            VStack(alignment: .leading, spacing: 0) {
                                Text(viewModel.columnNames[colKey] ?? colKey)
                                    .font(.system(size: 10, weight: .heavy))
                                    .foregroundColor(Color(red: 0.62, green: 0.65, blue: 0.98))
                                    .lineLimit(1)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            // Shift buttons
                            HStack(spacing: 2) {
                                Button(action: { viewModel.moveColumnLeft(colKey) }) {
                                    Text("←")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(Color(red: 0.21, green: 0.81, blue: 0.80))
                                }
                                .buttonStyle(.plain)
                                .padding(2)
                                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                .border(Color(red: 0.20, blue: 0.27, green: 0.33), width: 1)
                                .cornerRadius(4)
                                .disabled(viewModel.columnOrder.first == colKey)
                                .opacity(viewModel.columnOrder.first == colKey ? 0.3 : 1)

                                Button(action: { viewModel.moveColumnRight(colKey) }) {
                                    Text("→")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(Color(red: 0.21, green: 0.81, blue: 0.80))
                                }
                                .buttonStyle(.plain)
                                .padding(2)
                                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                .border(Color(red: 0.20, green: 0.27, blue: 0.33), width: 1)
                                .cornerRadius(4)
                                .disabled(viewModel.columnOrder.last == colKey)
                                .opacity(viewModel.columnOrder.last == colKey ? 0.3 : 1)
                            }

                            // Width resizer
                            Button(action: { viewModel.toggleColumnWidth(colKey) }) {
                                Text("│↔│")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                            }
                            .buttonStyle(.plain)
                            .padding(2)
                            .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                            .cornerRadius(4)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .frame(width: colWidth, alignment: .leading)
                        .background(Color(red: 0.05, green: 0.08, blue: 0.15))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    }
                }
                .background(Color(red: 0.05, green: 0.08, blue: 0.15))

                // Data Rows
                ForEach(Array(viewModel.filteredLeads.enumerated()), id: \.element.id) { idx, lead in
                    HStack(spacing: 0) {
                        ForEach(viewModel.columnOrder, id: \.self) { colKey in
                            let colWidth = viewModel.columnWidths[colKey] ?? 140
                            let value = Self.getCellValue(lead, colKey: colKey)
                            let color = Self.getCellColor(colKey: colKey, value: value)

                            Text(value)
                                .font(.system(size: 11, weight: colKey == "value" ? .heavy : .semibold))
                                .foregroundColor(color)
                                .lineLimit(1)
                                .frame(width: colWidth, alignment: .leading)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 8)
                                .background(idx % 2 == 0 ? Color(red: 0.06, green: 0.08, blue: 0.14) : Color(red: 0.04, green: 0.07, blue: 0.12))
                                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        }
                    }
                    .frame(height: 48)
                }
            }
        }
    }

    static func getCellValue(_ lead: LeadItem, colKey: String) -> String {
        switch colKey {
        case "name": return lead.name
        case "email": return lead.email
        case "phone": return lead.phone
        case "company": return lead.company
        case "source": return lead.source
        case "status": return lead.status
        case "value": return lead.value
        case "assignedRep": return lead.assignedRep
        case "city": return lead.city
        case "budget": return lead.budget
        case "requirement": return lead.requirement
        default: return ""
        }
    }

    static func getCellColor(colKey: String, value: String) -> Color {
        switch colKey {
        case "email": return Color(red: 0.21, green: 0.81, blue: 0.80)
        case "phone": return Color(red: 0.2, green: 0.83, blue: 0.60)
        case "value": return Color(red: 0.2, green: 0.83, blue: 0.60)
        case "status":
            if value.contains("WON") {
                return Color(red: 0.2, green: 0.83, blue: 0.60)
            } else if value.contains("NEGOTIATION") {
                return Color(red: 0.98, green: 0.75, blue: 0.14)
            } else {
                return Color(red: 0.50, green: 0.53, blue: 0.98)
            }
        default: return Color(red: 0.82, green: 0.82, blue: 0.84)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────────────
// CARD LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────────────

struct CardListView: View {
    @ObservedObject var viewModel: LeadsViewModel

    var body: some View {
        List {
            ForEach(viewModel.filteredLeads) { lead in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(lead.name)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)

                        Spacer()

                        Text(lead.status)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Self.getStatusColor(lead.status))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Self.getStatusBackground(lead.status))
                            .cornerRadius(4)
                    }

                    Text("\(lead.company) • \(lead.email)")
                        .font(.system(size: 11))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(lead.value)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                            Text(lead.phone)
                                .font(.system(size: 10))
                                .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                        }
                        Spacer()
                    }
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .cornerRadius(8)
            }
        }
        .listStyle(.plain)
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
    }

    static func getStatusColor(_ status: String) -> Color {
        switch status {
        case "WON": return Color(red: 0.2, green: 0.83, blue: 0.60)
        case "IN NEGOTIATION": return Color(red: 0.98, green: 0.75, blue: 0.14)
        default: return Color(red: 0.50, green: 0.53, blue: 0.98)
        }
    }

    static func getStatusBackground(_ status: String) -> Color {
        switch status {
        case "WON": return Color(red: 0.2, green: 0.83, blue: 0.60).opacity(0.15)
        case "IN NEGOTIATION": return Color(red: 0.98, green: 0.75, blue: 0.14).opacity(0.15)
        default: return Color(red: 0.50, green: 0.53, blue: 0.98).opacity(0.15)
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────────────
// PREVIEW
// ─────────────────────────────────────────────────────────────────────────────────────

#Preview {
    LeadsView()
}
