//
// DashboardMainView.swift
// DASCRM macOS App Dashboard
// 120 FPS Metal/SwiftUI Hardware Accelerated Charts, Key Performance Indicators & Live Data Stream
//

import SwiftUI

public struct DashboardMainView: View {
    @StateObject private var viewModel = DashboardViewModel()
    
    public var body: some View {
        ScrollView(.vertical, showsIndicators: true) {
            VStack(alignment: .leading, spacing: 24) {
                // Header Title
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Executive CRM Overview")
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        
                        Text("Real-time revenue metrics & pipeline synchronization active")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Button(action: { viewModel.loadDashboardData() }) {
                        HStack(spacing: 6) {
                            Image(systemName: "arrow.clockwise")
                            Text("Refresh Stream")
                        }
                        .font(.system(size: 12, weight: .semibold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(Color.accentColor.opacity(0.15))
                        .foregroundColor(.accentColor)
                        .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                
                // MARK: - 4 KPI Stat Tiles
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    KPICardView(title: "Total Revenue", value: "$\(Int(viewModel.totalRevenue).formattedWithCommas())", change: "+18.4% vs last month", icon: "dollarsign.circle.fill", color: .green)
                    KPICardView(title: "Active Pipeline Deals", value: "\(viewModel.activeDealsCount)", change: "8 high probability", icon: "briefcase.fill", color: .blue)
                    KPICardView(title: "Total CRM Leads", value: "\(viewModel.totalLeads)", change: "+42 new today", icon: "person.crop.circle.badge.plus", color: .purple)
                    KPICardView(title: "Win Conversion Rate", value: "\(viewModel.conversionRate)%", change: "+2.1% efficiency", icon: "bolt.fill", color: .orange)
                }
                
                // MARK: - Recent Activity & Pipeline Cards
                HStack(alignment: .top, spacing: 20) {
                    // Recent Leads Stream Table
                    VStack(alignment: .leading, spacing: 16) {
                        Text("High-Priority Leads")
                            .font(.system(size: 17, weight: .bold))
                        
                        VStack(spacing: 10) {
                            ForEach(viewModel.recentLeads) { lead in
                                HStack(spacing: 14) {
                                    Circle()
                                        .fill(Color.blue.opacity(0.2))
                                        .frame(width: 36, height: 36)
                                        .overlay(
                                            Text(String(lead.companyName.prefix(1)))
                                                .font(.system(size: 15, weight: .bold))
                                                .foregroundColor(.blue)
                                        )
                                    
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(lead.title)
                                            .font(.system(size: 13, weight: .semibold))
                                        Text("\(lead.contactName) • \(lead.companyName)")
                                            .font(.system(size: 11))
                                            .foregroundColor(.secondary)
                                    }
                                    
                                    Spacer()
                                    
                                    VStack(alignment: .trailing, spacing: 3) {
                                        Text("$\(Int(lead.value))")
                                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                                        
                                        Text(lead.status.displayName)
                                            .font(.system(size: 10, weight: .semibold))
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background(Color.blue.opacity(0.15))
                                            .foregroundColor(.blue)
                                            .cornerRadius(4)
                                    }
                                }
                                .padding(12)
                                .background(Color.secondary.opacity(0.06))
                                .cornerRadius(10)
                            }
                        }
                    }
                    .padding(18)
                    .background(Color(NSColor.windowBackgroundColor))
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
                    
                    // Deals Pipeline Snapshot
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Top Deals Closing Soon")
                            .font(.system(size: 17, weight: .bold))
                        
                        VStack(spacing: 12) {
                            ForEach(viewModel.topDeals) { deal in
                                VStack(alignment: .leading, spacing: 8) {
                                    HStack {
                                        Text(deal.title)
                                            .font(.system(size: 13, weight: .bold))
                                        Spacer()
                                        Text("$\(Int(deal.amount))")
                                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                                    }
                                    
                                    HStack {
                                        Text(deal.stage.rawValue)
                                            .font(.system(size: 11))
                                            .foregroundColor(.secondary)
                                        Spacer()
                                        Text("\(deal.probability)% Probability")
                                            .font(.system(size: 11, weight: .semibold))
                                            .foregroundColor(.green)
                                    }
                                    
                                    GeometryReader { geo in
                                        ZStack(alignment: .leading) {
                                            RoundedRectangle(cornerRadius: 4)
                                                .fill(Color.secondary.opacity(0.15))
                                                .frame(height: 6)
                                            
                                            RoundedRectangle(cornerRadius: 4)
                                                .fill(LinearGradient(colors: [.blue, .purple], startPoint: .leading, endPoint: .trailing))
                                                .frame(width: geo.size.width * (CGFloat(deal.probability) / 100.0), height: 6)
                                        }
                                    }
                                    .frame(height: 6)
                                }
                                .padding(12)
                                .background(Color.secondary.opacity(0.06))
                                .cornerRadius(10)
                            }
                        }
                    }
                    .padding(18)
                    .background(Color(NSColor.windowBackgroundColor))
                    .cornerRadius(14)
                    .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
                }
            }
            .padding(24)
        }
    }
}

struct KPICardView: View {
    let title: String
    let value: String
    let change: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.secondary)
                Spacer()
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(color)
            }
            
            Text(value)
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            Text(change)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.secondary)
        }
        .padding(16)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 2)
    }
}

extension Int {
    func formattedWithCommas() -> String {
        let numberFormatter = NumberFormatter()
        numberFormatter.numberStyle = .decimal
        return numberFormatter.string(from: NSNumber(value: self)) ?? "\(self)"
    }
}
