# DAS CRM - High Performance Native macOS Application
## Support: macOS 12.0 Monterey to macOS 26.0 Tahoe | 120 FPS ProMotion Paced Engine

### Overview
This directory contains the complete native **macOS Desktop Application** for **DAS CRM**. Designed specifically for Apple Silicon and Intel Macs with hardware-accelerated **120 FPS ProMotion** smoothness, translucent glassmorphism sidebar (macOS Monterey to Tahoe design language), real-time background sync engine (`NWPathMonitor`), and full feature parity with the DAS CRM NestJS backend.

---

### Key Technical Features

1. **120 FPS ProMotion Engine (`DisplayLink120FPSEngine.swift`)**
   - Direct `CVDisplayLink` integration dynamically bound to the primary display's high-refresh rate.
   - Interpolating spring animation modifiers tuned for zero-lag UI transitions at 8.33ms per frame budget.

2. **OS Compatibility Matrix (macOS 12 Monterey - macOS 26 Tahoe)**
   - Swift 5.9 Package Manifest targeting `.macOS(.v12)`.
   - Backward & forward compatible APIs for AppKit, SwiftUI, and QuartzCore.

3. **Backend & Real-Time Sync Engine (`SyncEngine.swift` & `APIClient.swift`)**
   - High-throughput concurrency pool (`Swift async/await` & `Actor` isolation).
   - Instant optimistic updates with background queue processing when network connectivity changes.

4. **100% Feature Parity Modules**
   - **Executive Dashboard**: KPI Cards, revenue charts, recent lead stream, and deal pipeline snapshot.
   - **Leads Engine**: Multi-status filter tabs (New, Contacted, Qualified, Proposal, Won, Lost), search, and lead creation sheet.
   - **Deals & Kanban Pipeline**: Stage columns (Lead, Contact Made, Demo Scheduled, Negotiation, Contract Sent, Closed Won).
   - **Contacts Directory**: Executive roles, tags, search, and organization management.
   - **Tasks & Follow-ups**: Priority badges, categories, and completion tracking.
   - **HR & Attendance**: Check-in status, working hours tracking.
   - **Automations**: Custom trigger/action cards.
   - **WhatsApp & Comms**: Active conversation stream.

---

### Project Architecture & Folder Structure

```
macOs/
├── Package.swift                     # Swift Package Manager configuration (macOS 12 to 26)
├── README.md                         # Documentation
├── Sources/
│   └── DASCRM/
│       ├── main.swift                 # Main App Entry Point & Window Setup
│       ├── Core/
│       │   ├── Engine/
│       │   │   └── DisplayLink120FPS.swift  # 120 FPS ProMotion Display Pacing Engine
│       │   ├── Network/
│       │   │   └── APIClient.swift          # High-performance Async Actor API Client
│       │   └── Sync/
│       │       └── SyncEngine.swift         # NWPathMonitor & Offline Queue Sync
│       ├── Models/
│       │   └── CRMModels.swift              # DTOs & Domain Models (Lead, Deal, Contact, Task, etc.)
│       ├── ViewModels/
│       │   └── CRMViewModels.swift          # MainActor ViewModels with seed & backend bindings
│       └── Views/
│           ├── Navigation/
│           │   └── SidebarNavigation.swift  # Translucent Sidebar & 120 FPS Status Bar
│           ├── Dashboard/
│           │   └── DashboardMainView.swift  # Executive Dashboard & KPI Cards
│           ├── Leads/
│           │   └── LeadsMainView.swift      # Leads Management Engine & Add Lead Modal
│           ├── Deals/
│           │   └── DealsPipelineView.swift  # Kanban Pipeline Stage Board
│           ├── Contacts/
│           │   └── ContactsDirectoryView.swift # Directory Search & Client Profiles
│           └── Components/
│               └── AdditionalModulesViews.swift # Tasks, HR, Automations, Comms & Settings
└── Tests/
    └── DASCRMTests/
        └── DASCRMTests.swift         # Unit & Pacing Tests
```

---

### Building & Running on macOS

Open Terminal on macOS or open in Xcode:

```bash
# Navigate to the macOs directory
cd "macOs"

# Build using Swift Package Manager
swift build

# Run the native application
swift run DASCRM
```

Alternatively, open `Package.swift` in **Xcode** and press `Cmd + R` to run with full Xcode debugging, Instruments profiling, and ProMotion high-refresh simulation!
