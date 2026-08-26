"""
CommunicationsView.swift — DAS CRM macOS
WhatsApp Hub and Communication Management
Feature parity with Android CommunicationsScreen.tsx
"""

import SwiftUI

struct WhatsAppMessage: Identifiable {
    let id: String
    let contactName: String
    let contactPhone: String
    let message: String
    let timestamp: String
    let direction: String
    let status: String
}

struct EmailMessage: Identifiable {
    let id: String
    let sender: String
    let recipient: String
    let subject: String
    let body: String
    let timestamp: String
    let status: String
}

struct CallLog: Identifiable {
    let id: String
    let contactName: String
    let contactPhone: String
    let timestamp: String
    let duration: String
    let callType: String
    let notes: String
}

let fallbackWhatsAppMessages = [
    WhatsAppMessage(id: "w1", contactName: "Rajesh Kumar", contactPhone: "+91-98765-43210", message: "Hi, just checking on the proposal status", timestamp: "2026-08-26 10:15", direction: "INBOUND", status: "READ"),
    WhatsAppMessage(id: "w2", contactName: "Priya Sharma", contactPhone: "+91-98765-43211", message: "The integration is ready for testing", timestamp: "2026-08-26 09:45", direction: "OUTBOUND", status: "DELIVERED"),
    WhatsAppMessage(id: "w3", contactName: "Vikram Mehta", contactPhone: "+91-98765-43212", message: "Meeting scheduled for tomorrow at 2 PM", timestamp: "2026-08-26 14:20", direction: "INBOUND", status: "READ"),
    WhatsAppMessage(id: "w4", contactName: "Sunita Rao", contactPhone: "+91-98765-43213", message: "Please send the updated quotation", timestamp: "2026-08-26 11:30", direction: "OUTBOUND", status: "SENT"),
    WhatsAppMessage(id: "w5", contactName: "Amit Patel", contactPhone: "+91-98765-43214", message: "Demo went well! Client is interested", timestamp: "2026-08-26 16:00", direction: "INBOUND", status: "READ"),
]

let fallbackEmails = [
    EmailMessage(id: "e1", sender: "rajesh@company.com", recipient: "sales@dascrm.com", subject: "Project Kickoff", body: "Let's discuss the timeline for the new project", timestamp: "2026-08-26 08:30", status: "RECEIVED"),
    EmailMessage(id: "e2", sender: "sales@dascrm.com", recipient: "priya@company.com", subject: "Proposal Attached", body: "Please find the quotation attached", timestamp: "2026-08-26 10:00", status: "SENT"),
    EmailMessage(id: "e3", sender: "vikram@company.com", recipient: "sales@dascrm.com", subject: "Demo Feedback", body: "Great demo! A few questions about the pricing...", timestamp: "2026-08-26 12:15", status: "RECEIVED"),
    EmailMessage(id: "e4", sender: "sales@dascrm.com", recipient: "sunita@company.com", subject: "Follow-up", body: "Hi, wanted to check if you had any questions", timestamp: "2026-08-26 14:00", status: "SENT"),
    EmailMessage(id: "e5", sender: "amit@company.com", recipient: "sales@dascrm.com", subject: "Contract Review", body: "Can we discuss the contract terms?", timestamp: "2026-08-26 15:45", status: "RECEIVED"),
]

let fallbackCallLogs = [
    CallLog(id: "c1", contactName: "Rajesh Kumar", contactPhone: "+91-98765-43210", timestamp: "2026-08-26 09:30", duration: "12 min 45 sec", callType: "OUTBOUND", notes: "Discussed proposal timeline"),
    CallLog(id: "c2", contactName: "Priya Sharma", contactPhone: "+91-98765-43211", timestamp: "2026-08-26 11:00", duration: "8 min 20 sec", callType: "INBOUND", notes: "Client inquiry about pricing"),
    CallLog(id: "c3", contactName: "Vikram Mehta", contactPhone: "+91-98765-43212", timestamp: "2026-08-26 13:15", duration: "15 min 10 sec", callType: "OUTBOUND", notes: "Demo walkthrough"),
    CallLog(id: "c4", contactName: "Sunita Rao", contactPhone: "+91-98765-43213", timestamp: "2026-08-26 14:45", duration: "---", callType: "MISSED", notes: ""),
    CallLog(id: "c5", contactName: "Amit Patel", contactPhone: "+91-98765-43214", timestamp: "2026-08-26 16:30", duration: "22 min 5 sec", callType: "INBOUND", notes: "Feedback from demo"),
]

@MainActor
class CommunicationsViewModel: ObservableObject {
    @Published var whatsappMessages: [WhatsAppMessage] = fallbackWhatsAppMessages
    @Published var emails: [EmailMessage] = fallbackEmails
    @Published var callLogs: [CallLog] = fallbackCallLogs
    @Published var search: String = ""
    @Published var selectedTab: String = "WHATSAPP"
}

struct CommunicationsView: View {
    @StateObject private var viewModel = CommunicationsViewModel()
    @State private var selectedMessage: (type: String, data: Any)?
    @State private var showMessageDetails = false
    @State private var showSendMessage = false
    @State private var messageType = "whatsapp"

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("💬 Communications Hub")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by contact, subject...", text: $viewModel.search)
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
                    Button(action: { messageType = "whatsapp"; showSendMessage = true }) {
                        Text("📱 Send WhatsApp")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.15, green: 0.83, blue: 0.40))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Button(action: { messageType = "email"; showSendMessage = true }) {
                        Text("📧 Send Email")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.92, green: 0.27, blue: 0.21))
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
                ForEach(["WHATSAPP", "EMAIL", "CALLS"], id: \.self) { tab in
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
                if viewModel.selectedTab == "WHATSAPP" {
                    WhatsAppTabView(messages: viewModel.whatsappMessages) { msg in
                        selectedMessage = ("whatsapp", msg)
                        showMessageDetails = true
                    }
                } else if viewModel.selectedTab == "EMAIL" {
                    EmailTabView(emails: viewModel.emails) { email in
                        selectedMessage = ("email", email)
                        showMessageDetails = true
                    }
                } else {
                    CallLogsTabView(calls: viewModel.callLogs) { call in
                        selectedMessage = ("call", call)
                        showMessageDetails = true
                    }
                }
            }
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Communications")
        .sheet(isPresented: $showMessageDetails) {
            if let (type, data) = selectedMessage {
                if type == "whatsapp", let msg = data as? WhatsAppMessage {
                    MessageDetailsSheet(messageType: "whatsapp", data: msg, isPresented: $showMessageDetails)
                } else if type == "email", let email = data as? EmailMessage {
                    MessageDetailsSheet(messageType: "email", data: email, isPresented: $showMessageDetails)
                } else if type == "call", let call = data as? CallLog {
                    MessageDetailsSheet(messageType: "call", data: call, isPresented: $showMessageDetails)
                }
            }
        }
        .sheet(isPresented: $showSendMessage) {
            SendMessageSheet(messageType: messageType, isPresented: $showSendMessage)
        }
    }
}

struct WhatsAppTabView: View {
    let messages: [WhatsAppMessage]
    let onMessageTapped: (WhatsAppMessage) -> Void

    var body: some View {
        Table(messages) {
            TableColumn("Contact", value: \.contactName)
            TableColumn("Message") { msg in
                Text(msg.message.count > 40 ? String(msg.message.prefix(40)) + "..." : msg.message)
            }
            TableColumn("Timestamp", value: \.timestamp)
            TableColumn("Direction") { msg in
                Text(msg.direction)
                    .foregroundColor(msg.direction == "INBOUND" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.38, green: 0.65, blue: 0.98))
            }
            TableColumn("Status") { msg in
                Text(msg.status)
                    .foregroundColor(msg.status == "READ" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.75, blue: 0.14))
            }
            TableColumn("Action") { msg in
                Button(action: { onMessageTapped(msg) }) {
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

struct EmailTabView: View {
    let emails: [EmailMessage]
    let onEmailTapped: (EmailMessage) -> Void

    var body: some View {
        Table(emails) {
            TableColumn("From", value: \.sender)
            TableColumn("Subject", value: \.subject)
            TableColumn("Timestamp", value: \.timestamp)
            TableColumn("Status") { email in
                Text(email.status)
                    .foregroundColor(email.status == "SENT" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.38, green: 0.65, blue: 0.98))
            }
            TableColumn("Action") { email in
                Button(action: { onEmailTapped(email) }) {
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

struct CallLogsTabView: View {
    let calls: [CallLog]
    let onCallTapped: (CallLog) -> Void

    var body: some View {
        Table(calls) {
            TableColumn("Contact", value: \.contactName)
            TableColumn("Phone", value: \.contactPhone)
            TableColumn("Timestamp", value: \.timestamp)
            TableColumn("Type") { call in
                Text(call.callType)
                    .foregroundColor(call.callType == "INBOUND" ? Color(red: 0.2, green: 0.83, blue: 0.60) : call.callType == "OUTBOUND" ? Color(red: 0.38, green: 0.65, blue: 0.98) : Color(red: 0.98, green: 0.30, blue: 0.40))
            }
            TableColumn("Duration", value: \.duration)
            TableColumn("Action") { call in
                Button(action: { onCallTapped(call) }) {
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

struct MessageDetailsSheet: View {
    let messageType: String
    let data: Any
    @Binding var isPresented: Bool
    @State private var showReplyAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    if messageType == "whatsapp", let msg = data as? WhatsAppMessage {
                        // Header
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("💬 \(msg.contactName)")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            Spacer()

                            Text(msg.status)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(msg.status == "READ" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.75, blue: 0.14))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background((msg.status == "READ" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.98, green: 0.75, blue: 0.14)).opacity(0.15))
                                .cornerRadius(4)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                        // Message Info
                        VStack(alignment: .leading, spacing: 8) {
                            Text("📱 Message Details")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)

                            DetailRow(label: "Contact", value: msg.contactName)
                            DetailRow(label: "Phone", value: msg.contactPhone)
                            DetailRow(label: "Direction", value: msg.direction)
                            DetailRow(label: "Timestamp", value: msg.timestamp)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                        // Message Content
                        VStack(alignment: .leading, spacing: 8) {
                            Text("💬 Content")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)

                            Text(msg.message)
                                .font(.system(size: 10))
                                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                                .lineLimit(nil)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                    } else if messageType == "email", let email = data as? EmailMessage {
                        // Email Header
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("📧 \(email.subject)")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            Spacer()

                            Text(email.status)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(email.status == "SENT" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.38, green: 0.65, blue: 0.98))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background((email.status == "SENT" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.38, green: 0.65, blue: 0.98)).opacity(0.15))
                                .cornerRadius(4)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                        // Email Info
                        VStack(alignment: .leading, spacing: 8) {
                            Text("📧 Email Details")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)

                            DetailRow(label: "From", value: email.sender)
                            DetailRow(label: "To", value: email.recipient)
                            DetailRow(label: "Subject", value: email.subject)
                            DetailRow(label: "Timestamp", value: email.timestamp)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                        // Email Body
                        VStack(alignment: .leading, spacing: 8) {
                            Text("📋 Body")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)

                            Text(email.body)
                                .font(.system(size: 10))
                                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                                .lineLimit(nil)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                    } else if messageType == "call", let call = data as? CallLog {
                        // Call Header
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("☎️ \(call.contactName)")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            Spacer()

                            Text(call.callType)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(call.callType == "INBOUND" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.38, green: 0.65, blue: 0.98))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background((call.callType == "INBOUND" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.38, green: 0.65, blue: 0.98)).opacity(0.15))
                                .cornerRadius(4)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                        // Call Info
                        VStack(alignment: .leading, spacing: 8) {
                            Text("☎️ Call Details")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)

                            DetailRow(label: "Contact", value: call.contactName)
                            DetailRow(label: "Phone", value: call.contactPhone)
                            DetailRow(label: "Type", value: call.callType)
                            DetailRow(label: "Duration", value: call.duration)
                            DetailRow(label: "Timestamp", value: call.timestamp)
                        }
                        .padding(12)
                        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(12)

                        if !call.notes.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("📝 Notes")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(.white)

                                Text(call.notes)
                                    .font(.system(size: 10))
                                    .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                                    .lineLimit(nil)
                            }
                            .padding(12)
                            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                            .cornerRadius(12)
                        }
                    }

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: { showReplyAlert = true }) {
                            Text("↩️ Reply")
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
            .navigationTitle("Message Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("↩️ Reply", isPresented: $showReplyAlert) {
                Button("OK") { }
            } message: {
                Text("Reply interface opening...")
            }
        }
    }
}

struct SendMessageSheet: View {
    let messageType: String
    @Binding var isPresented: Bool

    @State private var recipient = ""
    @State private var subject = ""
    @State private var message = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("📱 Send \(messageType.uppercased())")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text(messageType == "whatsapp" ? "Send a WhatsApp message" : "Send an email message")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text(messageType == "whatsapp" ? "Recipient Phone *" : "Recipient Email *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField(messageType == "whatsapp" ? "+91-98765-43210" : "contact@company.com", text: $recipient)
                            .textFieldStyle(.roundedBorder)

                        if messageType == "email" {
                            Text("Subject *")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                            TextField("Email subject", text: $subject)
                                .textFieldStyle(.roundedBorder)
                        }

                        Text("Message *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextEditor(text: $message)
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
                            Text("Send ✓")
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(messageType == "whatsapp" ? Color(red: 0.15, green: 0.83, blue: 0.40) : Color(red: 0.92, green: 0.27, blue: 0.21))
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Send Message")
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
        CommunicationsView()
    }
}
