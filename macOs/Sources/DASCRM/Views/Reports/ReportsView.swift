"""
ReportsView.swift — DAS CRM macOS
Analytics Dashboard with Charts, Metrics, and KPI Tracking
Feature parity with Android ReportsAnalyticsScreen.tsx
"""

import SwiftUI

struct MetricData: Identifiable {
    let id = UUID()
    let label: String
    let value: String
    let trend: String
    let percentChange: String
    let icon: String
}

struct SalesMetric: Identifiable {
    let id = UUID()
    let month: String
    let revenue: Int
    let deals: Int
    let avgDealValue: Int
}

let fallbackMetrics = [
    MetricData(label: "Monthly Recurring Revenue", value: "₹24,50,000", trend: "UP",
              percentChange: "+12.5%", icon: "💰"),
    MetricData(label: "Sales Pipeline Value", value: "₹65,32,000", trend: "UP",
              percentChange: "+8.3%", icon: "🎯"),
    MetricData(label: "Customer Acquisition Cost", value: "₹15,200", trend: "DOWN",
              percentChange: "-3.2%", icon: "📊"),
    MetricData(label: "Average Deal Cycle", value: "28 days", trend: "DOWN",
              percentChange: "-5 days", icon: "⏱️"),
]

let fallbackSalesData = [
    SalesMetric(month: "January", revenue: 18500000, deals: 24, avgDealValue: 770833),
    SalesMetric(month: "February", revenue: 19200000, deals: 26, avgDealValue: 738461),
    SalesMetric(month: "March", revenue: 21800000, deals: 32, avgDealValue: 681250),
    SalesMetric(month: "April", revenue: 20500000, deals: 28, avgDealValue: 732142),
    SalesMetric(month: "May", revenue: 22100000, deals: 30, avgDealValue: 736666),
    SalesMetric(month: "June", revenue: 24500000, deals: 35, avgDealValue: 700000),
]

@MainActor
class ReportsViewModel: ObservableObject {
    @Published var salesData: [SalesMetric] = fallbackSalesData
    @Published var startDate = Date(timeIntervalSince1970: 1704067200) // 2024-01-01
    @Published var endDate = Date()
    @Published var chartType = "Line Chart"

    var maxRevenue: Int {
        salesData.map { $0.revenue }.max() ?? 0
    }

    var totalRevenue: Int {
        salesData.reduce(0) { $0 + $1.revenue }
    }
}

struct ReportsView: View {
    @StateObject private var viewModel = ReportsViewModel()
    @State private var showExportAlert = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("📊 Reports & Analytics")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Date Range Selector
                HStack(spacing: 8) {
                    Text("📅 Date Range:")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))

                    DatePicker("", selection: $viewModel.startDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .frame(maxWidth: 150)

                    Text("to")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))

                    DatePicker("", selection: $viewModel.endDate, displayedComponents: .date)
                        .datePickerStyle(.compact)
                        .frame(maxWidth: 150)

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

                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Content
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Key Metrics Grid (2x2)
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 12) {
                            MetricCardView(metric: fallbackMetrics[0])
                            MetricCardView(metric: fallbackMetrics[1])
                        }

                        HStack(spacing: 12) {
                            MetricCardView(metric: fallbackMetrics[2])
                            MetricCardView(metric: fallbackMetrics[3])
                        }
                    }

                    // Sales Performance Section
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("💹 Sales Performance (Last 6 Months)")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)

                            Spacer()

                            Picker("Chart Type", selection: $viewModel.chartType) {
                                Text("Line Chart").tag("Line Chart")
                                Text("Bar Chart").tag("Bar Chart")
                                Text("Area Chart").tag("Area Chart")
                            }
                            .pickerStyle(.menu)
                            .frame(width: 150)
                        }

                        // Chart Visualization
                        VStack(alignment: .center, spacing: 12) {
                            Text("📈 Chart Visualization")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)

                            Text("(Line chart: Revenue & Deal Count trend)")
                                .font(.system(size: 9))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                            // Simple bar chart representation
                            HStack(alignment: .bottom, spacing: 6) {
                                ForEach(viewModel.salesData) { sale in
                                    VStack(spacing: 4) {
                                        RoundedRectangle(cornerRadius: 4)
                                            .fill(Color(red: 0.2, green: 0.83, blue: 0.60))
                                            .frame(width: 20, height: CGFloat(sale.revenue) / CGFloat(viewModel.maxRevenue) * 100)

                                        Text(sale.month.prefix(3))
                                            .font(.system(size: 8, weight: .bold))
                                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                    }
                                }
                            }
                            .frame(height: 120)
                            .padding(.vertical, 8)

                            HStack {
                                Text("0")
                                    .font(.system(size: 8))
                                    .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                Spacer()
                                Text("₹\(String(format: "%,d", viewModel.maxRevenue))")
                                    .font(.system(size: 8))
                                    .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                            }
                        }
                        .frame(maxWidth: .infinity, minHeight: 180)
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)
                    }

                    // Sales Data Table
                    VStack(alignment: .leading, spacing: 12) {
                        Text("📋 Monthly Sales Data")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)

                        Table(viewModel.salesData) {
                            TableColumn("Month", value: \.month)
                            TableColumn("Revenue") { sale in
                                Text("₹\(String(format: "%,d", sale.revenue))")
                                    .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                            }
                            TableColumn("Deals") { sale in
                                Text(String(sale.deals))
                                    .foregroundColor(Color(red: 0.38, green: 0.65, blue: 0.98))
                            }
                            TableColumn("Avg Deal Value") { sale in
                                Text("₹\(String(format: "%,d", sale.avgDealValue))")
                                    .foregroundColor(Color(red: 0.98, green: 0.75, blue: 0.14))
                            }
                        }
                        .background(Color(red: 0.03, green: 0.04, blue: 0.07))
                        .onDoubleClickSelectAll(false)
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Reports")
        .alert("📥 Export Report", isPresented: $showExportAlert) {
            Button("OK") { }
        } message: {
            Text("Exporting analytics report...")
        }
    }
}

struct MetricCardView: View {
    let metric: MetricData

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(metric.icon)
                    .font(.system(size: 16))

                VStack(alignment: .leading, spacing: 2) {
                    Text(metric.label)
                        .font(.system(size: 9))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                }

                Spacer()

                Text(metric.trend == "UP" ? "📈" : metric.trend == "DOWN" ? "📉" : "➡️")
                    .font(.system(size: 12))
            }

            HStack {
                Text(metric.value)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))

                Text(metric.percentChange)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(
                        metric.trend == "UP" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                        metric.trend == "DOWN" ? Color(red: 0.98, green: 0.30, blue: 0.40) :
                        Color(red: 0.98, green: 0.75, blue: 0.14)
                    )

                Spacer()
            }
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
        ReportsView()
    }
}
