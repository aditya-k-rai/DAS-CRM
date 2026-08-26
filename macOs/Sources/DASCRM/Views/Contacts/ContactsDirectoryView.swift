//
// ContactsDirectoryView.swift
// DASCRM macOS App Contacts Directory View
// High speed search, tags & detail cards
//

import SwiftUI

public struct ContactsDirectoryView: View {
    @State private var contacts: [Contact] = [
        Contact(name: "Sarah Jenkins", email: "sarah@apextech.io", phone: "+1 415 555 0192", company: "Apex Technologies", designation: "VP of IT & Cloud", tags: ["Decision Maker", "VIP", "Tech"]),
        Contact(name: "Michael Chang", email: "mchang@nexuslab.com", phone: "+1 212 555 0148", company: "Nexus Labs", designation: "Head of AI Research", tags: ["Lead", "AI", "Enterprise"]),
        Contact(name: "Elena Rostova", email: "elena@globalinc.org", phone: "+44 20 7946 0912", company: "Global Inc", designation: "Chief Operating Officer", tags: ["Global", "C-Level"]),
        Contact(name: "David Miller", email: "dmiller@quantumbio.com", phone: "+1 650 555 0177", company: "Quantum Bio", designation: "Director of Software", tags: ["SaaS", "Partner"])
    ]
    @State private var searchText = ""
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Contacts Directory")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                    Text("Centralized client directory with organization roles & tags")
                        .font(.system(size: 13))
                        .foregroundColor(.secondary)
                }
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 24)
            
            ScrollView(.vertical, showsIndicators: true) {
                LazyVStack(spacing: 12) {
                    ForEach(contacts) { contact in
                        HStack(spacing: 16) {
                            ZStack {
                                Circle()
                                    .fill(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                                    .frame(width: 44, height: 44)
                                Text(String(contact.name.prefix(1)))
                                    .font(.system(size: 18, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(contact.name)
                                    .font(.system(size: 14, weight: .bold))
                                Text("\(contact.designation) at \(contact.company)")
                                    .font(.system(size: 12))
                                    .foregroundColor(.secondary)
                                Text("\(contact.email) • \(contact.phone)")
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            HStack(spacing: 6) {
                                ForEach(contact.tags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.system(size: 10, weight: .semibold))
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.blue.opacity(0.1))
                                        .foregroundColor(.blue)
                                        .cornerRadius(6)
                                }
                            }
                        }
                        .padding(14)
                        .background(Color(NSColor.windowBackgroundColor))
                        .cornerRadius(12)
                    }
                }
                .padding(.horizontal, 24)
            }
        }
    }
}
