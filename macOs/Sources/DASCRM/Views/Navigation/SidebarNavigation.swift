//
// SidebarNavigation.swift
// DASCRM macOS App Sidebar & Navigation Header Bar
// Native macOS Monterey - Tahoe translucent vibrancy & 120 FPS frame status indicator
// Full Feature Parity across Android & Web Modules
//

import SwiftUI

public struct SidebarNavigationView: View {
    @ObservedObject var appViewModel: AppViewModel
    @ObservedObject var displayEngine = DisplayLink120FPSEngine.shared
    @ObservedObject var syncEngine = SyncEngine.shared
    
    public init(appViewModel: AppViewModel) {
        self.appViewModel = appViewModel
    }
    
    public var body: some View {
        NavigationView {
            // MARK: - Native macOS Translucent Sidebar
            VStack(alignment: .leading, spacing: 0) {
                // Application Brand Banner
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(LinearGradient(colors: [.blue, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 38, height: 38)
                        
                        Image(systemName: "circle.grid.cross.fill")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(.white)
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("DAS CRM")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        
                        Text("macOS Pro Suite")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 20)
                
                Divider()
                    .padding(.horizontal, 16)
                    .padding(.bottom, 12)
                
                // Sidebar Menu Items
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 4) {
                        ForEach(NavigationTab.allCases) { tab in
                            SidebarButton(
                                title: tab.rawValue,
                                iconName: tab.iconName,
                                isSelected: appViewModel.activeNavigationTab == tab
                            ) {
                                withAnimation(.spring(response: 0.2, dampingFraction: 0.8)) {
                                    appViewModel.activeNavigationTab = tab
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                }
                
                Spacer()
                
                // Live 120 FPS & Sync Monitor Footer
                VStack(spacing: 8) {
                    Divider()
                        .padding(.horizontal, 12)
                    
                    HStack {
                        // 120 FPS Dynamic Pill
                        HStack(spacing: 6) {
                            Circle()
                                .fill(displayEngine.isProMotionActive ? Color.green : Color.orange)
                                .frame(width: 8, height: 8)
                            
                            Text(String(format: "%.0f FPS", displayEngine.currentFPS))
                                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                .foregroundColor(.primary)
                            
                            Text("120Hz ProMotion")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.secondary.opacity(0.12))
                        .cornerRadius(6)
                        
                        Spacer()
                        
                        // Network & Offline Sync Status Pill
                        HStack(spacing: 4) {
                            Image(systemName: syncEngine.isOnline ? "wifi" : "wifi.slash")
                                .font(.system(size: 11))
                                .foregroundColor(syncEngine.isOnline ? .blue : .red)
                            
                            Text(syncEngine.syncStatus.rawValue)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.bottom, 12)
                }
            }
            .frame(minWidth: 240, idealWidth: 260, maxWidth: 300)
            .background(VisualEffectView(material: .sidebar, blendingMode: .behindWindow))
            
            // MARK: - Detail View Router
            MainDetailRouterView(appViewModel: appViewModel)
        }
        .navigationTitle("")
        .toolbar {
            ToolbarItemGroup(placement: .principal) {
                HStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.secondary)
                    
                    TextField("Search leads, deals, SKUs, quotes across DAS CRM...", text: $appViewModel.searchKeyword)
                        .textFieldStyle(PlainTextFieldStyle())
                        .frame(width: 320)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(8)
            }
        }
    }
}

struct SidebarButton: View {
    let title: String
    let iconName: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: iconName)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(isSelected ? .white : .primary.opacity(0.8))
                    .frame(width: 20)
                
                Text(title)
                    .font(.system(size: 13, weight: isSelected ? .bold : .medium))
                    .foregroundColor(isSelected ? .white : .primary)
                
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(isSelected ? Color.accentColor : Color.clear)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// macOS Visual Effect Blur View for Monterey to Tahoe macOS UI Glassmorphism
struct VisualEffectView: NSViewRepresentable {
    var material: NSVisualEffectView.Material
    var blendingMode: NSVisualEffectView.BlendingMode

    func makeNSView(context: Context) -> NSVisualEffectView {
        let visualEffectView = NSVisualEffectView()
        visualEffectView.material = material
        visualEffectView.blendingMode = blendingMode
        visualEffectView.state = .active
        return visualEffectView
    }

    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}

struct MainDetailRouterView: View {
    @ObservedObject var appViewModel: AppViewModel
    
    var body: some View {
        Group {
            switch appViewModel.activeNavigationTab {
            case .dashboard:
                DashboardMainView()
            case .leads:
                LeadsMainView()
            case .deals:
                DealsPipelineView()
            case .contacts:
                ContactsDirectoryView()
            case .products:
                ProductsCatalogView()
            case .quotations:
                QuotationsView()
            case .reports:
                ReportsAnalyticsView()
            case .bulkIngestion:
                BulkIngestionView()
            case .adminControl:
                AdminControlView()
            case .tasks:
                TasksView()
            case .hr:
                HRAttendanceView()
            case .automations:
                AutomationsView()
            case .comms:
                CommsWhatsAppView()
            case .settings:
                AppSettingsView()
            }
        }
        .proMotionAnimation120()
    }
}
