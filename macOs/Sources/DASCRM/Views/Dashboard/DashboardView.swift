"""
DashboardView.swift — DAS CRM macOS
Executive Dashboard with KPIs, Upcoming Leads, Recent 5 Leads Preview
Feature parity with Android DashboardScreen.tsx
"""

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var stats: [StatCard] = [
        StatCard(icon: "📊", value: "1,420", label: "Total Ingested Leads", color: Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.3)),
        StatCard(icon: "💰", value: "₹148,500", label: "Pipeline Value", color: Color(red: 0.2, green: 0.83, blue: 0.60).opacity(0.3)),
        StatCard(icon: "⚡", value: "42", label: "Fresh Unassigned", color: Color(red: 0.98, green: 0.75, blue: 0.14).opacity(0.3)),
        StatCard(icon: "🎯", value: "28.5%", label: "Conversion Target", color: Color(red: 0.79, green: 0.33, blue: 0.97).opacity(0.3)),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // 👑 Top Executive Banner
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("👑 TENANT ADMIN")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(Color(red: 0.65, green: 0.68, blue: 0.99))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 1)
                            .background(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.15))
                            .border(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.3), width: 1)
                            .cornerRadius(6)
                    }

                    Text("DAS CRM Enterprise")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)

                    HStack {
                        Text("🟢 Pro Plan")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(Color(red: 0.2, green: 0.83, blue: 0.60).opacity(0.15))
                            .border(Color(red: 0.2, green: 0.83, blue: 0.60).opacity(0.3), width: 1)
                            .cornerRadius(8)
                        Spacer()
                    }
                }
                .padding(12)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.3), width: 1)
                .cornerRadius(18)

                // 📊 Executive Performance Summary Cards
                VStack(alignment: .leading, spacing: 8) {
                    Text("Executive Performance Overview")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    // Grid of 4 stat cards
                    VStack(spacing: 10) {
                        HStack(spacing: 10) {
                            StatCardView(stat: stats[0])
                            StatCardView(stat: stats[1])
                        }
                        HStack(spacing: 10) {
                            StatCardView(stat: stats[2])
                            StatCardView(stat: stats[3])
                        }
                    }
                }

                // 📅 UPCOMING LEADS & FOLLOW-UPS
                VStack(alignment: .leading, spacing: 8) {
                    Text("Upcoming Lead Follow-ups")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    VStack(spacing: 0) {
                        ForEach([
                            ("Call Rajesh Kumar — Quote Discussion", "Today 2:00 PM", "HIGH"),
                            ("Demo Presentation for TechCorp", "Today 4:30 PM", "HIGH"),
                            ("Follow-up with Sunita Real Estate", "Tomorrow 11:00 AM", "MEDIUM"),
                        ], id: \.0) { title, time, priority in
                            VStack(spacing: 0) {
                                HStack(alignment: .top, spacing: 12) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(title)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(.white)
                                        Text("📅 \(time)")
                                            .font(.system(size: 10))
                                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                    }
                                    Spacer()

                                    Text(priority)
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundColor(Color(red: 0.98, green: 0.75, blue: 0.14))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color(red: 0.98, green: 0.75, blue: 0.14).opacity(0.15))
                                        .border(Color(red: 0.98, green: 0.75, blue: 0.14).opacity(0.3), width: 1)
                                        .cornerRadius(6)
                                }
                                .padding(.vertical, 8)

                                if title != "Follow-up with Sunita Real Estate" {
                                    Divider()
                                        .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                }
                            }
                        }
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(16)
                }

                // 📋 RECENT 5 LEADS PREVIEW WIDGET
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Recent 5 Ingested Leads")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        NavigationLink(destination: LeadsView()) {
                            Text("View More Leads →")
                                .font(.system(size: 11, weight: .heavy))
                                .foregroundColor(Color(red: 0.62, green: 0.65, blue: 0.98))
                        }
                    }

                    VStack(spacing: 0) {
                        ForEach([
                            ("Rajesh Kumar", "TechCorp Ltd", "Proposal", "₹5,20,000", 91),
                            ("Priya Sharma", "LogiTech Solutions", "Won", "₹3,50,000", 98),
                            ("Vikram Mehta", "Acme Sales Solutions", "Qualified", "₹1,42,000", 85),
                            ("Sunita Rao", "Real Estate Group", "Negotiation", "₹8,50,000", 77),
                            ("Amit Patel", "Global Freight Ltd", "New Lead", "₹90,000", 63),
                        ], id: \.0) { name, company, status, value, score in
                            VStack(spacing: 0) {
                                HStack(alignment: .top, spacing: 12) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(name)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(.white)
                                        Text("\(company) • \(status)")
                                            .font(.system(size: 10))
                                            .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                    }
                                    Spacer()

                                    VStack(alignment: .trailing, spacing: 2) {
                                        Text(value)
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                                        Text("🔥 Score \(score)")
                                            .font(.system(size: 9, weight: .bold))
                                            .foregroundColor(Color(red: 0.2, green: 0.83, blue: 0.60))
                                    }
                                }
                                .padding(.vertical, 8)

                                if name != "Amit Patel" {
                                    Divider()
                                        .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                }
                            }
                        }

                        // View More Button
                        VStack {
                            NavigationLink(destination: LeadsView()) {
                                Text("View All Leads & Distribution Controls →")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundColor(Color(red: 0.65, green: 0.68, blue: 0.99))
                                    .frame(maxWidth: .infinity)
                                    .padding(10)
                                    .background(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.15))
                                    .border(Color(red: 0.38, green: 0.4, blue: 0.62).opacity(0.3), width: 1)
                                    .cornerRadius(10)
                            }
                        }
                        .padding(.top, 8)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(16)
                }

                Spacer()
            }
            .padding(16)
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Dashboard")
    }
}

struct StatCard: Identifiable {
    let id = UUID()
    let icon: String
    let value: String
    let label: String
    let color: Color
}

struct StatCardView: View {
    let stat: StatCard

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(stat.icon)
                .font(.system(size: 15))
                .padding(.bottom, 4)

            Text(stat.value)
                .font(.system(size: 18, weight: .black))
                .foregroundColor(.white)

            Text(stat.label)
                .font(.system(size: 9))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                .lineLimit(2)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: 130, alignment: .topLeading)
        .padding(10)
        .background(Color(red: 0.06, green: 0.09, blue: 0.16))
        .border(stat.color, width: 1)
        .cornerRadius(14)
    }
}

#Preview {
    NavigationView {
        DashboardView()
            .environmentObject(AuthViewModel())
    }
}
