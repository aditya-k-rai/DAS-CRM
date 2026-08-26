//
// ReportsAnalyticsView.swift
// DASCRM macOS App Reports & Performance Analytics
// High performance metrics, charts & export engine (CSV/PDF)
//

import SwiftUI

public struct ReportsAnalyticsView: View {
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Executive Reports & Analytics")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("Deep-dive sales velocity, revenue trends, and team performance metrics")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                Spacer()
                Button("Export CSV Report") {}
                    .buttonStyle(.bordered)
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ReportMetricCard(title: "Monthly Recurring Revenue", value: "$184,200", growth: "+14.2%", isPositive: true)
                ReportMetricCard(title: "Sales Velocity (Days)", value: "14.5 Days", growth: "-2.3 Days", isPositive: true)
                ReportMetricCard(title: "Customer Acquisition Cost", value: "$420", growth: "-5.8%", isPositive: true)
            }
            .padding(.horizontal, 24)
            
            // Visual Performance Chart Representation
            VStack(alignment: .leading, spacing: 12) {
                Text("Quarterly Revenue vs Target")
                    .font(.system(size: 15, weight: .bold))
                
                HStack(alignment: .bottom, spacing: 24) {
                    BarGroup(label: "Q1", height: 120, color: .blue)
                    BarGroup(label: "Q2", height: 160, color: .blue)
                    BarGroup(label: "Q3 (Current)", height: 210, color: .purple)
                    BarGroup(label: "Q4 (Target)", height: 240, color: .green)
                }
                .frame(height: 250)
                .padding(.top, 16)
            }
            .padding(20)
            .background(Color(NSColor.windowBackgroundColor))
            .cornerRadius(14)
            .padding(.horizontal, 24)
            
            Spacer()
        }
    }
}

struct ReportMetricCard: View {
    let title: String
    let value: String
    let growth: String
    let isPositive: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.secondary)
            
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
            
            Text(growth)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(isPositive ? .green : .red)
        }
        .padding(16)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
    }
}

struct BarGroup: View {
    let label: String
    let height: CGFloat
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            RoundedRectangle(cornerRadius: 6)
                .fill(LinearGradient(colors: [color, color.opacity(0.6)], startPoint: .top, endPoint: .bottom))
                .frame(width: 40, height: height)
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(.secondary)
        }
    }
}
