"""
HelpView.swift — DAS CRM macOS
Help Center and Support Resources
Feature parity with Android HelpScreen.tsx
"""

import SwiftUI

struct HelpArticle: Identifiable {
    let id: String
    let title: String
    let category: String
    let content: String
    let views: Int
    let helpful: Int
    let rating: Double
}

struct SupportTicket: Identifiable {
    let id: String
    let subject: String
    let category: String
    let status: String
    let priority: String
    let createdAt: String
    let updatedAt: String
}

let fallbackHelpArticles = [
    HelpArticle(id: "h1", title: "Getting Started with DAS CRM", category: "GETTING_STARTED",
               content: "Learn how to set up your DAS CRM account and complete initial configuration.", views: 1240, helpful: 1100, rating: 4.8),
    HelpArticle(id: "h2", title: "Managing Your Sales Pipeline", category: "FEATURES",
               content: "Understand how to use the Kanban board to track deals through stages.", views: 980, helpful: 850, rating: 4.7),
    HelpArticle(id: "h3", title: "Creating and Managing Quotations", category: "FEATURES",
               content: "Step-by-step guide to creating professional quotations and tracking their status.", views: 760, helpful: 650, rating: 4.6),
    HelpArticle(id: "h4", title: "Troubleshooting Sync Issues", category: "TROUBLESHOOTING",
               content: "Common sync problems and how to resolve them quickly.", views: 420, helpful: 380, rating: 4.5),
    HelpArticle(id: "h5", title: "API Integration Guide", category: "FEATURES",
               content: "Connect external services and automate workflows with DAS CRM API.", views: 310, helpful: 270, rating: 4.9),
]

let fallbackSupportTickets = [
    SupportTicket(id: "s1", subject: "Dashboard charts not loading", category: "BUG", status: "OPEN", priority: "HIGH", createdAt: "2026-08-24 10:30", updatedAt: "2026-08-26 09:15"),
    SupportTicket(id: "s2", subject: "Request: Mobile app for iOS", category: "FEATURE_REQUEST", status: "IN_PROGRESS", priority: "MEDIUM", createdAt: "2026-08-22 14:20", updatedAt: "2026-08-26 08:00"),
    SupportTicket(id: "s3", subject: "Can't export quotations to PDF", category: "BUG", status: "RESOLVED", priority: "MEDIUM", createdAt: "2026-08-20 16:45", updatedAt: "2026-08-25 11:30"),
    SupportTicket(id: "s4", subject: "Billing cycle question", category: "BILLING", status: "CLOSED", priority: "LOW", createdAt: "2026-08-18 09:10", updatedAt: "2026-08-21 13:45"),
    SupportTicket(id: "s5", subject: "Two-factor authentication setup", category: "ACCOUNT", status: "IN_PROGRESS", priority: "MEDIUM", createdAt: "2026-08-26 07:00", updatedAt: "2026-08-26 09:30"),
]

@MainActor
class HelpViewModel: ObservableObject {
    @Published var helpArticles: [HelpArticle] = fallbackHelpArticles
    @Published var supportTickets: [SupportTicket] = fallbackSupportTickets
    @Published var search: String = ""
    @Published var selectedTab: String = "ARTICLES"
}

struct HelpView: View {
    @StateObject private var viewModel = HelpViewModel()
    @State private var selectedArticle: HelpArticle?
    @State private var showArticleDetails = false
    @State private var showCreateTicket = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("❓ Help & Support")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search articles, tickets...", text: $viewModel.search)
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
                    Button(action: { showCreateTicket = true }) {
                        Text("🎫 New Ticket")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Button(action: { /* Contact us */ }) {
                        Text("📧 Contact Us")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.24, green: 0.51, blue: 0.96))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Tab Selection
            HStack(spacing: 8) {
                ForEach(["ARTICLES", "SUPPORT TICKETS"], id: \.self) { tab in
                    Button(action: { viewModel.selectedTab = tab }) {
                        Text(tab)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(viewModel.selectedTab == tab ? .white : Color(red: 0.58, green: 0.64, blue: 0.68))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(viewModel.selectedTab == tab ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.02, green: 0.06, blue: 0.12))
                    .border(viewModel.selectedTab == tab ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(6)
                }
                Spacer()
            }
            .padding(12)
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))

            // Content
            Group {
                if viewModel.selectedTab == "ARTICLES" {
                    ArticlesTabView(articles: viewModel.helpArticles) { article in
                        selectedArticle = article
                        showArticleDetails = true
                    }
                } else {
                    TicketsTabView(tickets: viewModel.supportTickets)
                }
            }
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Help")
        .sheet(isPresented: $showArticleDetails) {
            if let article = selectedArticle {
                ArticleDetailsSheet(article: article, isPresented: $showArticleDetails)
            }
        }
        .sheet(isPresented: $showCreateTicket) {
            CreateTicketSheet(isPresented: $showCreateTicket)
        }
    }
}

struct ArticlesTabView: View {
    let articles: [HelpArticle]
    let onArticleTapped: (HelpArticle) -> Void

    var body: some View {
        Table(articles) {
            TableColumn("Title", value: \.title)
            TableColumn("Category", value: \.category)
            TableColumn("Views") { article in
                Text(String(article.views))
            }
            TableColumn("Rating") { article in
                Text("\(String(format: "%.1f", article.rating)) ⭐")
                    .foregroundColor(Color(red: 0.98, green: 0.75, blue: 0.14))
            }
            TableColumn("Action") { article in
                Button(action: { onArticleTapped(article) }) {
                    Text("👁️ Read")
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
}

struct TicketsTabView: View {
    let tickets: [SupportTicket]

    var body: some View {
        Table(tickets) {
            TableColumn("Subject", value: \.subject)
            TableColumn("Category", value: \.category)
            TableColumn("Status") { ticket in
                Text(ticket.status)
                    .foregroundColor(
                        ticket.status == "RESOLVED" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                        ticket.status == "IN_PROGRESS" ? Color(red: 0.38, green: 0.65, blue: 0.98) :
                        Color(red: 0.98, green: 0.75, blue: 0.14)
                    )
            }
            TableColumn("Priority") { ticket in
                Text(ticket.priority)
                    .foregroundColor(
                        ticket.priority == "URGENT" ? Color(red: 0.98, green: 0.30, blue: 0.40) :
                        ticket.priority == "HIGH" ? Color(red: 0.98, green: 0.58, blue: 0.09) :
                        Color(red: 0.98, green: 0.75, blue: 0.14)
                    )
            }
            TableColumn("Created", value: \.createdAt)
            TableColumn("Action") { ticket in
                Button(action: { /* View ticket */ }) {
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
}

struct ArticleDetailsSheet: View {
    let article: HelpArticle
    @Binding var isPresented: Bool
    @State private var showFeedback = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("📖 \(article.title)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Spacer()

                        Text(article.category.replacingOccurrences(of: "_", with: " "))
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 0.49, green: 0.40, blue: 0.94).opacity(0.15))
                            .border(Color(red: 0.49, green: 0.40, blue: 0.94), width: 1)
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Statistics
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📊 Article Statistics")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Views", value: String(article.views))
                        DetailRow(label: "Helpful Votes", value: String(article.helpful))
                        DetailRow(label: "Rating", value: "\(String(format: "%.1f", article.rating)) ⭐")
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Content
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📝 Article Content")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        Text(article.content)
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                            .lineLimit(nil)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Feedback Buttons
                    HStack(spacing: 8) {
                        Button(action: { showFeedback = true }) {
                            Text("👍 Helpful")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .cornerRadius(6)
                        }
                        Button(action: { showFeedback = true }) {
                            Text("👎 Not Helpful")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.98, green: 0.30, blue: 0.40))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Help Article")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("Thank You", isPresented: $showFeedback) {
                Button("OK") { }
            } message: {
                Text("Thanks for your feedback!")
            }
        }
    }
}

struct CreateTicketSheet: View {
    @Binding var isPresented: Bool

    @State private var subject = ""
    @State private var category = "Bug Report"
    @State private var priority = "Medium"
    @State private var description = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("🎫 Create Support Ticket")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text("We're here to help! Submit your issue and our team will respond soon.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Subject *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("Brief description of your issue", text: $subject)
                            .textFieldStyle(.roundedBorder)

                        Text("Category *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Category", selection: $category) {
                            Text("Bug Report").tag("Bug Report")
                            Text("Feature Request").tag("Feature Request")
                            Text("Account Issue").tag("Account Issue")
                            Text("Billing").tag("Billing")
                            Text("Other").tag("Other")
                        }
                        .pickerStyle(.menu)

                        Text("Priority *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Priority", selection: $priority) {
                            Text("Low").tag("Low")
                            Text("Medium").tag("Medium")
                            Text("High").tag("High")
                            Text("Urgent").tag("Urgent")
                        }
                        .pickerStyle(.menu)

                        Text("Description *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextEditor(text: $description)
                            .foregroundColor(.white)
                            .frame(minHeight: 100)
                            .padding(8)
                            .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                            .cornerRadius(6)
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
                        Button(action: { isPresented = false }) {
                            Text("Create Ticket ✓")
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
            .navigationTitle("New Ticket")
            .navigationBarTitleDisplayMode(.inline)
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
        HelpView()
    }
}
