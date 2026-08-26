"""
TeamLeaderDashboardView.swift — DAS CRM macOS
Team Leader-Specific KPIs and Direct Report Performance
Feature parity with Android TeamLeaderDashboardScreen.tsx
"""

import SwiftUI

struct DirectReport: Identifiable {
    let id: String
    let name: String
    let leadsAssigned: Int
    let leadsConverted: Int
    let conversionRate: String
    let thisMonthRevenue: String
    let quota: String
    let quotaAttainment: Int
    let status: String
}

let fallbackDirectReports = [
    DirectReport(id: "dr1", name: "Rajesh Kumar", leadsAssigned: 18, leadsConverted: 5,
                conversionRate: "27.8%", thisMonthRevenue: "₹2,40,000", quota: "₹3,50,000",
                quotaAttainment: 68, status: "ON_TRACK"),
    DirectReport(id: "dr2", name: "Priya Sharma", leadsAssigned: 12, leadsConverted: 4,
                conversionRate: "33.3%", thisMonthRevenue: "₹1,80,000", quota: "₹3,00,000",
                quotaAttainment: 60, status: "AT_RISK"),
    DirectReport(id: "dr3", name: "Amit Patel", leadsAssigned: 15, leadsConverted: 3,
                conversionRate: "20.0%", thisMonthRevenue: "₹1,50,000", quota: "₹3,20,000",
                quotaAttainment: 47, status: "CRITICAL"),
]

@MainActor
class TeamLeaderDashboardViewModel: ObservableObject {
    @Published var directReports: [DirectReport] = fallbackDirectReports

    var totalDirectReports: Int {
        directReports.count
    }

    var totalLeads: Int {
        directReports.reduce(0) { $0 + $1.leadsAssigned }
    }

    var totalConverted: Int {
        directReports.reduce(0) { $0 + $1.leadsConverted }
    }

    var avgConversionRate: String {
        let total = totalLeads
        let converted = totalConverted
        guard total > 0 else { return "0%" }
        let rate = Double(converted) / Double(total) * 100
        return String(format: "%.1f%%", rate)
    }

    var teamRevenue: String {
        let total = directReports.reduce(0) { acc, report in
            let value = Int(report.thisMonthRevenue.replacingOccurrences(of: "₹", with: "").replacingOccurrences(of: ",", with: "")) ?? 0
            return acc + value
        }
        return "₹\(String(format: "%,d", total))"
    }
}

struct TeamLeaderDashboardView: View {
    @StateObject private var viewModel = TeamLeaderDashboardViewModel()

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("🏆 Team Leader Dashboard")
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
                        icon: "👥",
                        label: "Direct Reports",
                        value: String(viewModel.totalDirectReports),
                        color: Color(red: 0.50, green: 0.45, blue: 0.98)
                    )

                    MetricCard(
                        icon: "📊",
                        label: "Total Leads",
                        value: String(viewModel.totalLeads),
                        color: Color(red: 0.38, green: 0.65, blue: 0.98)
                    )
                }

                HStack(spacing: 12) {
                    MetricCard(
                        icon: "📈",
                        label: "Avg Conversion",
                        value: viewModel.avgConversionRate,
                        color: Color(red: 0.2, green: 0.83, blue: 0.60)
                    )

                    MetricCard(
                        icon: "💰",
                        label: "Team Revenue",
                        value: viewModel.teamRevenue,
                        color: Color(red: 0.98, green: 0.75, blue: 0.14)
                    )
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))

            // Direct Reports Section
            VStack(alignment: .leading, spacing: 12) {
                Text("👥 Direct Reports Performance")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)

                // Reports Table
                Table(viewModel.directReports) {
                    TableColumn("Name", value: \.name)
                    TableColumn("Leads") { report in
                        Text(String(report.leadsAssigned))
                    }
                    TableColumn("Converted") { report in
                        Text(String(report.leadsConverted))
                    }
                    TableColumn("Conv. %", value: \.conversionRate)
                    TableColumn("Revenue", value: \.thisMonthRevenue)
                    TableColumn("Quota", value: \.quota)
                    TableColumn("Attainment %") { report in
                        Text("\(report.quotaAttainment)%")
                            .foregroundColor(
                                report.quotaAttainment >= 80 ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                report.quotaAttainment >= 60 ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)
                            )
                    }
                    TableColumn("Status") { report in
                        Text(report.status)
                            .foregroundColor(
                                report.status == "ON_TRACK" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                report.status == "AT_RISK" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
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
        .navigationTitle("Team Leader")
    }
}

struct MetricCard: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(icon)
                    .font(.system(size: 18))

                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                }

                Spacer()
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
        TeamLeaderDashboardView()
    }
}
