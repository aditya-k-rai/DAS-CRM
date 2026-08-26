//
// DashboardView.swift
// DAS CRM iOS App - Dashboard Feature View
//

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @StateObject private var dashboardVM = DashboardViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // KPI Cards
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        KPICard(label: "Total Revenue", value: "$248.5K", change: "↑ 18.4%", color: .teal)
                        KPICard(label: "Monthly Growth", value: "18.4%", change: "↑ 3.2%", color: .blue)
                        KPICard(label: "Total Leads", value: "1,420", change: "↑ 24%", color: .purple)
                        KPICard(label: "Active Deals", value: "86", change: "↑ 12%", color: .pink)
                    }
                    .padding(.horizontal)
                    
                    // Recent Leads Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Recent Leads")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ForEach(dashboardVM.recentLeads.prefix(3), id: \.id) { lead in
                            LeadRow(lead: lead)
                        }
                    }
                    .padding(.top, 8)
                    
                    // Top Deals Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Top Deals")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        ForEach(dashboardVM.topDeals.prefix(3), id: \.id) { deal in
                            DealRow(deal: deal)
                        }
                    }
                    
                    Spacer()
                }
                .padding(.vertical)
            }
            .navigationTitle("Dashboard")
        }
    }
}

struct KPICard: View {
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
                .font(.title2)
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

struct LeadRow: View {
    let lead: Lead
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(lead.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Text(lead.companyName)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                Text(String(format: "$%.0f", lead.value))
                    .font(.subheadline)
                    .fontWeight(.bold)
            }
            
            HStack(spacing: 8) {
                Capsule()
                    .fill(statusColor(lead.status))
                    .frame(height: 20)
                    .overlay(
                        Text(lead.status.rawValue.capitalized)
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    )
                
                Spacer()
                
                Text(lead.source)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
    
    private func statusColor(_ status: LeadStatus) -> Color {
        switch status {
        case .new: return .blue
        case .contacted: return .orange
        case .qualified: return .yellow
        case .proposal: return .purple
        case .won: return .green
        case .lost: return .red
        }
    }
}

struct DealRow: View {
    let deal: Deal
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(deal.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    Text(deal.companyName)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text(String(format: "$%.0f", deal.amount))
                        .font(.subheadline)
                        .fontWeight(.bold)
                    Text("\(deal.probability)%")
                        .font(.caption2)
                        .foregroundColor(.green)
                }
            }
            
            HStack(spacing: 8) {
                Capsule()
                    .fill(stageColor(deal.stage))
                    .frame(height: 20)
                    .overlay(
                        Text(deal.stage.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                    )
                
                Spacer()
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
    
    private func stageColor(_ stage: DealStage) -> Color {
        switch stage {
        case .prospecting: return .blue
        case .demoScheduled: return .cyan
        case .negotiation: return .orange
        case .contractSent: return .purple
        case .won: return .green
        case .lost: return .red
        }
    }
}

#Preview {
    DashboardView()
        .environmentObject(AppViewModel())
}
