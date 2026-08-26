//
// main.swift
// DAS CRM iOS Application
// Entry point for native iOS app with 120Hz ProMotion pacing and feature parity
//

import SwiftUI

@main
struct DASCRMApp: App {
    @StateObject private var appViewModel = AppViewModel()
    @StateObject private var displayLinkEngine = DisplayLink120FPSEngine()
    
    var body: some Scene {
        WindowGroup {
            if appViewModel.isAuthenticated {
                AppTabView()
                    .environmentObject(appViewModel)
                    .environmentObject(displayLinkEngine)
            } else {
                LoginView()
                    .environmentObject(appViewModel)
            }
        }
    }
}

// Placeholder views for compilation
struct LoginView: View {
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            Text("DAS CRM Login")
                .font(.title)
            
            TextField("Email", text: .constant(""))
                .textFieldStyle(.roundedBorder)
                .padding()
            
            SecureField("Password", text: .constant(""))
                .textFieldStyle(.roundedBorder)
                .padding()
            
            Button("Sign In") {
                viewModel.isAuthenticated = true
            }
            .buttonStyle(.borderedProminent)
            
            Spacer()
        }
        .padding()
    }
}

struct AppTabView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @Environment(\.horizontalSizeClass) var sizeClass
    
    var body: some View {
        if sizeClass == .regular {
            // iPad: NavigationSplitView
            NavigationSplitView {
                SidebarView()
                    .environmentObject(viewModel)
            } content: {
                ContentView()
                    .environmentObject(viewModel)
            } detail: {
                DetailView()
                    .environmentObject(viewModel)
            }
        } else {
            // iPhone: TabView
            TabView(selection: $viewModel.activeNavigationTab) {
                DashboardView()
                    .environmentObject(viewModel)
                    .tag(NavigationTab.dashboard)
                    .tabItem {
                        Label("Dashboard", systemImage: "square.grid.2x2.fill")
                    }
                
                LeadsView()
                    .environmentObject(viewModel)
                    .tag(NavigationTab.leads)
                    .tabItem {
                        Label("Leads", systemImage: "person.crop.circle.badge.plus")
                    }
                
                DealsView()
                    .environmentObject(viewModel)
                    .tag(NavigationTab.deals)
                    .tabItem {
                        Label("Deals", systemImage: "chart.bar.doc.horizontal.fill")
                    }
                
                ContactsView()
                    .environmentObject(viewModel)
                    .tag(NavigationTab.contacts)
                    .tabItem {
                        Label("Contacts", systemImage: "person.2.fill")
                    }
                
                MoreView()
                    .environmentObject(viewModel)
                    .tag(NavigationTab.settings)
                    .tabItem {
                        Label("More", systemImage: "ellipsis")
                    }
            }
        }
    }
}

struct SidebarView: View {
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {
        List(NavigationTab.allCases, id: \.self) { tab in
            NavigationLink(destination: ContentForTab(tab: tab).environmentObject(viewModel)) {
                Label(tab.rawValue, systemImage: tab.iconName)
            }
        }
        .navigationTitle("DAS CRM")
    }
}

struct ContentView: View {
    var body: some View {
        Text("Select a menu item")
    }
}

struct DetailView: View {
    var body: some View {
        Text("Details will appear here")
    }
}

struct ContentForTab: View {
    let tab: NavigationTab
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {
        Group {
            switch tab {
            case .dashboard:
                DashboardView()
            case .leads:
                LeadsView()
            case .deals:
                DealsView()
            case .contacts:
                ContactsView()
            case .products:
                ProductsView()
            case .quotations:
                QuotationsView()
            case .reports:
                ReportsView()
            case .bulkIngestion:
                BulkIngestionView()
            case .adminControl:
                AdminView()
            case .tasks:
                TasksView()
            case .hr:
                HRView()
            case .automations:
                AutomationsView()
            case .comms:
                CommsView()
            case .settings:
                SettingsView()
            }
        }
        .environmentObject(viewModel)
    }
}

struct MoreView: View {
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Products", destination: ProductsView())
                NavigationLink("Quotations", destination: QuotationsView())
                NavigationLink("Reports", destination: ReportsView())
                NavigationLink("Bulk Import", destination: BulkIngestionView())
                NavigationLink("Admin", destination: AdminView())
                NavigationLink("Tasks", destination: TasksView())
                NavigationLink("HR & Attendance", destination: HRView())
                NavigationLink("Automations", destination: AutomationsView())
                NavigationLink("Communications", destination: CommsView())
                NavigationLink("Settings", destination: SettingsView())
            }
            .navigationTitle("More Options")
        }
    }
}

// Placeholder views
struct DashboardView: View {
    var body: some View { Text("Dashboard") }
}

struct LeadsView: View {
    var body: some View { Text("Leads") }
}

struct DealsView: View {
    var body: some View { Text("Deals") }
}

struct ContactsView: View {
    var body: some View { Text("Contacts") }
}

struct ProductsView: View {
    var body: some View { Text("Products") }
}

struct QuotationsView: View {
    var body: some View { Text("Quotations") }
}

struct ReportsView: View {
    var body: some View { Text("Reports") }
}

struct BulkIngestionView: View {
    var body: some View { Text("Bulk Ingestion") }
}

struct AdminView: View {
    var body: some View { Text("Admin") }
}

struct TasksView: View {
    var body: some View { Text("Tasks") }
}

struct HRView: View {
    var body: some View { Text("HR & Attendance") }
}

struct AutomationsView: View {
    var body: some View { Text("Automations") }
}

struct CommsView: View {
    var body: some View { Text("Communications") }
}

struct SettingsView: View {
    var body: some View { Text("Settings") }
}
