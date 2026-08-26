//
// CRMModels.swift
// DAS CRM iOS App - Core Data Models
// Unified Codable models matching backend DTOs and Windows app
//

import Foundation

// MARK: - User Models

public struct User: Codable, Identifiable {
    public let id: String
    public let name: String
    public let email: String
    public let role: UserRole
    public let avatarUrl: String?
    public let organizationId: String
    public let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, email, role
        case avatarUrl = "avatar_url"
        case organizationId = "organization_id"
        case createdAt = "created_at"
    }
}

public enum UserRole: String, Codable {
    case admin = "admin"
    case manager = "manager"
    case salesRep = "sales_rep"
    case viewer = "viewer"
}

// MARK: - Lead Models

public struct Lead: Codable, Identifiable {
    public let id: String?
    public let title: String
    public let contactName: String
    public let email: String
    public let phone: String
    public let companyName: String
    public let value: Double
    public var status: LeadStatus
    public let source: String
    public let notes: String?
    public let createdAt: Date
    public let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, title, email, phone, value, status, source, notes
        case contactName = "contact_name"
        case companyName = "company_name"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

public enum LeadStatus: String, Codable {
    case new = "new"
    case contacted = "contacted"
    case qualified = "qualified"
    case proposal = "proposal"
    case won = "won"
    case lost = "lost"
}

// MARK: - Deal Models

public struct Deal: Codable, Identifiable {
    public let id: String?
    public let title: String
    public let companyName: String
    public let amount: Double
    public var stage: DealStage
    public let probability: Int
    public let expectedCloseDate: Date
    public let ownerName: String
    public let notes: String?
    public let createdAt: Date
    public let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, title, amount, stage, probability, notes
        case companyName = "company_name"
        case expectedCloseDate = "expected_close_date"
        case ownerName = "owner_name"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

public enum DealStage: String, Codable {
    case prospecting = "prospecting"
    case demoScheduled = "demo_scheduled"
    case negotiation = "negotiation"
    case contractSent = "contract_sent"
    case won = "won"
    case lost = "lost"
}

// MARK: - Contact Models

public struct Contact: Codable, Identifiable {
    public let id: String?
    public let name: String
    public let email: String
    public let phone: String
    public let company: String
    public let title: String
    public let tags: [String]
    public let notes: String?
    public let createdAt: Date
    public let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, email, phone, company, title, tags, notes
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Product Models

public struct ProductItem: Codable, Identifiable {
    public let id: String?
    public let sku: String
    public let name: String
    public let description: String?
    public let unitPrice: Double
    public let stockQuantity: Int
    public let category: String
    public let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, sku, name, description, category
        case unitPrice = "unit_price"
        case stockQuantity = "stock_quantity"
        case createdAt = "created_at"
    }
}

// MARK: - Quotation Models

public struct Quotation: Codable, Identifiable {
    public let id: String?
    public let quoteNumber: String
    public let clientName: String
    public let items: [[String: AnyCodable]]
    public let subtotal: Double
    public let tax: Double
    public let total: Double
    public var status: QuotationStatus
    public let issueDate: Date
    public let dueDate: Date?
    public let notes: String?
    
    enum CodingKeys: String, CodingKey {
        case id, items, subtotal, tax, total, status, notes
        case quoteNumber = "quote_number"
        case clientName = "client_name"
        case issueDate = "issue_date"
        case dueDate = "due_date"
    }
}

public enum QuotationStatus: String, Codable {
    case draft = "draft"
    case sent = "sent"
    case accepted = "accepted"
    case paid = "paid"
    case expired = "expired"
}

// MARK: - Analytics Models

public struct AnalyticsMetric: Codable {
    public let metricName: String
    public let value: Double
    public let unit: String
    public let period: String
    public let changePercent: Double
    public let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case value, unit, period
        case metricName = "metric_name"
        case changePercent = "change_percent"
        case updatedAt = "updated_at"
    }
}

public struct AnalyticsMetrics: Codable {
    public let totalRevenue: Double?
    public let monthlyGrowth: Double?
    public let totalLeads: Int?
    public let activeDeals: Int?
    public let conversionRate: Double?
    public let metrics: [AnalyticsMetric]?
    
    enum CodingKeys: String, CodingKey {
        case metrics
        case totalRevenue = "total_revenue"
        case monthlyGrowth = "monthly_growth"
        case totalLeads = "total_leads"
        case activeDeals = "active_deals"
        case conversionRate = "conversion_rate"
    }
}

// MARK: - Bulk Import Models

public struct BulkImportJob: Codable, Identifiable {
    public let id: String?
    public let filename: String
    public let entityType: String
    public let totalRows: Int
    public let processedRows: Int
    public let successfulRows: Int
    public let failedRows: Int
    public let status: String
    public let errorMessages: [String]
    public let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, filename, status, createdAt
        case entityType = "entity_type"
        case totalRows = "total_rows"
        case processedRows = "processed_rows"
        case successfulRows = "successful_rows"
        case failedRows = "failed_rows"
        case errorMessages = "error_messages"
    }
}

// MARK: - Audit Log Models

public struct AuditLogItem: Codable, Identifiable {
    public let id: String?
    public let userId: String
    public let action: String
    public let entityType: String
    public let entityId: String
    public let oldValues: [String: AnyCodable]?
    public let newValues: [String: AnyCodable]?
    public let timestamp: Date
    public let ipAddress: String?
    
    enum CodingKeys: String, CodingKey {
        case id, action, timestamp
        case userId = "user_id"
        case entityType = "entity_type"
        case entityId = "entity_id"
        case oldValues = "old_values"
        case newValues = "new_values"
        case ipAddress = "ip_address"
    }
}

// MARK: - Task Models

public struct Task: Codable, Identifiable {
    public let id: String?
    public let title: String
    public let description: String?
    public let assignedTo: String
    public let dueDate: Date?
    public var status: String
    public let priority: String
    public let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, title, description, status, priority
        case assignedTo = "assigned_to"
        case dueDate = "due_date"
        case createdAt = "created_at"
    }
}

// MARK: - Attendance Models

public struct AttendanceRecord: Codable, Identifiable {
    public let id: String?
    public let employeeId: String
    public let employeeName: String
    public let checkIn: Date
    public let checkOut: Date?
    public let date: String
    
    enum CodingKeys: String, CodingKey {
        case id, date
        case employeeId = "employee_id"
        case employeeName = "employee_name"
        case checkIn = "check_in"
        case checkOut = "check_out"
    }
}

// MARK: - Automation Models

public struct Automation: Codable, Identifiable {
    public let id: String?
    public let name: String
    public let trigger: String
    public let actions: [[String: AnyCodable]]
    public let enabled: Bool
    public let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id, name, trigger, actions, enabled
        case createdAt = "created_at"
    }
}

// MARK: - Communication Models

public struct Communication: Codable, Identifiable {
    public let id: String?
    public let contactId: String
    public let contactName: String
    public let messageType: String
    public let content: String
    public let direction: String
    public let status: String
    public let timestamp: Date
    
    enum CodingKeys: String, CodingKey {
        case id, content, direction, status, timestamp
        case contactId = "contact_id"
        case contactName = "contact_name"
        case messageType = "message_type"
    }
}

// MARK: - Navigation Tab Enum

public enum NavigationTab: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case leads = "Leads Engine"
    case deals = "Deals & Pipeline"
    case contacts = "Contacts Directory"
    case products = "Products Catalog"
    case quotations = "Quotations & Invoices"
    case reports = "Analytics & Reports"
    case bulkIngestion = "Bulk Ingestion"
    case adminControl = "Admin & RBAC"
    case tasks = "Tasks & Follow-ups"
    case hr = "HR & Attendance"
    case automations = "Automations"
    case comms = "WhatsApp & Comms"
    case settings = "App Settings"
    
    public var id: String { rawValue }
    
    public var iconName: String {
        switch self {
        case .dashboard: return "square.grid.2x2.fill"
        case .leads: return "person.crop.circle.badge.plus"
        case .deals: return "chart.bar.doc.horizontal.fill"
        case .contacts: return "person.2.fill"
        case .products: return "shippingbox.fill"
        case .quotations: return "doc.text.fill"
        case .reports: return "chart.line.uptrend.xyaxis"
        case .bulkIngestion: return "square.and.arrow.down.on.square.fill"
        case .adminControl: return "shield.fill"
        case .tasks: return "checkmark.circle.fill"
        case .hr: return "building.columns.fill"
        case .automations: return "bolt.horizontal.circle.fill"
        case .comms: return "message.fill"
        case .settings: return "gearshape.fill"
        }
    }
}
