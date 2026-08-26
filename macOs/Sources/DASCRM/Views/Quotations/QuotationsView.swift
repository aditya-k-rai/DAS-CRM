"""
QuotationsView.swift — DAS CRM macOS
Quotation & Invoice Builder with Line Items Management
Feature parity with Android QuotationsScreen.tsx
"""

import SwiftUI

struct QuotationLineItem: Identifiable {
    let id: String
    let description: String
    let quantity: Int
    let unitPrice: String
    let total: String
}

struct QuotationItem: Identifiable {
    let id: String
    let quoteNumber: String
    let clientName: String
    let clientEmail: String
    let issueDate: String
    let dueDate: String
    let status: String
    let subtotal: String
    let tax: String
    let total: String
    let items: [QuotationLineItem]
}

let fallbackQuotations = [
    QuotationItem(id: "q1", quoteNumber: "QT-2026-001", clientName: "TechCorp Ltd",
                 clientEmail: "rajesh@techcorp.com", issueDate: "2026-08-20", dueDate: "2026-09-03",
                 status: "SENT", subtotal: "₹1,50,000", tax: "₹27,000", total: "₹1,77,000",
                 items: [
                     QuotationLineItem(id: "i1", description: "Enterprise CRM Suite (Annual)", quantity: 1,
                                      unitPrice: "₹1,20,000", total: "₹1,20,000"),
                     QuotationLineItem(id: "i2", description: "Setup & Configuration Service", quantity: 1,
                                      unitPrice: "₹30,000", total: "₹30,000"),
                 ]),
    QuotationItem(id: "q2", quoteNumber: "QT-2026-002", clientName: "Global Solutions",
                 clientEmail: "priya@globalsol.com", issueDate: "2026-08-22", dueDate: "2026-09-05",
                 status: "DRAFT", subtotal: "₹3,20,000", tax: "₹57,600", total: "₹3,77,600",
                 items: [
                     QuotationLineItem(id: "i3", description: "Enterprise License (3 seats)", quantity: 3,
                                      unitPrice: "₹1,20,000", total: "₹3,60,000"),
                     QuotationLineItem(id: "i4", description: "Custom Integration", quantity: 1,
                                      unitPrice: "₹40,000", total: "₹40,000"),
                 ]),
    QuotationItem(id: "q3", quoteNumber: "QT-2026-003", clientName: "FastTrack Corp",
                 clientEmail: "vikram@fasttrack.com", issueDate: "2026-08-18", dueDate: "2026-09-01",
                 status: "ACCEPTED", subtotal: "₹92,000", tax: "₹16,560", total: "₹1,08,560",
                 items: [
                     QuotationLineItem(id: "i5", description: "Integration Module", quantity: 1,
                                      unitPrice: "₹60,000", total: "₹60,000"),
                     QuotationLineItem(id: "i6", description: "Training & Support (3 months)", quantity: 1,
                                      unitPrice: "₹32,000", total: "₹32,000"),
                 ]),
    QuotationItem(id: "q4", quoteNumber: "QT-2026-004", clientName: "Premium Partners",
                 clientEmail: "sunita@premium.com", issueDate: "2026-08-15", dueDate: "2026-08-29",
                 status: "PAID", subtotal: "₹1,56,000", tax: "₹28,080", total: "₹1,84,080",
                 items: [
                     QuotationLineItem(id: "i7", description: "Annual Support Package", quantity: 1,
                                      unitPrice: "₹1,20,000", total: "₹1,20,000"),
                     QuotationLineItem(id: "i8", description: "Priority Support Add-on", quantity: 1,
                                      unitPrice: "₹36,000", total: "₹36,000"),
                 ]),
]

let quotationStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "PAID"]

@MainActor
class QuotationsViewModel: ObservableObject {
    @Published var quotations: [QuotationItem] = fallbackQuotations
    @Published var search: String = ""
    @Published var selectedStatus: String = "ALL"

    var filteredQuotations: [QuotationItem] {
        quotations.filter { quotation in
            let passesStatusFilter = selectedStatus == "ALL" || quotation.status == selectedStatus
            let passesSearch: Bool
            if search.isEmpty {
                passesSearch = true
            } else {
                let q = search.lowercased()
                passesSearch = quotation.quoteNumber.lowercased().contains(q) ||
                              quotation.clientName.lowercased().contains(q) ||
                              quotation.clientEmail.lowercased().contains(q)
            }
            return passesStatusFilter && passesSearch
        }
    }
}

struct QuotationsView: View {
    @StateObject private var viewModel = QuotationsViewModel()
    @State private var selectedQuotation: QuotationItem?
    @State private var showQuotationDetails = false
    @State private var showCreateQuotation = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("📄 Quotations & Invoices")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by quote number, client name...", text: $viewModel.search)
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
                    Button(action: { showCreateQuotation = true }) {
                        Text("➕ New Quotation")
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

                // Status filter chips
                HStack(spacing: 6) {
                    ForEach(["ALL"] + quotationStatuses, id: \.self) { status in
                        Button(action: { viewModel.selectedStatus = status }) {
                            Text(status)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(viewModel.selectedStatus == status ? .white : Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(viewModel.selectedStatus == status ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.02, green: 0.06, blue: 0.12))
                        .border(viewModel.selectedStatus == status ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(6)
                    }
                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Quotations Table
            Table(viewModel.filteredQuotations) {
                TableColumn("Quote #", value: \.quoteNumber)
                TableColumn("Client", value: \.clientName)
                TableColumn("Email", value: \.clientEmail)
                TableColumn("Total", value: \.total)
                TableColumn("Status") { quotation in
                    Text(quotation.status)
                        .foregroundColor(
                            quotation.status == "PAID" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                            quotation.status == "ACCEPTED" ? Color(red: 0.38, green: 0.65, blue: 0.98) :
                            quotation.status == "SENT" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                            Color(red: 0.98, green: 0.30, blue: 0.40)
                        )
                }
                TableColumn("Due Date", value: \.dueDate)
                TableColumn("Action") { quotation in
                    Button(action: {
                        selectedQuotation = quotation
                        showQuotationDetails = true
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
        .navigationTitle("Quotations")
        .sheet(isPresented: $showQuotationDetails) {
            if let quotation = selectedQuotation {
                QuotationDetailsSheet(quotation: quotation, isPresented: $showQuotationDetails)
            }
        }
        .sheet(isPresented: $showCreateQuotation) {
            CreateQuotationSheet(quotations: $viewModel.quotations, isPresented: $showCreateQuotation)
        }
    }
}

struct QuotationDetailsSheet: View {
    let quotation: QuotationItem
    @Binding var isPresented: Bool
    @State private var showEditAlert = false
    @State private var showSendAlert = false
    @State private var showExportAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("📄 \(quotation.quoteNumber)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            Text(quotation.clientName)
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        Spacer()

                        Text(quotation.status)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(
                                quotation.status == "PAID" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                quotation.status == "ACCEPTED" ? Color(red: 0.38, green: 0.65, blue: 0.98) :
                                quotation.status == "SENT" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)
                            )
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                (quotation.status == "PAID" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                quotation.status == "ACCEPTED" ? Color(red: 0.38, green: 0.65, blue: 0.98) :
                                quotation.status == "SENT" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)).opacity(0.15)
                            )
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Client Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("👤 Client Information")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Client Name", value: quotation.clientName)
                        DetailRow(label: "Email", value: quotation.clientEmail)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Dates
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📅 Dates")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Issue Date", value: quotation.issueDate)
                        DetailRow(label: "Due Date", value: quotation.dueDate)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Line Items
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📋 Line Items")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        ForEach(quotation.items) { item in
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.description)
                                        .font(.system(size: 10))
                                        .foregroundColor(.white)
                                    Text("Qty: \(item.quantity)")
                                        .font(.system(size: 9))
                                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                }
                                Spacer()

                                Text(item.total)
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                            }
                            .padding(8)
                            .background(Color(red: 0.02, green: 0.04, blue: 0.08))
                            .cornerRadius(6)
                        }
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Totals
                    VStack(alignment: .leading, spacing: 8) {
                        Text("💰 Totals")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Subtotal", value: quotation.subtotal)
                        DetailRow(label: "Tax (18%)", value: quotation.tax)
                        DetailRow(label: "Total", value: quotation.total)
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
                        Button(action: { showSendAlert = true }) {
                            Text("📧 Send")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .cornerRadius(6)
                        }
                        Button(action: { showExportAlert = true }) {
                            Text("📥 Export PDF")
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
            .navigationTitle("Quotation Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("✏️ Edit Quotation", isPresented: $showEditAlert) {
                Button("OK") { }
            } message: {
                Text("Editing \(quotation.quoteNumber)...")
            }
            .alert("📧 Send", isPresented: $showSendAlert) {
                Button("OK") { }
            } message: {
                Text("Sending \(quotation.quoteNumber) to \(quotation.clientEmail)...")
            }
            .alert("📥 Export PDF", isPresented: $showExportAlert) {
                Button("OK") { }
            } message: {
                Text("Exporting \(quotation.quoteNumber) as PDF...")
            }
        }
    }
}

struct CreateQuotationSheet: View {
    @Binding var quotations: [QuotationItem]
    @Binding var isPresented: Bool

    @State private var clientName = ""
    @State private var clientEmail = ""
    @State private var dueDate = Date()
    @State private var subtotal = 100000.0
    @State private var taxRate = 18.0

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("➕ Create New Quotation")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text("Create a new quotation or invoice.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Client Name *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. TechCorp Ltd", text: $clientName)
                            .textFieldStyle(.roundedBorder)

                        Text("Client Email *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. rajesh@techcorp.com", text: $clientEmail)
                            .textFieldStyle(.roundedBorder)

                        Text("Due Date *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        DatePicker("", selection: $dueDate, displayedComponents: .date)
                            .datePickerStyle(.compact)

                        Text("Subtotal ($) *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Stepper(value: $subtotal, in: 0...999999, step: 1000) {
                            Text("\(Int(subtotal))")
                        }

                        Text("Tax Rate (%) *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Stepper(value: $taxRate, in: 0...100, step: 1) {
                            Text(String(format: "%.0f%%", taxRate))
                        }
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
                            let subtotalInt = Int(subtotal)
                            let taxAmount = Int(Double(subtotalInt) * (taxRate / 100))
                            let totalAmount = subtotalInt + taxAmount

                            let newQuotation = QuotationItem(
                                id: "q-\(UUID())",
                                quoteNumber: "QT-2026-\(Int.random(in: 100...999))",
                                clientName: clientName,
                                clientEmail: clientEmail,
                                issueDate: Date().formatted(date: .numeric, time: .omitted),
                                dueDate: dueDate.formatted(date: .numeric, time: .omitted),
                                status: "DRAFT",
                                subtotal: "₹\(subtotalInt)",
                                tax: "₹\(taxAmount)",
                                total: "₹\(totalAmount)",
                                items: []
                            )
                            quotations.insert(newQuotation, at: 0)
                            isPresented = false
                        }) {
                            Text("Create Quotation ✓")
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
            .navigationTitle("New Quotation")
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
        QuotationsView()
    }
}
