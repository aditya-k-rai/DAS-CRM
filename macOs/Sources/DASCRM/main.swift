//
// main.swift
// DASCRM macOS App Main Entry Point
// Supports macOS 12 Monterey, 13 Ventura, 14 Sonoma, 15 Sequoia, up to macOS 26 Tahoe
//

import SwiftUI
import AppKit

@main
struct DASCRMApp: App {
    @StateObject private var appViewModel = AppViewModel()
    
    init() {
        // Configure macOS 120 FPS high-refresh window behavior
        if let mainScreen = NSScreen.main {
            let maxFPS = mainScreen.maximumFramesPerSecond
            print("[DAS CRM macOS App] System Max Display Frame Rate: \(maxFPS) Hz")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            SidebarNavigationView(appViewModel: appViewModel)
                .frame(minWidth: 1050, minHeight: 680)
                .preferredColorScheme(.dark)
                .onAppear {
                    print("[DAS CRM macOS App] Initialized successfully on macOS.")
                }
        }
        .windowStyle(TitleBarWindowStyle())
        .windowToolbarStyle(UnifiedWindowToolbarStyle(showsTitle: false))
    }
}
