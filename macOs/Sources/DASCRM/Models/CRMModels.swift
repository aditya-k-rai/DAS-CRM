//
// CRMModels.swift
// DASCRM macOS App Data Transfer Objects & Domain Models
// Full parity with NestJS Backend Prisma Schema
//

import Foundation

// MARK: - User & Auth
public struct User: Identifiable, Codable, Hashable {
    public let id: String
    public var name: String
    public var email: String
    public var role: UserRole
    public var avatarUrl: String?
    public var organizationId: String
    public var createdAt: Date?
    
    public init(id: String, name: String, email: String, role: UserRole, avatarUrl: String? = nil, organizationId: String, createdAt: Date? = Date()) {
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.avatarUrl = avatarUrl
        self.organizationId = organizationId
        self.createdAt = createdAt
    }
}

public enum UserRole: String, Codable, CaseIterable {
    case superadmin = "SUPER_ADMIN"
    case orgAdmin = "ORG_ADMIN"
    case manager = "MANAGER"
    case salesRep = "SALES_REP"
    case employee = "EMPLOYEE"
}

public struct AuthResponse: Codable {
    public let accessToken: String
    public let user: User
}

// MARK: - Lead Model
public struct Lead: Identifiable, Codable, Hashable {
    public let id: String
    public var title: String
    public var contactName: String
    public var email: String
    public var phone: String
    public var companyName: String
    public var value: Double
    public var status: LeadStatus
    public var source: String
    public var assignedToName: String?
    public var createdAt: Date
    
    public init(id: String = UUID().uuidString, title: String, contactName: String, email: String, phone: String, companyName: String, value: Double, status: LeadStatus, source: String, assignedToName: String? = nil, createdAt: Date = Date()) {
        self.id = id
        self.title = title
        self.contactName = contactName
        self.email = email
        self.phone = phone
        self.companyName = companyName
        self.value = value
        self.status = status
        self.source = source
        self.assignedToName = assignedToName
        self.createdAt = createdAt
    }
}

public enum LeadStatus: String, Codable, CaseIterable, Identifiable {
    case new = "NEW"
    case contacted = "CONTACTED"
    case qualified = "QUALIFIED"
    case proposal = "PROPOSAL_SENT"
    case won = "WON"
    case lost = "LOST"
    
    public var id: String { rawValue }
    
    public var displayName: String {
        switch self {
        case .new: return "New Lead"
        case .contacted: return "Contacted"
        case .qualified: return "Qualified"
        case .proposal: return "Proposal Sent"
        case .won: return "Won 🎉"
        case .lost: return "Closed Lost"
        }
    }
}

// MARK: - Deal / Pipeline Stage Model
public struct Deal: Identifiable, Codable, Hashable {
    public let id: String
    public var title: String
    public var companyName: String
    public var amount: Double
    public var stage: DealStage
    public var probability: Int
    public var expectedCloseDate: Date
    public var ownerName: String
    
    public init(id: String = UUID().uuidString, title: String, companyName: String, amount: Double, stage: DealStage, probability: Int, expectedCloseDate: Date, ownerName: String) {
        self.id = id
        self.title = title
        self.companyName = companyName
        self.amount = amount
        self.stage = stage
        self.probability = probability
        self.expectedCloseDate = expectedCloseDate
        self.ownerName = ownerName
    }
}

public enum DealStage: String, Codable, CaseIterable, Identifiable {
    case lead = "Lead"
    case contactMade = "Contact Made"
    case demoScheduled = "Demo Scheduled"
    case negotiation = "Negotiation"
    case contractSent = "Contract Sent"
    case closedWon = "Closed Won"
    
    public var id: String { rawValue }
}

// MARK: - Contact Model
public struct Contact: Identifiable, Codable, Hashable {
    public let id: String
    public var name: String
    public var email: String
    public var phone: String
    public var company: String
    public var designation: String
    public var tags: [String]
    
    public init(id: String = UUID().uuidString, name: String, email: String, phone: String, company: String, designation: String, tags: [String]) {
        self.id = id
        self.name = name
        self.email = email
        self.phone = phone
        self.company = company
        self.designation = designation
        self.tags = tags
    }
}

// MARK: - Task Model
public struct CRMTask: Identifiable, Codable, Hashable {
    public let id: String
    public var title: String
    public var dueDate: Date
    public var priority: TaskPriority
    public var isCompleted: Bool
    public var category: String
    
    public init(id: String = UUID().uuidString, title: String, dueDate: Date, priority: TaskPriority, isCompleted: Bool = false, category: String = "Sales") {
        self.id = id
        self.title = title
        self.dueDate = dueDate
        self.priority = priority
        self.isCompleted = isCompleted
        self.category = category
    }
}

public enum TaskPriority: String, Codable, CaseIterable, Identifiable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    case urgent = "Urgent 🔥"
    
    public var id: String { rawValue }
}

// MARK: - HR & Attendance
public struct AttendanceRecord: Identifiable, Codable, Hashable {
    public let id: String
    public var date: Date
    public var checkIn: String
    public var checkOut: String?
    public var status: String
    public var totalHours: Double
}

// MARK: - Automation Rule
public struct AutomationRule: Identifiable, Codable, Hashable {
    public let id: String
    public var name: String
    public var trigger: String
    public var action: String
    public var isActive: Bool
    public var executionsCount: Int
}
