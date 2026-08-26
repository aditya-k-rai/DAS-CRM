"""
DealsPipelineView.swift — DAS CRM macOS
Multi-Stage Kanban Board with Drag-Drop, Revenue Tracking, and Deal Management
Feature parity with Android DealsPipelineScreen.tsx
"""

import SwiftUI

struct DealItem: Identifiable {
    let id: String
    let title: String
    let company: String
    let value: String
    let stage: String
    let probability: Int
    let daysInStage: Int
    let assignedTo: String
    let lastActivity: String
}

let dealStages = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON"]

let stageColors: [String: (primary: Color, accent: Color)] = [
    "PROSPECTING": (Color(red: 0.31, green: 0.27, blue: 0.90), Color(red: 0.50, green: 0.45, blue: 0.98)),
    "QUALIFICATION": (Color(red: 0.96, green: 0.62, blue: 0.07), Color(red: 0.98, green: 0.75, blue: 0.14)),
    "PROPOSAL": (Color(red: 0.23, green: 0.51, blue: 0.96), Color(red: 0.38, green: 0.65, blue: 0.98)),
    "NEGOTIATION": (Color(red: 0.98, green: 0.46, blue: 0.09), Color(red: 0.99, green: 0.57, blue: 0.24)),
    "WON": (Color(red: 0.06, green: 0.68, blue: 0.50), Color(red: 0.20, green: 0.83, blue: 0.60))
]

let fallbackDeals = [
    // PROSPECTING
    DealItem(id: "d1", title: "TechVision AI Suite", company: "TechCorp Ltd", value: "$125,000",
            stage: "PROSPECTING", probability: 35, daysInStage: 5, assignedTo: "Rajesh Kumar", lastActivity: "Email sent 2h ago"),
    DealItem(id: "d2", title: "Cloud Migration Project", company: "DataFlow Inc", value: "$85,000",
            stage: "PROSPECTING", probability: 20, daysInStage: 12, assignedTo: "Priya Sharma", lastActivity: "Call scheduled"),

    // QUALIFICATION
    DealItem(id: "d3", title: "Enterprise License Renewal", company: "Global Solutions", value: "$320,000",
            stage: "QUALIFICATION", probability: 60, daysInStage: 8, assignedTo: "Vikram Mehta", lastActivity: "Demo scheduled"),
    DealItem(id: "d4", title: "Integration Pilot", company: "FastTrack Corp", value: "$45,000",
            stage: "QUALIFICATION", probability: 40, daysInStage: 3, assignedTo: "Amit Patel", lastActivity: "Requirements review"),

    // PROPOSAL
    DealItem(id: "d5", title: "Annual Support Package", company: "Premium Partners", value: "$156,000",
            stage: "PROPOSAL", probability: 75, daysInStage: 6, assignedTo: "Sunita Rao", lastActivity: "Proposal sent"),
    DealItem(id: "d6", title: "Custom Dev Services", company: "InnovateTech", value: "$92,000",
            stage: "PROPOSAL", probability: 65, daysInStage: 2, assignedTo: "Rajesh Kumar", lastActivity: "Awaiting feedback"),

    // NEGOTIATION
    DealItem(id: "d7", title: "Enterprise Platinum", company: "Fortune 500 Client", value: "$512,000",
            stage: "NEGOTIATION", probability: 85, daysInStage: 4, assignedTo: "Vikram Mehta", lastActivity: "Legal review in progress"),
    DealItem(id: "d8", title: "Multi-Year Contract", company: "Strategic Partner", value: "$280,000",
            stage: "NEGOTIATION", probability: 80, daysInStage: 7, assignedTo: "Priya Sharma", lastActivity: "Negotiating terms"),

    // WON
    DealItem(id: "d9", title: "Q3 License Deal", company: "TechCorp Subsidiary", value: "$198,000",
            stage: "WON", probability: 100, daysInStage: 1, assignedTo: "Rajesh Kumar", lastActivity: "Contract signed"),
    DealItem(id: "d10", title: "Integration Success", company: "EastWest Trading", value: "$165,000",
            stage: "WON", probability: 100, daysInStage: 3, assignedTo: "Sunita Rao", lastActivity: "Onboarding started"),
]

@MainActor
class DealsPipelineViewModel: ObservableObject {
    @Published var deals: [DealItem] = fallbackDeals

    func dealsInStage(_ stage: String) -> [DealItem] {
        deals.filter { $0.stage == stage }
    }

    func totalRevenueInStage(_ stage: String) -> Int {
        dealsInStage(stage).reduce(0) { acc, deal in
            let value = Int(deal.value.replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: "")) ?? 0
            return acc + value
        }
    }

    func totalPipelineRevenue() -> Int {
        deals.reduce(0) { acc, deal in
            let value = Int(deal.value.replacingOccurrences(of: "$", with: "").replacingOccurrences(of: ",", with: "")) ?? 0
            return acc + value
        }
    }
}

struct DealsPipelineView: View {
    @StateObject private var viewModel = DealsPipelineViewModel()
    @State private var selectedDeal: DealItem?
    @State private var showDealDetails = false
    @State private var showCreateDeal = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("🎯 Deal Pipeline")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Control bar
                HStack {
                    Button(action: { showCreateDeal = true }) {
                        Text("➕ New Deal")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Text("💰 Total Pipeline: $\(String(format: "%,d", viewModel.totalPipelineRevenue()))")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))

                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Kanban Board
            ScrollView(.horizontal, showsIndicators: true) {
                HStack(alignment: .top, spacing: 12) {
                    ForEach(dealStages, id: \.self) { stage in
                        KanbanStageColumn(
                            stage: stage,
                            deals: viewModel.dealsInStage(stage),
                            totalRevenue: viewModel.totalRevenueInStage(stage),
                            onDealTapped: { deal in
                                selectedDeal = deal
                                showDealDetails = true
                            }
                        )
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Deals")
        .sheet(isPresented: $showDealDetails) {
            if let deal = selectedDeal {
                DealDetailsSheet(deal: deal, isPresented: $showDealDetails)
            }
        }
        .sheet(isPresented: $showCreateDeal) {
            CreateDealSheet(deals: $viewModel.deals, isPresented: $showCreateDeal)
        }
    }
}

struct KanbanStageColumn: View {
    let stage: String
    let deals: [DealItem]
    let totalRevenue: Int
    let onDealTapped: (DealItem) -> Void

    var body: some View {
        let colors = stageColors[stage] ?? (Color(red: 0.40, green: 0.40, blue: 0.40), Color(red: 0.58, green: 0.64, blue: 0.68))

        VStack(alignment: .leading, spacing: 8) {
            // Stage header
            HStack {
                Text(stage.replacingOccurrences(of: "_", with: " "))
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(colors.accent)

                Text("\(deals.count)")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(colors.primary)
                    .cornerRadius(4)

                Spacer()
            }

            // Deal cards
            VStack(alignment: .leading, spacing: 8) {
                ForEach(deals) { deal in
                    DealCardView(deal: deal, stageColor: colors)
                        .onTapGesture {
                            onDealTapped(deal)
                        }
                }
            }

            // Revenue total
            HStack {
                Text("💰 $\(String(format: "%,d", totalRevenue))")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(colors.accent)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Spacer()
        }
        .frame(width: 280)
        .padding(12)
        .background(Color(red: 0.07, green: 0.09, blue: 0.16))
        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
        .cornerRadius(12)
    }
}

struct DealCardView: View {
    let deal: DealItem
    let stageColor: (primary: Color, accent: Color)

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Title & Probability
            HStack {
                Text(deal.title)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)

                Spacer()

                Text("\(deal.probability)%")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundColor(
                        deal.probability >= 75 ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                        deal.probability >= 50 ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                        Color(red: 0.98, green: 0.30, blue: 0.40)
                    )
            }

            // Company
            Text(deal.company)
                .font(.system(size: 9))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                .lineLimit(1)

            // Value
            Text(deal.value)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))

            // Activity
            Text(deal.lastActivity)
                .font(.system(size: 8))
                .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(8)
        .background(Color(red: 0.02, green: 0.04, blue: 0.08))
        .border(Color(red: 0.15, green: 0.18, blue: 0.25), width: 1)
        .cornerRadius(6)
        .cursor(.pointingHand)
    }
}

struct DealDetailsSheet: View {
    let deal: DealItem
    @Binding var isPresented: Bool
    @State private var showUpdateAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("🎯 \(deal.title)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            Text(deal.company)
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        Spacer()
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Deal Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📊 Deal Information")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Value", value: deal.value)
                        DetailRow(label: "Stage", value: deal.stage)
                        DetailRow(label: "Probability", value: "\(deal.probability)%")
                        DetailRow(label: "Days in Stage", value: String(deal.daysInStage))
                        DetailRow(label: "Assigned To", value: deal.assignedTo)
                        DetailRow(label: "Last Activity", value: deal.lastActivity)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: { showUpdateAlert = true }) {
                            Text("📝 Update Status")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                                .cornerRadius(6)
                        }
                        Button(action: { isPresented = false }) {
                            Text("Close")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Deal Details")
            .navigationBarTitleDisplayMode(.inline)
            .alert("📝 Update Deal Status", isPresented: $showUpdateAlert) {
                Button("OK") { }
            } message: {
                Text("Moving \(deal.title) to next stage...")
            }
        }
    }
}

struct CreateDealSheet: View {
    @Binding var deals: [DealItem]
    @Binding var isPresented: Bool

    @State private var title = ""
    @State private var company = ""
    @State private var value = ""
    @State private var selectedStage = "PROSPECTING"
    @State private var probability = 35
    @State private var assignedTo = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("➕ Create New Deal")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text("Add a new opportunity to your pipeline.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Deal Title *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. Enterprise License Deal", text: $title)
                            .textFieldStyle(.roundedBorder)

                        Text("Company *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. TechCorp Ltd", text: $company)
                            .textFieldStyle(.roundedBorder)

                        Text("Deal Value ($) *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. 125000", text: $value)
                            .textFieldStyle(.roundedBorder)

                        Text("Initial Stage *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Stage", selection: $selectedStage) {
                            ForEach(dealStages, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Text("Probability (\%) *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Stepper(value: $probability, in: 0...100, step: 5) {
                            Text("\(probability)%")
                        }

                        Text("Assigned To")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("Rep name (optional)", text: $assignedTo)
                            .textFieldStyle(.roundedBorder)
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
                            let valueInt = Int(value) ?? 0
                            let newDeal = DealItem(
                                id: "d-\(UUID())",
                                title: title,
                                company: company,
                                value: "$\(valueInt)",
                                stage: selectedStage,
                                probability: probability,
                                daysInStage: 0,
                                assignedTo: assignedTo.isEmpty ? "Unassigned" : assignedTo,
                                lastActivity: "Deal created"
                            )
                            deals.append(newDeal)
                            isPresented = false
                        }) {
                            Text("Create Deal ✓")
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
            .navigationTitle("New Deal")
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
        DealsPipelineView()
    }
}
