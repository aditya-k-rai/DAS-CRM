//
// DealsPipelineView.swift
// DASCRM macOS App Deals & Kanban Pipeline View
// Smooth 120 FPS Drag/Drop & Column Rendering for Sales Stages
//

import SwiftUI

public struct DealsPipelineView: View {
    @State private var deals: [Deal] = [
        Deal(title: "Apex Tech Cloud License", companyName: "Apex Tech", amount: 45000, stage: .negotiation, probability: 80, expectedCloseDate: Date().addingTimeInterval(86400 * 7), ownerName: "Aditya"),
        Deal(title: "Nexus AI Platform Retainer", companyName: "Nexus Labs", amount: 28500, stage: .demoScheduled, probability: 60, expectedCloseDate: Date().addingTimeInterval(86400 * 14), ownerName: "Aditya"),
        Deal(title: "Global Inc Enterprise Contract", companyName: "Global Inc", amount: 120000, stage: .contractSent, probability: 90, expectedCloseDate: Date().addingTimeInterval(86400 * 3), ownerName: "Aditya"),
        Deal(title: "BioTech Analytics System", companyName: "Quantum Bio", amount: 65000, stage: .lead, probability: 30, expectedCloseDate: Date().addingTimeInterval(86400 * 30), ownerName: "Aditya"),
        Deal(title: "Fintech Security Integration", companyName: "PayPulse", amount: 95000, stage: .closedWon, probability: 100, expectedCloseDate: Date(), ownerName: "Aditya")
    ]
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Deals & Pipeline Stage Kanban")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    
                    Text("Interactive multi-stage deal tracking with real-time value calculation")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                let totalPipeline = deals.reduce(0) { $0 + $1.amount }
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Total Pipeline Value")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(.secondary)
                    Text("$\(Int(totalPipeline).formattedWithCommas())")
                        .font(.system(size: 18, weight: .bold, design: .monospaced))
                        .foregroundColor(.green)
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            
            // Kanban Column Horizontal Flow
            ScrollView(.horizontal, showsIndicators: true) {
                HStack(alignment: .top, spacing: 16) {
                    ForEach(DealStage.allCases) { stage in
                        KanbanColumnView(
                            stage: stage,
                            deals: deals.filter { $0.stage == stage },
                            onStageChange: { dealId, newStage in
                                if let idx = deals.firstIndex(where: { $0.id == dealId }) {
                                    withAnimation(.spring(response: 0.25, dampingFraction: 0.8)) {
                                        deals[idx].stage = newStage
                                    }
                                }
                            }
                        )
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
    }
}

struct KanbanColumnView: View {
    let stage: DealStage
    let deals: [Deal]
    let onStageChange: (String, DealStage) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Column Header
            HStack {
                Text(stage.rawValue)
                    .font(.system(size: 13, weight: .bold))
                
                Spacer()
                
                Text("\(deals.count)")
                    .font(.system(size: 11, weight: .bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.secondary.opacity(0.15))
                    .cornerRadius(10)
            }
            .padding(.bottom, 4)
            
            let stageTotal = deals.reduce(0) { $0 + $1.amount }
            Text("$\(Int(stageTotal).formattedWithCommas())")
                .font(.system(size: 12, weight: .bold, design: .monospaced))
                .foregroundColor(.secondary)
            
            Divider()
            
            // Column Cards
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 10) {
                    ForEach(deals) { deal in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(deal.title)
                                .font(.system(size: 13, weight: .bold))
                            
                            Text(deal.companyName)
                                .font(.system(size: 11))
                                .foregroundColor(.secondary)
                            
                            HStack {
                                Text("$\(Int(deal.amount))")
                                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                                
                                Spacer()
                                
                                Text("\(deal.probability)%")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(.blue)
                            }
                        }
                        .padding(12)
                        .background(Color(NSColor.windowBackgroundColor))
                        .cornerRadius(8)
                        .shadow(color: Color.black.opacity(0.03), radius: 3, x: 0, y: 1)
                    }
                }
            }
        }
        .padding(14)
        .frame(width: 250, minHeight: 480)
        .background(Color.secondary.opacity(0.06))
        .cornerRadius(12)
    }
}
