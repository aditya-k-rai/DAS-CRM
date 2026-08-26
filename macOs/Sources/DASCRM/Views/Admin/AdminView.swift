"""
AdminView.swift — DAS CRM macOS
Tenant Admin Command Center with KPIs, Meetings, Workforce, Telemetry
Feature parity with Android AdminDashboardScreen.tsx
"""

import SwiftUI

struct AdminView: View {
    @State private var meetingFilter: MeetingFilter = .today
    @State private var selectedMeeting: ScheduledMeetingItem?
    @State private var showMeetingDetails = false

    let mockMeetings = [
        ScheduledMeetingItem(id: "mtg-1", leadId: "lead-1", leadName: "Rajesh Mehta", company: "TechCorp Solutions Ltd",
                            phone: "+91 98765 43210", email: "rajesh@techcorp.com", value: "₹5,20,000",
                            assignedAgent: "Rajesh Kumar", agentRole: "Sales Executive",
                            meetingPurpose: "Enterprise CRM Suite Demo & SLA Negotiation",
                            scheduledTimeStr: "Today, 02:30 PM", isToday: true, status: "CONFIRMED"),
        ScheduledMeetingItem(id: "mtg-2", leadId: "lead-2", leadName: "Priya Sharma", company: "LogiTech Freight Systems",
                            phone: "+91 98123 45678", email: "priya@logitech.com", value: "₹3,50,000",
                            assignedAgent: "Amit Patel", agentRole: "Sales Executive",
                            meetingPurpose: "WhatsApp Automation Bot Integration Review",
                            scheduledTimeStr: "Today, 04:45 PM", isToday: true, status: "SCHEDULED"),
        ScheduledMeetingItem(id: "mtg-3", leadId: "lead-3", leadName: "Sunita Kapoor", company: "Sunita Logistics Pvt Ltd",
                            phone: "+91 97222 33344", email: "sunita@sunitalogistics.com", value: "₹8,90,000",
                            assignedAgent: "Amit Shah", agentRole: "Team Leader",
                            meetingPurpose: "Executive Contract Signing & License Rollout",
                            scheduledTimeStr: "Today, 06:15 PM", isToday: true, status: "CONFIRMED"),
        ScheduledMeetingItem(id: "mtg-4", leadId: "lead-4", leadName: "Vikram Sethi", company: "Sethi Enterprises",
                            phone: "+91 98777 66655", email: "vikram@sethi.com", value: "₹4,20,000",
                            assignedAgent: "Neha Joshi", agentRole: "Team Leader",
                            meetingPurpose: "Cloud Telemetry License Proposal Walkthrough",
                            scheduledTimeStr: "Tomorrow, 11:00 AM", isToday: false, status: "SCHEDULED"),
        ScheduledMeetingItem(id: "mtg-5", leadId: "lead-5", leadName: "Rakesh Verma", company: "Verma Solutions",
                            phone: "+91 98111 22233", email: "rakesh@verma.com", value: "₹2,45,000",
                            assignedAgent: "Priya Sharma", agentRole: "Sales Executive",
                            meetingPurpose: "AI Lead Scoring Engine Pro Walkthrough",
                            scheduledTimeStr: "22 Aug 2026, 03:00 PM", isToday: false, status: "SCHEDULED"),
        ScheduledMeetingItem(id: "mtg-6", leadId: "lead-6", leadName: "Deepa Nair", company: "Nair Exports Ltd",
                            phone: "+91 99888 77766", email: "deepa@nair.com", value: "₹6,80,000",
                            assignedAgent: "Rajesh Kumar", agentRole: "Sales Executive",
                            meetingPurpose: "Multi-Tenant Migration & Security Compliance",
                            scheduledTimeStr: "23 Aug 2026, 05:30 PM", isToday: false, status: "SCHEDULED"),
    ]

    var filteredMeetings: [ScheduledMeetingItem] {
        mockMeetings.filter { meeting in
            switch meetingFilter {
            case .today:
                return meeting.isToday
            case .upcoming:
                return !meeting.isToday
            case .all:
                return true
            }
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // 📊 METRICS KPI GRID
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        MetricCard(icon: "💵", value: "$128,400", label: "Won Revenue",
                                 color: Color(red: 0.2, green: 0.83, blue: 0.60).opacity(0.3))
                        MetricCard(icon: "💰", value: "$412,000", label: "Active Pipeline",
                                 color: Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.3))
                        MetricCard(icon: "📊", value: "3,420", label: "Total Leads",
                                 color: Color(red: 0.21, green: 0.81, blue: 0.80).opacity(0.3))
                        MetricCard(icon: "📈", value: "14.2%", label: "Conversion Rate",
                                 color: Color(red: 0.98, green: 0.75, blue: 0.14).opacity(0.3))
                    }
                }

                // 📅 SCHEDULED MEETINGS
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("📅 Scheduled Meetings Today & Upcoming")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()

                        HStack(spacing: 6) {
                            ForEach(MeetingFilter.allCases, id: \.self) { filter in
                                Button(action: { meetingFilter = filter }) {
                                    Text(filter.rawValue)
                                        .font(.system(size: 9, weight: .bold))
                                        .foregroundColor(meetingFilter == filter ? .white : Color(red: 0.58, green: 0.64, blue: 0.68))
                                }
                                .buttonStyle(.plain)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(meetingFilter == filter ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.02, green: 0.06, blue: 0.12))
                                .border(meetingFilter == filter ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                                .cornerRadius(6)
                            }
                        }
                    }

                    // Meetings List
                    VStack(spacing: 8) {
                        ForEach(filteredMeetings) { meeting in
                            Button(action: {
                                selectedMeeting = meeting
                                showMeetingDetails = true
                            }) {
                                HStack(alignment: .top, spacing: 12) {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(meeting.leadName)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundColor(.white)
                                        Text(meeting.company)
                                            .font(.system(size: 10))
                                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                        Text(meeting.meetingPurpose)
                                            .font(.system(size: 9))
                                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                            .lineLimit(2)
                                    }
                                    Spacer()

                                    VStack(alignment: .trailing, spacing: 4) {
                                        Text(meeting.scheduledTimeStr)
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(Color(red: 0.38, green: 0.81, blue: 0.80))
                                        Text(meeting.assignedAgent)
                                            .font(.system(size: 9))
                                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                                        Text(meeting.status)
                                            .font(.system(size: 8, weight: .bold))
                                            .foregroundColor(meeting.status == "CONFIRMED" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.21, green: 0.81, blue: 0.80))
                                            .padding(.horizontal, 6)
                                            .padding(.vertical, 2)
                                            .background((meeting.status == "CONFIRMED" ? Color(red: 0.2, green: 0.83, blue: 0.60) : Color(red: 0.21, green: 0.81, blue: 0.80)).opacity(0.15))
                                            .cornerRadius(4)
                                    }
                                }
                                .padding(12)
                                .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                                .cornerRadius(10)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                // 👥 WORKFORCE & ATTENDANCE
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("👥 Workforce & Attendance Today")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        NavigationLink(destination: Text("Attendance View")) {
                            Text("View Attendance →")
                                .font(.system(size: 10))
                                .foregroundColor(Color(red: 0.21, green: 0.81, blue: 0.80))
                        }
                    }

                    HStack {
                        Text("19 / 24 Present")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                        Text("(79% Attendance)")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        Spacer()
                    }
                    .padding(12)
                    .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(10)
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                // ⚡ TODAY'S TELEMETRY
                VStack(alignment: .leading, spacing: 12) {
                    Text("⚡ Today's Telemetry")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)

                    HStack(spacing: 12) {
                        TelemetryCard(icon: "💵", value: "$18,450", label: "Sales Today")
                        TelemetryCard(icon: "📊", value: "142", label: "Leads Allocated")
                        TelemetryCard(icon: "📞", value: "384", label: "Calls Done")
                        TelemetryCard(icon: "💬", value: "820", label: "Msgs Sent")
                    }
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                // 🟢 MULTI-SOURCE INGESTION TELEMETRY
                VStack(alignment: .leading, spacing: 12) {
                    Text("🟢 Multi-Source Lead Ingestion Telemetry")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)

                    VStack(spacing: 8) {
                        ForEach([
                            ("🟢 Google Sheets Live Sync", "1,890 leads ingested", "Active 2-way sync"),
                            ("📥 CSV / Excel Uploads", "1,240 leads processed", "SheetJS engine"),
                            ("🌐 Meta Webhooks", "340 leads ingested", "Real-time events"),
                        ], id: \.0) { title, count, status in
                            HStack(spacing: 12) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(title)
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundColor(.white)
                                    Text(count)
                                        .font(.system(size: 9))
                                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                    Text(status)
                                        .font(.system(size: 9, weight: .bold))
                                        .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                                }
                                Spacer()
                            }
                            .padding(10)
                            .background(Color(red: 0.02, green: 0.06, blue: 0.12))
                            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                            .cornerRadius(10)
                        }
                    }
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(16)

                Spacer()
            }
            .padding(16)
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Admin")
        .sheet(isPresented: $showMeetingDetails) {
            if let meeting = selectedMeeting {
                MeetingDetailsSheet(meeting: meeting, isPresented: $showMeetingDetails)
            }
        }
    }
}

enum MeetingFilter: String, CaseIterable {
    case today = "TODAY"
    case upcoming = "UPCOMING"
    case all = "ALL"
}

struct ScheduledMeetingItem: Identifiable {
    let id: String
    let leadId: String
    let leadName: String
    let company: String
    let phone: String
    let email: String
    let value: String
    let assignedAgent: String
    let agentRole: String
    let meetingPurpose: String
    let scheduledTimeStr: String
    let isToday: Bool
    let status: String
}

struct MetricCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(icon)
                .font(.system(size: 16))
            Text(value)
                .font(.system(size: 16, weight: .black))
                .foregroundColor(.white)
            Text(label)
                .font(.system(size: 9))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                .lineLimit(2)
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: 100, alignment: .topLeading)
        .padding(10)
        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
        .border(color, width: 1)
        .cornerRadius(14)
    }
}

struct TelemetryCard: View {
    let icon: String
    let value: String
    let label: String

    var body: some View {
        VStack(alignment: .center, spacing: 4) {
            Text(icon)
                .font(.system(size: 12))
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
            Text(label)
                .font(.system(size: 8))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
        .padding(10)
        .background(Color(red: 0.02, green: 0.06, blue: 0.12))
        .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
        .cornerRadius(10)
    }
}

struct MeetingDetailsSheet: View {
    let meeting: ScheduledMeetingItem
    @Binding var isPresented: Bool

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Meeting Details Card
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📍 Meeting Details")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Purpose", value: meeting.meetingPurpose)
                        DetailRow(label: "Scheduled", value: meeting.scheduledTimeStr)
                        DetailRow(label: "Status", value: meeting.status)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Lead Information Card
                    VStack(alignment: .leading, spacing: 8) {
                        Text("👤 Lead Information")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Name", value: meeting.leadName)
                        DetailRow(label: "Company", value: meeting.company)
                        DetailRow(label: "Email", value: meeting.email)
                        DetailRow(label: "Phone", value: meeting.phone)
                        DetailRow(label: "Lead Value", value: meeting.value)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Assigned Agent Card
                    VStack(alignment: .leading, spacing: 8) {
                        Text("👨‍💼 Assigned Agent")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Agent", value: meeting.assignedAgent)
                        DetailRow(label: "Role", value: meeting.agentRole)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: {}) {
                            Text("📞 Call Lead")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.2, green: 0.83, blue: 0.60))
                                .cornerRadius(6)
                        }
                        Button(action: {}) {
                            Text("💬 WhatsApp")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.36, green: 0.83, blue: 0.40))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Meeting Details")
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
        AdminView()
    }
}
