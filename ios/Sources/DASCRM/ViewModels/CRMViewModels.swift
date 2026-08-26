//
// CRMViewModels.swift
// DAS CRM iOS App - View Models
// @MainActor state managers for all feature modules
//

import SwiftUI
import Combine

@MainActor
public final class AppViewModel: ObservableObject {
    @Published public var currentUser: User?
    @Published public var isAuthenticated: Bool = false
    @Published public var activeNavigationTab: NavigationTab = .dashboard
    @Published public var searchKeyword: String = ""
    @Published public var globalNotificationMessage: String?
    
    public init() {
        // Default seed session for rapid testing
        self.currentUser = User(
            id: "user-101",
            name: "iOS User",
            email: "user@dascrm.com",
            role: .admin,
            avatarUrl: nil,
            organizationId: "org-das-01",
            createdAt: Date()
        )
        self.isAuthenticated = true
    }
}

@MainActor
public final class DashboardViewModel: ObservableObject {
    @Published public var totalRevenue: Double = 248500.00
    @Published public var monthlyGrowth: Double = 18.4
    @Published public var totalLeads: Int = 1420
    @Published public var activeDealsCount: Int = 86
    @Published public var conversionRate: Double = 24.2
    
    @Published public var recentLeads: [Lead] = []
    @Published public var topDeals: [Deal] = []
    @Published public var isLoading: Bool = false
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        loadDashboardData()
    }
    
    public func loadDashboardData() {
        isLoading = true
        
        // Populate seed data for rapid testing
        self.recentLeads = [
            Lead(title: "Enterprise Cloud Migration", contactName: "Sarah Jenkins", email: "sarah@apextech.io", phone: "+1 415 555 0192", companyName: "Apex Technologies", value: 45000.0, status: .proposal, source: "Website Direct", notes: nil, createdAt: Date(), updatedAt: Date()),
            Lead(title: "Custom AI Workspace Setup", contactName: "Michael Chang", email: "mchang@nexuslab.com", phone: "+1 212 555 0148", companyName: "Nexus Labs", value: 28500.0, status: .qualified, source: "LinkedIn Outreach", notes: nil, createdAt: Date(), updatedAt: Date()),
            Lead(title: "Multi-seat DAS CRM Deployment", contactName: "Elena Rostova", email: "elena@globalinc.org", phone: "+44 20 7946 0912", companyName: "Global Inc", value: 120000.0, status: .new, source: "Partner Referral", notes: nil, createdAt: Date(), updatedAt: Date()),
        ]
        
        self.topDeals = [
            Deal(id: "deal-1", title: "Apex Tech Cloud License", companyName: "Apex Tech", amount: 45000, stage: .negotiation, probability: 80, expectedCloseDate: Date().addingTimeInterval(86400 * 7), ownerName: "iOS User", notes: nil, createdAt: Date(), updatedAt: Date()),
            Deal(id: "deal-2", title: "Nexus AI Platform Retainer", companyName: "Nexus Labs", amount: 28500, stage: .demoScheduled, probability: 60, expectedCloseDate: Date().addingTimeInterval(86400 * 14), ownerName: "iOS User", notes: nil, createdAt: Date(), updatedAt: Date()),
        ]
        
        isLoading = false
    }
}

@MainActor
public final class LeadsViewModel: ObservableObject {
    @Published public var leads: [Lead] = []
    @Published public var selectedFilter: LeadStatus? = nil
    @Published public var searchText: String = ""
    @Published public var isShowingAddLeadModal: Bool = false
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        fetchLeads()
    }
    
    public func fetchLeads() {
        self.leads = [
            Lead(title: "Enterprise Cloud Migration", contactName: "Sarah Jenkins", email: "sarah@apextech.io", phone: "+1 415 555 0192", companyName: "Apex Technologies", value: 45000.0, status: .proposal, source: "Website Direct", notes: nil, createdAt: Date(), updatedAt: Date()),
            Lead(title: "Custom AI Workspace Setup", contactName: "Michael Chang", email: "mchang@nexuslab.com", phone: "+1 212 555 0148", companyName: "Nexus Labs", value: 28500.0, status: .qualified, source: "LinkedIn Outreach", notes: nil, createdAt: Date(), updatedAt: Date()),
            Lead(title: "Multi-seat DAS CRM Deployment", contactName: "Elena Rostova", email: "elena@globalinc.org", phone: "+44 20 7946 0912", companyName: "Global Inc", value: 120000.0, status: .won, source: "Partner Referral", notes: nil, createdAt: Date(), updatedAt: Date()),
        ]
    }
    
    public func addLead(_ lead: Lead) {
        Task {
            var newLead = lead
            newLead.createdAt = Date()
            newLead.updatedAt = Date()
            withAnimation(.spring(response: 0.25, dampingFraction: 0.8)) {
                leads.insert(newLead, at: 0)
            }
        }
    }
    
    public func updateLeadStatus(id: String, newStatus: LeadStatus) {
        if let idx = leads.firstIndex(where: { $0.id == id }) {
            withAnimation(.spring(response: 0.2, dampingFraction: 0.75)) {
                leads[idx].status = newStatus
            }
        }
    }
    
    public var filteredLeads: [Lead] {
        leads.filter { lead in
            let matchesStatus = (selectedFilter == nil || lead.status == selectedFilter)
            let matchesSearch = searchText.isEmpty || lead.title.localizedCaseInsensitiveContains(searchText) || lead.companyName.localizedCaseInsensitiveContains(searchText) || lead.contactName.localizedCaseInsensitiveContains(searchText)
            return matchesStatus && matchesSearch
        }
    }
}

@MainActor
public final class DealsViewModel: ObservableObject {
    @Published public var deals: [Deal] = []
    @Published public var selectedStage: DealStage? = nil
    @Published public var searchText: String = ""
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        fetchDeals()
    }
    
    public func fetchDeals() {
        self.deals = [
            Deal(id: "deal-1", title: "Apex Tech Cloud License", companyName: "Apex Tech", amount: 45000, stage: .negotiation, probability: 80, expectedCloseDate: Date().addingTimeInterval(86400 * 7), ownerName: "iOS User", notes: nil, createdAt: Date(), updatedAt: Date()),
            Deal(id: "deal-2", title: "Nexus AI Platform Retainer", companyName: "Nexus Labs", amount: 28500, stage: .demoScheduled, probability: 60, expectedCloseDate: Date().addingTimeInterval(86400 * 14), ownerName: "iOS User", notes: nil, createdAt: Date(), updatedAt: Date()),
            Deal(id: "deal-3", title: "Global Inc Enterprise Contract", companyName: "Global Inc", amount: 120000, stage: .contractSent, probability: 90, expectedCloseDate: Date().addingTimeInterval(86400 * 3), ownerName: "iOS User", notes: nil, createdAt: Date(), updatedAt: Date()),
        ]
    }
    
    public func updateDealStage(id: String, newStage: DealStage) {
        if let idx = deals.firstIndex(where: { $0.id == id }) {
            withAnimation(.spring(response: 0.2, dampingFraction: 0.75)) {
                deals[idx].stage = newStage
            }
        }
    }
    
    public var filteredDeals: [Deal] {
        deals.filter { deal in
            let matchesStage = (selectedStage == nil || deal.stage == selectedStage)
            let matchesSearch = searchText.isEmpty || deal.title.localizedCaseInsensitiveContains(searchText) || deal.companyName.localizedCaseInsensitiveContains(searchText)
            return matchesStage && matchesSearch
        }
    }
    
    public var pipelineByStage: [DealStage: [Deal]] {
        Dictionary(grouping: deals, by: { $0.stage })
    }
    
    public var totalPipelineValue: Double {
        deals.reduce(0) { $0 + $1.amount }
    }
}

@MainActor
public final class ContactsViewModel: ObservableObject {
    @Published public var contacts: [Contact] = []
    @Published public var searchText: String = ""
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        fetchContacts()
    }
    
    public func fetchContacts() {
        self.contacts = [
            Contact(id: "contact-1", name: "Sarah Jenkins", email: "sarah@apextech.io", phone: "+1 415 555 0192", company: "Apex Technologies", title: "CTO", tags: ["Enterprise", "Tech"], notes: nil, createdAt: Date(), updatedAt: Date()),
            Contact(id: "contact-2", name: "Michael Chang", email: "mchang@nexuslab.com", phone: "+1 212 555 0148", company: "Nexus Labs", title: "CEO", tags: ["AI", "Startup"], notes: nil, createdAt: Date(), updatedAt: Date()),
        ]
    }
    
    public var filteredContacts: [Contact] {
        contacts.filter { contact in
            searchText.isEmpty || contact.name.localizedCaseInsensitiveContains(searchText) || contact.company.localizedCaseInsensitiveContains(searchText)
        }
    }
}

@MainActor
public final class ProductsViewModel: ObservableObject {
    @Published public var products: [ProductItem] = []
    @Published public var selectedCategory: String? = nil
    @Published public var searchText: String = ""
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        fetchProducts()
    }
    
    public func fetchProducts() {
        self.products = [
            ProductItem(id: "prod-1", sku: "CRM-001", name: "DAS CRM Pro", description: "Full-featured CRM platform", unitPrice: 1999.00, stockQuantity: 50, category: "Software", createdAt: Date()),
            ProductItem(id: "prod-2", sku: "CRM-002", name: "DAS CRM Enterprise", description: "Enterprise CRM solution", unitPrice: 4999.00, stockQuantity: 25, category: "Software", createdAt: Date()),
        ]
    }
    
    public var filteredProducts: [ProductItem] {
        products.filter { product in
            let matchesCategory = (selectedCategory == nil || product.category == selectedCategory)
            let matchesSearch = searchText.isEmpty || product.name.localizedCaseInsensitiveContains(searchText)
            return matchesCategory && matchesSearch
        }
    }
    
    public var categories: [String] {
        Array(Set(products.map { $0.category }))
    }
}

@MainActor
public final class QuotationsViewModel: ObservableObject {
    @Published public var quotations: [Quotation] = []
    @Published public var selectedStatus: QuotationStatus? = nil
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        fetchQuotations()
    }
    
    public func fetchQuotations() {
        self.quotations = [
            Quotation(id: "quote-1", quoteNumber: "QT-001", clientName: "Apex Technologies", items: [], subtotal: 45000, tax: 4500, total: 49500, status: .sent, issueDate: Date(), dueDate: Date().addingTimeInterval(86400 * 30), notes: nil),
            Quotation(id: "quote-2", quoteNumber: "QT-002", clientName: "Nexus Labs", items: [], subtotal: 28500, tax: 2850, total: 31350, status: .draft, issueDate: Date(), dueDate: nil, notes: nil),
        ]
    }
    
    public var filteredQuotations: [Quotation] {
        quotations.filter { quote in
            selectedStatus == nil || quote.status == selectedStatus
        }
    }
}

@MainActor
public final class ReportsViewModel: ObservableObject {
    @Published public var metrics: AnalyticsMetrics = AnalyticsMetrics(totalRevenue: 248500, monthlyGrowth: 18.4, totalLeads: 1420, activeDeals: 86, conversionRate: 24.2, metrics: [])
    @Published public var isLoading: Bool = false
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        loadAnalytics()
    }
    
    public func loadAnalytics() {
        isLoading = true
        // Metrics populated from init
        isLoading = false
    }
}

@MainActor
public final class AdminViewModel: ObservableObject {
    @Published public var auditLogs: [AuditLogItem] = []
    @Published public var isLoading: Bool = false
    
    private let apiClient: APIClient
    
    public init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
        loadAuditLogs()
    }
    
    public func loadAuditLogs() {
        isLoading = true
        // Placeholder for audit logs
        isLoading = false
    }
}
