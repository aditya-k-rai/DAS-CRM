"""
ProductsView.swift — DAS CRM macOS
Product Catalog with SKU Management, Pricing, and Categories
Feature parity with Android ProductsCatalogScreen.tsx
"""

import SwiftUI

struct ProductItem: Identifiable {
    let id: String
    let name: String
    let sku: String
    let category: String
    let price: String
    let stock: Int
    let description: String
    let status: String
}

let fallbackProducts = [
    ProductItem(id: "p1", name: "Enterprise CRM Suite (Per Seat)", sku: "DAS-CRM-ENT",
               category: "Software License", price: "$1,250", stock: 500,
               description: "Full-featured CRM platform with all modules", status: "ACTIVE"),
    ProductItem(id: "p2", name: "AI Lead Routing Engine Module", sku: "DAS-AI-ROUTE",
               category: "Add-On Module", price: "$450", stock: 100,
               description: "Advanced AI-powered lead distribution", status: "ACTIVE"),
    ProductItem(id: "p3", name: "Automated WhatsApp Telemetry Hook", sku: "DAS-WA-HOOK",
               category: "Integration", price: "$290", stock: 250,
               description: "Real-time WhatsApp message tracking", status: "ACTIVE"),
    ProductItem(id: "p4", name: "Custom Multi-Tenant Setup Service", sku: "DAS-SRV-SETUP",
               category: "Professional Services", price: "$2,500", stock: 20,
               description: "Dedicated setup and configuration service", status: "ACTIVE"),
    ProductItem(id: "p5", name: "Annual Support & Maintenance Plan", sku: "DAS-SUP-ANNUAL",
               category: "Support & Maintenance", price: "$4,999", stock: 100,
               description: "Priority support and system maintenance", status: "ACTIVE"),
]

let productCategories = [
    "Software License",
    "Add-On Module",
    "Integration",
    "Professional Services",
    "Support & Maintenance",
]

@MainActor
class ProductsViewModel: ObservableObject {
    @Published var products: [ProductItem] = fallbackProducts
    @Published var search: String = ""
    @Published var selectedCategory: String = "ALL"

    var filteredProducts: [ProductItem] {
        products.filter { product in
            let passesCategoryFilter = selectedCategory == "ALL" || product.category == selectedCategory
            let passesSearch: Bool
            if search.isEmpty {
                passesSearch = true
            } else {
                let q = search.lowercased()
                passesSearch = product.name.lowercased().contains(q) ||
                              product.sku.lowercased().contains(q) ||
                              product.category.lowercased().contains(q) ||
                              product.price.lowercased().contains(q)
            }
            return passesCategoryFilter && passesSearch
        }
    }
}

struct ProductsView: View {
    @StateObject private var viewModel = ProductsViewModel()
    @State private var selectedProduct: ProductItem?
    @State private var showProductDetails = false
    @State private var showCreateProduct = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("📦 Product Catalog")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by name, SKU, category...", text: $viewModel.search)
                        .textFieldStyle(.plain)
                        .foregroundColor(.white)

                    if !viewModel.search.isEmpty {
                        Button(action: { viewModel.search = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(8)

                // Action buttons
                HStack {
                    Button(action: { showCreateProduct = true }) {
                        Text("➕ Add Product")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Spacer()
                }

                // Category filter chips
                HStack(spacing: 6) {
                    ForEach(["ALL"] + productCategories, id: \.self) { category in
                        Button(action: { viewModel.selectedCategory = category }) {
                            Text(category)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(viewModel.selectedCategory == category ? .white : Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(viewModel.selectedCategory == category ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.02, green: 0.06, blue: 0.12))
                        .border(viewModel.selectedCategory == category ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(6)
                    }
                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Products Table
            Table(viewModel.filteredProducts) {
                TableColumn("Product Name", value: \.name)
                TableColumn("SKU", value: \.sku)
                TableColumn("Category", value: \.category)
                TableColumn("Price", value: \.price)
                TableColumn("Stock") { product in
                    Text(String(product.stock))
                        .foregroundColor(
                            product.stock > 50 ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                            product.stock > 10 ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                            Color(red: 0.98, green: 0.30, blue: 0.40)
                        )
                }
                TableColumn("Status") { product in
                    Text(product.status)
                        .foregroundColor(
                            product.status == "ACTIVE" ?
                            Color(red: 0.2, green: 0.83, blue: 0.60) :
                            Color(red: 0.98, green: 0.30, blue: 0.40)
                        )
                }
                TableColumn("Action") { product in
                    Button(action: {
                        selectedProduct = product
                        showProductDetails = true
                    }) {
                        Text("👁️ View")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .cornerRadius(4)
                    }
                    .buttonStyle(.plain)
                }
            }
            .background(Color(red: 0.03, green: 0.04, blue: 0.07))
            .onDoubleClickSelectAll(false)
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Products")
        .sheet(isPresented: $showProductDetails) {
            if let product = selectedProduct {
                ProductDetailsSheet(product: product, isPresented: $showProductDetails)
            }
        }
        .sheet(isPresented: $showCreateProduct) {
            CreateProductSheet(products: $viewModel.products, isPresented: $showCreateProduct)
        }
    }
}

struct ProductDetailsSheet: View {
    let product: ProductItem
    @Binding var isPresented: Bool
    @State private var showEditAlert = false
    @State private var showReorderAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("📦 \(product.name)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Spacer()

                        Text(product.status)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(product.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.30, blue: 0.40))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background((product.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.30, blue: 0.40)).opacity(0.15))
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Product Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📋 Product Information")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "SKU", value: product.sku)
                        DetailRow(label: "Category", value: product.category)
                        DetailRow(label: "Price", value: product.price)
                        DetailRow(label: "Stock Level", value: String(product.stock))
                        DetailRow(label: "Description", value: product.description)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: { showEditAlert = true }) {
                            Text("✏️ Edit Product")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.98, green: 0.58, blue: 0.09))
                                .cornerRadius(6)
                        }
                        Button(action: { showReorderAlert = true }) {
                            Text("📦 Reorder Stock")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Product Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("✏️ Edit Product", isPresented: $showEditAlert) {
                Button("OK") { }
            } message: {
                Text("Editing \(product.name)...")
            }
            .alert("📦 Reorder Stock", isPresented: $showReorderAlert) {
                Button("OK") { }
            } message: {
                Text("Initiating reorder for \(product.name)...")
            }
        }
    }
}

struct CreateProductSheet: View {
    @Binding var products: [ProductItem]
    @Binding var isPresented: Bool

    @State private var name = ""
    @State private var sku = ""
    @State private var selectedCategory = "Software License"
    @State private var price = ""
    @State private var stock = 100
    @State private var description = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("➕ Create New Product")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text("Add a new product to your catalog.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Product Name *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. Enterprise CRM Suite", text: $name)
                            .textFieldStyle(.roundedBorder)
                            .foregroundColor(.white)

                        Text("SKU *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. DAS-CRM-ENT", text: $sku)
                            .textFieldStyle(.roundedBorder)
                            .foregroundColor(.white)

                        Text("Category *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Category", selection: $selectedCategory) {
                            ForEach(productCategories, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Text("Price ($) *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. 1250", text: $price)
                            .textFieldStyle(.roundedBorder)
                            .foregroundColor(.white)

                        Text("Stock Quantity *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Stepper(value: $stock, in: 0...10000) {
                            Text("\(stock) units")
                        }

                        Text("Description")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("Product description...", text: $description)
                            .textFieldStyle(.roundedBorder)
                            .foregroundColor(.white)
                    }

                    Spacer()

                    HStack(spacing: 8) {
                        Button(action: { isPresented = false }) {
                            Text("Cancel")
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                .cornerRadius(6)
                        }
                        Button(action: {
                            let newProduct = ProductItem(
                                id: "p-\(UUID())",
                                name: name,
                                sku: sku,
                                category: selectedCategory,
                                price: "$\(price)",
                                stock: stock,
                                description: description,
                                status: "ACTIVE"
                            )
                            products.insert(newProduct, at: 0)
                            isPresented = false
                        }) {
                            Text("Create Product ✓")
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("New Product")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text("\(label):")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                .frame(width: 100, alignment: .leading)
            Text(value)
                .font(.system(size: 10))
                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                .lineLimit(2)
            Spacer()
        }
    }
}

#Preview {
    NavigationView {
        ProductsView()
    }
}
