//
// CRMViewModels.swift
// DASCRM macOS App ViewModels with Async Backend Integration & Mock Seed Data
// Optimized for 120 FPS Swift Concurrency & MainActor state dispatch
//

import SwiftUI
import Combine

@MainActor
public final class AppViewModel: ObservableObject {
    @Published public var currentUser: User?
    @Published public var isAuthenticated: Bool = true
    @Published public var activeNavigationTab: NavigationTab = .dashboard
    @Published public var searchKeyword: String = ""
    @Published public var globalNotificationMessage: String?
    
    public init() {
        // Default seed session for rapid desktop loading & testing
        self.currentUser = User(
            id: "user-101",
            name: "Aditya (macOS Administrator)",
            email: "aditya@dascrm.com",
            role: .orgAdmin,
            avatarUrl: nil,
            organizationId: "org-das-01"
        )
    }
}

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

// MARK: - Dashboard ViewModel
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
    
    public init() {
        loadDashboardData()
    }
    
    public func loadDashboardData() {
        self.isLoading = true
        
        // Populate realistic CRM Seed Data for instantaneous 120 FPS rendering
        self.recentLeads = [
            Lead(title: "Enterprise Cloud Migration", contactName: "Sarah Jenkins", email: "sarah@apextech.io", phone: "+1 415 555 0192", companyName: "Apex Technologies", value: 45000.0, status: .proposal, source: "Website Direct"),
            Lead(title: "Custom AI Workspace Setup", contactName: "Michael Chang", email: "mchang@nexuslab.com", phone: "+1 212 555 0148", companyName: "Nexus Labs", value: 28500.0, status: .qualified, source: "LinkedIn Outreach"),
            Lead(title: "Multi-seat DAS CRM Deployment", contactName: "Elena Rostova", email: "elena@globalinc.org", phone: "+44 20 7946 0912", companyName: "Global Inc", value: 120000.0, status: .new, source: "Partner Referral"),
            Lead(title: "SaaS Infrastructure Audit", contactName: "David Miller", email: "dmiller@quantumbio.com", phone: "+1 650 555 0177", companyName: "Quantum Bio", value: 15000.0, status: .contacted, source: "Google Search")
        ]
        
        self.topDeals = [
            Deal(title: "Apex Tech Cloud License", companyName: "Apex Tech", amount: 45000, stage: .negotiation, probability: 80, expectedCloseDate: Date().addingTimeInterval(86400 * 7), ownerName: "Aditya"),
            Deal(title: "Nexus AI Platform Retainer", companyName: "Nexus Labs", amount: 28500, stage: .demoScheduled, probability: 60, expectedCloseDate: Date().addingTimeInterval(86400 * 14), ownerName: "Aditya"),
            Deal(title: "Global Inc Enterprise Contract", companyName: "Global Inc", amount: 120000, stage: .contractSent, probability: 90, expectedCloseDate: Date().addingTimeInterval(86400 * 3), ownerName: "Aditya")
        ]
        
        self.isLoading = false
    }
}

// MARK: - Leads ViewModel
@MainActor
public final class LeadsViewModel: ObservableObject {
    @Published public var leads: [Lead] = []
    @Published public var selectedFilter: LeadStatus? = nil
    @Published public var searchText: String = ""
    @Published public var isShowingAddLeadModal: Bool = false
    
    public init() {
        fetchLeads()
    }
    
    public func fetchLeads() {
        self.leads = [
            Lead(title: "Enterprise Cloud Migration", contactName: "Sarah Jenkins", email: "sarah@apextech.io", phone: "+1 415 555 0192", companyName: "Apex Technologies", value: 45000.0, status: .proposal, source: "Website Direct"),
            Lead(title: "Custom AI Workspace Setup", contactName: "Michael Chang", email: "mchang@nexuslab.com", phone: "+1 212 555 0148", companyName: "Nexus Labs", value: 28500.0, status: .qualified, source: "LinkedIn Outreach"),
            Lead(title: "Multi-seat DAS CRM Deployment", contactName: "Elena Rostova", email: "elena@globalinc.org", phone: "+44 20 7946 0912", companyName: "Global Inc", value: 120000.0, status: .won, source: "Partner Referral"),
            Lead(title: "SaaS Infrastructure Audit", contactName: "David Miller", email: "dmiller@quantumbio.com", phone: "+1 650 555 0177", companyName: "Quantum Bio", value: 15000.0, status: .contacted, source: "Google Search"),
            Lead(title: "Fintech Mobile App Integration", contactName: "Alex Rivera", email: "arivera@paypulse.net", phone: "+1 305 555 0134", companyName: "PayPulse", value: 38000.0, status: .new, source: "Inbound Email")
        ]
    }
    
    public func addLead(_ lead: Lead) {
        withAnimation(.spring(response: 0.25, dampingFraction: 0.8)) {
            leads.insert(lead, at: 0)
        }
        SyncEngine.shared.enqueueSyncAction(type: "CREATE_LEAD", payload: ["title": lead.title, "value": lead.value])
    }
    
    public func updateLeadStatus(id: String, newStatus: LeadStatus) {
        if let idx = leads.firstIndex(where: { $0.id == id }) {
            withAnimation(.spring(response: 0.2, dampingFraction: 0.75)) {
                leads[idx].status = newStatus
            }
            SyncEngine.shared.enqueueSyncAction(type: "UPDATE_LEAD_STATUS", payload: ["id": id, "status": newStatus.rawValue])
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
