//
// QuotationsView.swift
// DASCRM macOS App Quotations & Invoices View
// Create, track and convert sales proposals to active invoices
//

import SwiftUI

public struct QuotationsView: View {
    @State private var quotations: [Quotation] = [
        Quotation(quoteNumber: "QT-2026-0891", clientName: "Sarah Jenkins", companyName: "Apex Technologies", totalAmount: 45000.00, status: .sent, itemsCount: 3),
        Quotation(quoteNumber: "QT-2026-0892", clientName: "Michael Chang", companyName: "Nexus Labs", totalAmount: 28500.00, status: .accepted, itemsCount: 2),
        Quotation(quoteNumber: "QT-2026-0893", clientName: "Elena Rostova", companyName: "Global Inc", totalAmount: 120000.00, status: .invoiced, itemsCount: 5)
    ]
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Quotations & Invoices")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("Generate, send and audit formal client quotes and payment invoices")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                Spacer()
                Button("+ Create Quote") {}
                    .buttonStyle(.borderedProminent)
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            
            ScrollView(.vertical, showsIndicators: true) {
                VStack(spacing: 12) {
                    ForEach(quotations) { quote in
                        HStack(spacing: 16) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.purple.opacity(0.12))
                                    .frame(width: 40, height: 40)
                                Image(systemName: "doc.text.fill")
                                    .foregroundColor(.purple)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("\(quote.quoteNumber) • \(quote.companyName)")
                                    .font(.system(size: 14, weight: .bold))
                                Text("Client: \(quote.clientName) • \(quote.itemsCount) line items")
                                    .font(.system(size: 11))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing, spacing: 4) {
                                Text("$\(Int(quote.totalAmount).formattedWithCommas())")
                                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                                Text(quote.status.rawValue)
                                    .font(.system(size: 10, weight: .bold))
                                    .padding(.horizontal, 8).padding(.vertical, 3)
                                    .background(Color.green.opacity(0.15))
                                    .foregroundColor(.green)
                                    .cornerRadius(6)
                            }
                        }
                        .padding(14)
                        .background(Color(NSColor.windowBackgroundColor))
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 24)
            }
        }
    }
}
