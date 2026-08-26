"""
ManagerDashboardView.swift — DAS CRM macOS
Manager-Specific KPIs, Team Performance, and Subordinate Metrics
Feature parity with Android ManagerDashboardScreen.tsx
"""

import SwiftUI

struct TeamMemberPerformance: Identifiable {
    let id: String
    let name: String
    let role: String
    let leadsAssigned: Int
    let dealsWon: Int
    let revenue: String
    let targetProgress: Int
    let status: String
}

let fallbackTeamMembers = [
    TeamMemberPerformance(id: "t1", name: "Rajesh Kumar", role: "Sales Executive",
                         leadsAssigned: 24, dealsWon: 8, revenue: "₹3,20,000", targetProgress: 85, status: "ACTIVE"),
    TeamMemberPerformance(id: "t2", name: "Priya Sharma", role: "Sales Executive",
                         leadsAssigned: 18, dealsWon: 6, revenue: "₹2,10,000", targetProgress: 70, status: "ACTIVE"),
    TeamMemberPerformance(id: "t3", name: "Vikram Mehta", role: "Senior Sales Rep",
                         leadsAssigned: 32, dealsWon: 11, revenue: "₹4,50,000", targetProgress: 95, status: "ACTIVE"),
    TeamMemberPerformance(id: "t4", name: "Sunita Rao", role: "Sales Executive",
                         leadsAssigned: 15, dealsWon: 5, revenue: "₹1,80,000", targetProgress: 60, status: "ACTIVE"),
    TeamMemberPerformance(id: "t5", name: "Amit Patel", role: "Sales Executive",
                         leadsAssigned: 22, dealsWon: 7, revenue: "₹2,80,000", targetProgress: 75, status: "ACTIVE"),
]

@MainActor
class ManagerDashboardViewModel: ObservableObject {
    @Published var teamMembers: [TeamMemberPerformance] = fallbackTeamMembers

    var totalTeamSales: String {
        let total = teamMembers.reduce(0) { acc, member in
            let value = Int(member.revenue.replacingOccurrences(of: "₹", with: "").replacingOccurrences(of: ",", with: "")) ?? 0
            return acc + value
        }
        return "₹\(String(format: "%,d", total))"
    }

    var targetProgress: Double {
        Double(teamMembers.map { $0.targetProgress }.reduce(0, +)) / Double(teamMembers.count)
    }

    var avgDealValue: String {
        let totalDeals = teamMembers.reduce(0) { $0 + $1.dealsWon }
        let totalRevenue = teamMembers.reduce(0) { acc, member in
            let value = Int(member.revenue.replacingOccurrences(of: "₹", with: "").replacingOccurrences(of: ",", with: "")) ?? 0
            return acc + value
        }
        let avgValue = totalDeals > 0 ? totalRevenue / totalDeals : 0
        return "₹\(String(format: "%,d", avgValue))"
    }
}

struct ManagerDashboardView: View {
    @StateObject private var viewModel = ManagerDashboardViewModel()
    @State private var selectedMember: TeamMemberPerformance?
    @State private var showMemberDetails = false
    @State private var showExportAlert = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("📊 Manager Dashboard")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // KPI Grid (2x2)
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    MetricCard(
                        icon: "💰",
                        label: "Team Sales (This Month)",
                        value: viewModel.totalTeamSales,
                        trend: "UP",
                        color: Color(red: 0.2, green: 0.83, blue: 0.60)
                    )

                    MetricCard(
                        icon: "🎯",
                        label: "Target Progress",
                        value: String(format: "%.0f%%", viewModel.targetProgress),
                        trend: "UP",
                        color: Color(red: 0.38, green: 0.65, blue: 0.98)
                    )
                }

                HStack(spacing: 12) {
                    MetricCard(
                        icon: "👥",
                        label: "Team Size",
                        value: String(viewModel.teamMembers.count),
                        trend: "STABLE",
                        color: Color(red: 0.50, green: 0.45, blue: 0.98)
                    )

                    MetricCard(
                        icon: "📈",
                        label: "Avg Deal Value",
                        value: viewModel.avgDealValue,
                        trend: "UP",
                        color: Color(red: 0.98, green: 0.75, blue: 0.14)
                    )
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))

            // Team Performance Section
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("👥 Team Performance")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)

                    Spacer()

                    Button(action: { showExportAlert = true }) {
                        Text("📥 Export Report")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .cornerRadius(4)
                    }
                    .buttonStyle(.plain)
                }

                // Team Performance Table
                Table(viewModel.teamMembers) {
                    TableColumn("Rep Name", value: \.name)
                    TableColumn("Role", value: \.role)
                    TableColumn("Leads") { member in
                        Text(String(member.leadsAssigned))
                    }
                    TableColumn("Deals Won") { member in
                        Text(String(member.dealsWon))
                    }
                    TableColumn("Revenue", value: \.revenue)
                    TableColumn("Target %") { member in
                        Text("\(member.targetProgress)%")
                            .foregroundColor(
                                member.targetProgress >= 80 ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                member.targetProgress >= 60 ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)
                            )
                    }
                    TableColumn("Status") { member in
                        Text(member.status)
                            .foregroundColor(
                                member.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)
                            )
                    }
                }
                .background(Color(red: 0.03, green: 0.04, blue: 0.07))
                .onDoubleClickSelectAll(false)
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Manager")
        .alert("📥 Export Report", isPresented: $showExportAlert) {
            Button("OK") { }
        } message: {
            Text("Exporting team performance report...")
        }
    }
}

struct MetricCard: View {
    let icon: String
    let label: String
    let value: String
    let trend: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(icon)
                    .font(.system(size: 20))

                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                }

                Spacer()

                Text(trend == "UP" ? "📈" : trend == "DOWN" ? "📉" : "➡️")
                    .font(.system(size: 12))
            }

            Text(value)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(red: 0.07, green: 0.09, blue: 0.16))
        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
        .cornerRadius(12)
    }
}

#Preview {
    NavigationView {
        ManagerDashboardView()
    }
}
