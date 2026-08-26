"""
ContactsView.swift — DAS CRM macOS
Client Directory with Tags, Search, and Contact Actions
Feature parity with Android ContactsScreen.tsx
"""

import SwiftUI

struct ContactItem: Identifiable {
    let id: String
    let name: String
    let email: String
    let phone: String
    let company: String
    let industry: String
    let tags: [String]
    let location: String
    let status: String
    let lastContact: String
    let value: String
}

let fallbackContacts = [
    ContactItem(id: "c1", name: "Rajesh Kumar", email: "rajesh@techcorp.com", phone: "+91 98765 43210",
               company: "TechCorp Ltd", industry: "Technology", tags: ["VIP", "Hot Lead"],
               location: "Mumbai", status: "ACTIVE", lastContact: "Today 2:30 PM", value: "₹5,20,000"),
    ContactItem(id: "c2", name: "Priya Sharma", email: "priya@logitech.com", phone: "+91 98123 45678",
               company: "LogiTech Solutions", industry: "Logistics", tags: ["Enterprise"],
               location: "Bangalore", status: "ACTIVE", lastContact: "Yesterday 11:00 AM", value: "₹3,50,000"),
    ContactItem(id: "c3", name: "Vikram Mehta", email: "vikram@acme.com", phone: "+91 99876 54321",
               company: "Acme Sales Solutions", industry: "Sales", tags: ["Follow-up"],
               location: "Delhi", status: "PROSPECT", lastContact: "3 days ago", value: "₹1,42,000"),
    ContactItem(id: "c4", name: "Sunita Rao", email: "sunita@realestate.com", phone: "+91 97222 11111",
               company: "Real Estate Group", industry: "Real Estate", tags: ["VIP", "Strategic"],
               location: "Pune", status: "ACTIVE", lastContact: "2 days ago", value: "₹8,50,000"),
    ContactItem(id: "c5", name: "Amit Patel", email: "amit@globalfreight.com", phone: "+91 96333 22222",
               company: "Global Freight Ltd", industry: "Logistics", tags: ["Prospect"],
               location: "Chennai", status: "PROSPECT", lastContact: "1 week ago", value: "₹90,000"),
]

@MainActor
class ContactsViewModel: ObservableObject {
    @Published var contacts: [ContactItem] = fallbackContacts
    @Published var search: String = ""
    @Published var selectedTag: String = "ALL"

    var filteredContacts: [ContactItem] {
        contacts.filter { contact in
            let passesTagFilter = selectedTag == "ALL" || contact.tags.contains(selectedTag)
            let passesSearch: Bool
            if search.isEmpty {
                passesSearch = true
            } else {
                let q = search.lowercased()
                passesSearch = contact.name.lowercased().contains(q) ||
                              contact.company.lowercased().contains(q) ||
                              contact.email.lowercased().contains(q) ||
                              contact.phone.lowercased().contains(q) ||
                              contact.location.lowercased().contains(q) ||
                              contact.industry.lowercased().contains(q)
            }
            return passesTagFilter && passesSearch
        }
    }
}

struct ContactsView: View {
    @StateObject private var viewModel = ContactsViewModel()
    @State private var selectedContact: ContactItem?
    @State private var showContactDetails = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("👥 Contacts Directory")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by name, company, email, phone...", text: $viewModel.search)
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

                // Tag filter chips
                HStack(spacing: 6) {
                    ForEach(["ALL", "VIP", "Hot Lead", "Enterprise", "Strategic", "Prospect"], id: \.self) { tag in
                        Button(action: { viewModel.selectedTag = tag }) {
                            Text(tag)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(viewModel.selectedTag == tag ? .white : Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(viewModel.selectedTag == tag ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.02, green: 0.06, blue: 0.12))
                        .border(viewModel.selectedTag == tag ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(6)
                    }
                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Contacts List
            List {
                ForEach(viewModel.filteredContacts) { contact in
                    Button(action: {
                        selectedContact = contact
                        showContactDetails = true
                    }) {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(contact.name)
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.white)
                                    Text(contact.company)
                                        .font(.system(size: 10))
                                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                }
                                Spacer()

                                VStack(alignment: .trailing, spacing: 4) {
                                    Text(contact.value)
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                                    Text(contact.status)
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundColor(contact.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.75, blue: 0.14))
                                }
                            }

                            HStack(spacing: 4) {
                                Text(contact.email)
                                    .font(.system(size: 9))
                                    .foregroundColor(Color(red: 0.21, green: 0.81, blue: 0.80))
                                Text("•")
                                    .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                Text(contact.phone)
                                    .font(.system(size: 9))
                                    .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                            }

                            HStack(spacing: 4) {
                                ForEach(contact.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundColor(Color(red: 0.65, green: 0.68, blue: 0.99))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.15))
                                        .border(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.3), width: 1)
                                        .cornerRadius(4)
                                }
                                Spacer()
                            }
                        }
                        .padding(12)
                        .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                        .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    .listRowInsets(EdgeInsets())
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
                }
            }
            .listStyle(.plain)
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Contacts")
        .sheet(isPresented: $showContactDetails) {
            if let contact = selectedContact {
                ContactDetailsSheet(contact: contact, isPresented: $showContactDetails)
            }
        }
    }
}

struct ContactDetailsSheet: View {
    let contact: ContactItem
    @Binding var isPresented: Bool
    @State private var showCallAlert = false
    @State private var showWhatsAppAlert = false
    @State private var showEmailAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(contact.name)
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            Text(contact.company)
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        Spacer()

                        Text(contact.status)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(contact.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.75, blue: 0.14))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background((contact.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.75, blue: 0.14)).opacity(0.15))
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Contact Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📞 Contact Information")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Email", value: contact.email)
                        DetailRow(label: "Phone", value: contact.phone)
                        DetailRow(label: "Company", value: contact.company)
                        DetailRow(label: "Industry", value: contact.industry)
                        DetailRow(label: "Location", value: contact.location)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Relationship Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📊 Relationship")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Value", value: contact.value)
                        DetailRow(label: "Last Contact", value: contact.lastContact)

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Tags:")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                            HStack(spacing: 4) {
                                ForEach(contact.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundColor(Color(red: 0.65, green: 0.68, blue: 0.99))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.15))
                                        .cornerRadius(4)
                                }
                            }
                        }
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: { showCallAlert = true }) {
                            Text("📞 Call")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.2, green: 0.83, blue: 0.60))
                                .cornerRadius(6)
                        }
                        Button(action: { showWhatsAppAlert = true }) {
                            Text("💬 WhatsApp")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.36, green: 0.83, blue: 0.40))
                                .cornerRadius(6)
                        }
                        Button(action: { showEmailAlert = true }) {
                            Text("📧 Email")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.00, green: 0.50, blue: 0.78))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Contact Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("📞 Call", isPresented: $showCallAlert) {
                Button("OK") { }
            } message: {
                Text("Calling \(contact.name)...")
            }
            .alert("💬 WhatsApp", isPresented: $showWhatsAppAlert) {
                Button("OK") { }
            } message: {
                Text("Opening WhatsApp for \(contact.name)...")
            }
            .alert("📧 Email", isPresented: $showEmailAlert) {
                Button("OK") { }
            } message: {
                Text("Composing email to \(contact.email)...")
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
                .frame(width: 80, alignment: .leading)
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
        ContactsView()
    }
}
