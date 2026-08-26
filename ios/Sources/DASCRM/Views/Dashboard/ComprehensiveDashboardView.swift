//
// ComprehensiveDashboardView.swift
// DAS CRM iOS App - Advanced Executive Dashboard
// Complete analytics, forecasting, and real-time metrics
//

import SwiftUI

struct ComprehensiveDashboardView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @StateObject private var dashboardVM = DashboardViewModel()
    @State private var selectedTab: DashboardTab = .metrics
    @State private var dateRange = 0  // 0: This Month, 1: Last 3 Months, etc.
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header with filters
                VStack(spacing: 12) {
                    HStack {
                        Text("Executive Dashboard")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Spacer()
                        
                        Menu {
                            Button("This Month") { dateRange = 0 }
                            Button("Last 3 Months") { dateRange = 1 }
                            Button("Last 6 Months") { dateRange = 2 }
                            Button("YTD") { dateRange = 3 }
                        } label: {
                            Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 12)
                .background(Color(.systemGray6))
                
                // Tabs
                Picker("Dashboard View", selection: $selectedTab) {
                    ForEach(DashboardTab.allCases, id: \.self) { tab in
                        Text(tab.rawValue).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()
                
                // Tab content
                ScrollView {
                    VStack(spacing: 16) {
                        switch selectedTab {
                        case .metrics:
                            MetricsTabView(dashboardVM: dashboardVM)
                        case .pipeline:
                            PipelineTabView(dashboardVM: dashboardVM)
                        case .leads:
                            LeadsAnalysisTabView(dashboardVM: dashboardVM)
                        case .forecast:
                            ForecastTabView(dashboardVM: dashboardVM)
                        case .team:
                            TeamPerformanceTabView(dashboardVM: dashboardVM)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Dashboard")
        }
    }
}

enum DashboardTab: String, CaseIterable {
    case metrics = "Metrics"
    case pipeline = "Pipeline"
    case leads = "Leads"
    case forecast = "Forecast"
    case team = "Team"
}

// MARK: - Metrics Tab
struct MetricsTabView: View {
    let dashboardVM: DashboardViewModel
    
    var body: some View {
        VStack(spacing: 12) {
            // 6 KPI Cards in 2x3 grid
            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    MetricCard(
                        label: "Total Revenue",
                        value: "$248.5K",
                        change: "+18.4%",
                        color: .teal
                    )
                    
                    MetricCard(
                        label: "Pipeline Value",
                        value: "$850K",
                        change: "+12.3%",
                        color: .blue
                    )
                }
                
                HStack(spacing: 12) {
                    MetricCard(
                        label: "Closed This Month",
                        value: "$45.2K",
                        change: "+5.2%",
                        color: .green
                    )
                    
                    MetricCard(
                        label: "MRR",
                        value: "$125K",
                        change: "+8.1%",
                        color: .purple
                    )
                }
                
                HStack(spacing: 12) {
                    MetricCard(
                        label: "Conversion Rate",
                        value: "24.2%",
                        change: "+3.2%",
                        color: .orange
                    )
                    
                    MetricCard(
                        label: "Avg Deal Size",
                        value: "$42.5K",
                        change: "+2.8%",
                        color: .pink
                    )
                }
            }
            
            Divider()
                .padding(.vertical, 8)
            
            // Recent Transactions
            VStack(alignment: .leading, spacing: 8) {
                Text("Recent Transactions")
                    .font(.headline)
                
                VStack(spacing: 8) {
                    TransactionRow(
                        date: "Aug 26",
                        item: "Apex Tech Cloud",
                        type: "Deal",
                        amount: "$45,000",
                        status: "Won"
                    )
                    
                    TransactionRow(
                        date: "Aug 25",
                        item: "Nexus Labs AI",
                        type: "Lead",
                        amount: "$28,500",
                        status: "Qualified"
                    )
                    
                    TransactionRow(
                        date: "Aug 24",
                        item: "Global Inc",
                        type: "Deal",
                        amount: "$120,000",
                        status: "Contract Sent"
                    )
                    
                    TransactionRow(
                        date: "Aug 23",
                        item: "TechStart Inc",
                        type: "Lead",
                        amount: "$15,000",
                        status: "New"
                    )
                }
            }
        }
    }
}

struct MetricCard: View {
    let label: String
    let value: String
    let change: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundColor(.gray)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(change)
                .font(.caption2)
                .foregroundColor(.green)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(color.opacity(0.3), lineWidth: 1)
        )
    }
}

struct TransactionRow: View {
    let date: String
    let item: String
    let type: String
    let amount: String
    let status: String
    
    var body: some View {
        VStack(spacing: 4) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(item)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    HStack(spacing: 8) {
                        Text(date)
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        Capsule()
                            .fill(typeColor(type))
                            .frame(width: 40, height: 16)
                            .overlay(
                                Text(type)
                                    .font(.caption2)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                            )
                    }
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(amount)
                        .font(.subheadline)
                        .fontWeight(.bold)
                    
                    Capsule()
                        .fill(statusColor(status))
                        .frame(height: 16)
                        .overlay(
                            Text(status)
                                .font(.caption2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                        )
                }
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
    
    private func typeColor(_ type: String) -> Color {
        type == "Deal" ? .blue : .orange
    }
    
    private func statusColor(_ status: String) -> Color {
        switch status {
        case "Won": return .green
        case "Contract Sent": return .purple
        case "Qualified": return .yellow
        case "New": return .blue
        default: return .gray
        }
    }
}

// MARK: - Pipeline Tab
struct PipelineTabView: View {
    let dashboardVM: DashboardViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Sales Pipeline Analysis")
                .font(.headline)
            
            // Pipeline stages with values
            VStack(spacing: 8) {
                PipelineStageRow(stage: "Prospecting", value: "$150K", percentage: 17.6)
                PipelineStageRow(stage: "Demo Scheduled", value: "$280K", percentage: 32.9)
                PipelineStageRow(stage: "Negotiation", value: "$250K", percentage: 29.4)
                PipelineStageRow(stage: "Contract Sent", value: "$170K", percentage: 20.0)
            }
            
            Divider()
                .padding(.vertical, 8)
            
            Text("Top Deals in Pipeline")
                .font(.headline)
            
            VStack(spacing: 8) {
                DealPipelineRow(
                    title: "Apex Tech Cloud License",
                    company: "Apex Technologies",
                    amount: "$45,000",
                    stage: "Negotiation",
                    closeDate: "Sep 15, 2026"
                )
                
                DealPipelineRow(
                    title: "Nexus AI Platform",
                    company: "Nexus Labs",
                    amount: "$28,500",
                    stage: "Demo Scheduled",
                    closeDate: "Sep 30, 2026"
                )
                
                DealPipelineRow(
                    title: "Global Inc Enterprise",
                    company: "Global Inc",
                    amount: "$120,000",
                    stage: "Contract Sent",
                    closeDate: "Sep 5, 2026"
                )
            }
        }
    }
}

struct PipelineStageRow: View {
    let stage: String
    let value: String
    let percentage: Double
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(stage)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Text(value)
                    .font(.subheadline)
                    .fontWeight(.bold)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.teal)
                        .frame(width: geometry.size.width * percentage / 100)
                }
                .frame(height: 8)
            }
            .frame(height: 8)
            
            Text("\(String(format: "%.1f", percentage))%")
                .font(.caption)
                .foregroundColor(.gray)
        }
    }
}

struct DealPipelineRow: View {
    let title: String
    let company: String
    let amount: String
    let stage: String
    let closeDate: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Text(company)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Text(amount)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(.teal)
            }
            
            HStack(spacing: 8) {
                Capsule()
                    .fill(Color.purple.opacity(0.2))
                    .frame(height: 20)
                    .overlay(
                        Text(stage)
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(.purple)
                    )
                
                Spacer()
                
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption)
                    Text(closeDate)
                        .font(.caption)
                }
                .foregroundColor(.gray)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Leads Analysis Tab
struct LeadsAnalysisTabView: View {
    let dashboardVM: DashboardViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Lead Source Distribution")
                .font(.headline)
            
            VStack(spacing: 8) {
                LeadSourceRow(source: "Website", count: 320, percentage: 22.5, color: .teal)
                LeadSourceRow(source: "LinkedIn", count: 450, percentage: 31.7, color: .blue)
                LeadSourceRow(source: "Referral", count: 380, percentage: 26.8, color: .green)
                LeadSourceRow(source: "Phone", count: 270, percentage: 19.0, color: .orange)
            }
            
            Divider()
                .padding(.vertical, 8)
            
            Text("Lead Status Distribution")
                .font(.headline)
            
            VStack(spacing: 8) {
                LeadStatusRow(status: "New", count: 450, conversion: "-", avgValue: "$8.5K")
                LeadStatusRow(status: "Contacted", count: 380, conversion: "15%", avgValue: "$12K")
                LeadStatusRow(status: "Qualified", count: 320, conversion: "28%", avgValue: "$18K")
                LeadStatusRow(status: "Proposal", count: 180, conversion: "55%", avgValue: "$25K")
                LeadStatusRow(status: "Won", count: 90, conversion: "100%", avgValue: "$45K")
            }
        }
    }
}

struct LeadSourceRow: View {
    let source: String
    let count: Int
    let percentage: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(source)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Text("\(count) • \(String(format: "%.1f", percentage))%")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color(.systemGray5))
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * percentage / 100)
                }
            }
            .frame(height: 6)
        }
    }
}

struct LeadStatusRow: View {
    let status: String
    let count: Int
    let conversion: String
    let avgValue: String
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(status)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Text("\(count) leads")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text("Conversion: \(conversion)")
                    .font(.caption)
                    .fontWeight(.semibold)
                
                Text("Avg: \(avgValue)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

// MARK: - Forecast Tab
struct ForecastTabView: View {
    let dashboardVM: DashboardViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("3-Month Revenue Forecast")
                .font(.headline)
            
            VStack(spacing: 8) {
                ForecastRow(month: "Month 1", forecast: "$180K", best: "$195K", worst: "$165K")
                ForecastRow(month: "Month 2", forecast: "$210K", best: "$230K", worst: "$195K")
                ForecastRow(month: "Month 3", forecast: "$245K", best: "$270K", worst: "$220K")
            }
            
            Divider()
                .padding(.vertical, 8)
            
            Text("Quarterly Targets vs Actual")
                .font(.headline)
            
            VStack(spacing: 8) {
                QuarterRow(quarter: "Q1 2026", target: "$600K", actual: "$580K", status: "97%")
                QuarterRow(quarter: "Q2 2026", target: "$700K", actual: "$745K", status: "106%")
                QuarterRow(quarter: "Q3 2026", target: "$800K", actual: "$720K", status: "90%")
                QuarterRow(quarter: "Q4 2026", target: "$850K", actual: "Projected", status: "85%")
            }
        }
    }
}

struct ForecastRow: View {
    let month: String
    let forecast: String
    let best: String
    let worst: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(month)
                .font(.subheadline)
                .fontWeight(.semibold)
            
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Forecast")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(forecast)
                        .font(.subheadline)
                        .fontWeight(.bold)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Best Case")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(best)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Worst Case")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(worst)
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(.red)
                }
                
                Spacer()
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct QuarterRow: View {
    let quarter: String
    let target: String
    let actual: String
    let status: String
    
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(quarter)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Text("Target: \(target)")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                Text(actual)
                    .font(.subheadline)
                    .fontWeight(.bold)
                
                Text(status)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(statusColor(status))
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
    
    private func statusColor(_ status: String) -> Color {
        if status.contains("10") { return .green }
        if status.contains("90") { return .orange }
        return .blue
    }
}

// MARK: - Team Performance Tab
struct TeamPerformanceTabView: View {
    let dashboardVM: DashboardViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Team Sales Performance")
                .font(.headline)
            
            VStack(spacing: 8) {
                TeamMemberRow(
                    name: "Aditya Singh",
                    dealsWon: 12,
                    revenue: "$285K",
                    conversion: "28%",
                    target: "95%"
                )
                
                TeamMemberRow(
                    name: "Sarah Chen",
                    dealsWon: 8,
                    revenue: "$198K",
                    conversion: "22%",
                    target: "82%"
                )
                
                TeamMemberRow(
                    name: "Michael Johnson",
                    dealsWon: 10,
                    revenue: "$245K",
                    conversion: "25%",
                    target: "88%"
                )
                
                TeamMemberRow(
                    name: "Elena Rodriguez",
                    dealsWon: 6,
                    revenue: "$142.5K",
                    conversion: "20%",
                    target: "71%"
                )
            }
        }
    }
}

struct TeamMemberRow: View {
    let name: String
    let dealsWon: Int
    let revenue: String
    let conversion: String
    let target: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(name)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                HStack(spacing: 12) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(dealsWon)")
                            .font(.subheadline)
                            .fontWeight(.bold)
                        Text("Deals")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(revenue)
                            .font(.subheadline)
                            .fontWeight(.bold)
                        Text("Revenue")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            }
            
            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Conversion")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(conversion)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("Target")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text(target)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                }
                
                Spacer()
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

#Preview {
    ComprehensiveDashboardView()
        .environmentObject(AppViewModel())
}
