//
// ExtendedCRMModels.swift
// DASCRM macOS App - Extended DTOs & Domain Models
// Full feature coverage for Products Catalog, Quotes/Invoices, Reports, Bulk Ingestion & Role Controls
//

import Foundation

// MARK: - Product Catalog Model
public struct ProductItem: Identifiable, Codable, Hashable {
    public let id: String
    public var name: String
    public var sku: String
    public var category: String
    public var unitPrice: Double
    public var stockQuantity: Int
    public var description: String
    public var isTaxable: Bool
    
    public init(id: String = UUID().uuidString, name: String, sku: String, category: String, unitPrice: Double, stockQuantity: Int, description: String, isTaxable: Bool = true) {
        self.id = id
        self.name = name
        self.sku = sku
        self.category = category
        self.unitPrice = unitPrice
        self.stockQuantity = stockQuantity
        self.description = description
        self.isTaxable = isTaxable
    }
}

// MARK: - Quotation & Invoice Model
public struct Quotation: Identifiable, Codable, Hashable {
    public let id: String
    public var quoteNumber: String
    public var clientName: String
    public var companyName: String
    public var totalAmount: Double
    public var status: QuoteStatus
    public var issueDate: Date
    public var expiryDate: Date
    public var itemsCount: Int
    
    public init(id: String = UUID().uuidString, quoteNumber: String, clientName: String, companyName: String, totalAmount: Double, status: QuoteStatus, issueDate: Date = Date(), expiryDate: Date = Date().addingTimeInterval(86400 * 14), itemsCount: Int) {
        self.id = id
        self.quoteNumber = quoteNumber
        self.clientName = clientName
        self.companyName = companyName
        self.totalAmount = totalAmount
        self.status = status
        self.issueDate = issueDate
        self.expiryDate = expiryDate
        self.itemsCount = itemsCount
    }
}

public enum QuoteStatus: String, Codable, CaseIterable, Identifiable {
    case draft = "Draft"
    case sent = "Sent"
    case accepted = "Accepted 🎉"
    case rejected = "Rejected"
    case invoiced = "Invoiced"
    
    public var id: String { rawValue }
}

// MARK: - Reports & Performance Analytics
public struct AnalyticsMetric: Identifiable, Codable, Hashable {
    public let id: String
    public var metricName: String
    public var currentValue: String
    public var targetValue: String
    public var percentageGrowth: Double
    public var category: String
}

// MARK: - Bulk Import Record
public struct BulkImportJob: Identifiable, Codable, Hashable {
    public let id: String
    public var fileName: String
    public var targetModule: String
    public var totalRows: Int
    public var processedRows: Int
    public var status: String
    public var createdAt: Date
}

// MARK: - Audit Log Record
public struct AuditLogItem: Identifiable, Codable, Hashable {
    public let id: String
    public var action: String
    public var actorName: String
    public var role: String
    public var timestamp: Date
    public var details: String
}
