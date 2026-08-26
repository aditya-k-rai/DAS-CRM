//
// ProductsCatalogView.swift
// DASCRM macOS App Products & Services Catalog
// High performance search, category filtering, stock & price grid
//

import SwiftUI

public struct ProductsCatalogView: View {
    @State private var products: [ProductItem] = [
        ProductItem(name: "DAS CRM Enterprise License", sku: "SKU-CRM-ENT", category: "Software", unitPrice: 2499.00, stockQuantity: 999, description: "Full multi-user enterprise license with 120 FPS desktop client & API integrations."),
        ProductItem(name: "Cloud Server Migration Service", sku: "SKU-SRV-MIG", category: "Services", unitPrice: 1500.00, stockQuantity: 50, description: "Turnkey cloud database & backend server setup."),
        ProductItem(name: "AI Copilot Integration Pack", sku: "SKU-AI-PACK", category: "Add-ons", unitPrice: 899.00, stockQuantity: 500, description: "Custom LLM & automated lead response module."),
        ProductItem(name: "WhatsApp Business API Gateway", sku: "SKU-WA-GATE", category: "Communications", unitPrice: 499.00, stockQuantity: 200, description: "Dedicated WhatsApp bulk messaging connector.")
    ]
    @State private var searchText = ""
    @State private var selectedCategory = "All"
    
    let categories = ["All", "Software", "Services", "Add-ons", "Communications"]
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Products & Services Catalog")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("Manage product SKUs, pricing, stock levels, and tax rates")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            
            // Category Filter
            HStack(spacing: 8) {
                ForEach(categories, id: \.self) { cat in
                    FilterTabChip(title: cat, isSelected: selectedCategory == cat) {
                        selectedCategory = cat
                    }
                }
                Spacer()
            }
            .padding(.horizontal, 24)
            
            // Product Grid
            ScrollView(.vertical, showsIndicators: true) {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                    ForEach(filteredProducts) { item in
                        ProductCardView(item: item)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
    }
    
    var filteredProducts: [ProductItem] {
        products.filter { p in
            (selectedCategory == "All" || p.category == selectedCategory) &&
            (searchText.isEmpty || p.name.localizedCaseInsensitiveContains(searchText) || p.sku.localizedCaseInsensitiveContains(searchText))
        }
    }
}

struct ProductCardView: View {
    let item: ProductItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(item.category.uppercased())
                    .font(.system(size: 10, weight: .bold))
                    .padding(.horizontal, 8).padding(.vertical, 3)
                    .background(Color.blue.opacity(0.12))
                    .foregroundColor(.blue)
                    .cornerRadius(4)
                Spacer()
                Text(item.sku)
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundColor(.secondary)
            }
            
            Text(item.name)
                .font(.system(size: 15, weight: .bold))
            
            Text(item.description)
                .font(.system(size: 11))
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            Divider()
            
            HStack {
                Text("$\(String(format: "%.2f", item.unitPrice))")
                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                    .foregroundColor(.green)
                Spacer()
                Text("Stock: \(item.stockQuantity)")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .background(Color(NSColor.windowBackgroundColor))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 2)
    }
}
