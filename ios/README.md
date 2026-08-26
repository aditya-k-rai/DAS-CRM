# DAS CRM - iOS Native Application

Native iOS application built with Swift and SwiftUI, featuring 120Hz ProMotion display pacing, NestJS backend integration, offline synchronization, and complete feature parity with Android, Web, macOS, and Windows applications.

## System Requirements

- **iOS**: 15.0 or later
- **iPadOS**: 15.0 or later (universal app with adaptive layouts)
- **Xcode**: 15.0+ (for development and building)
- **Swift**: 5.9+
- **iPhone Models**: iPhone 12 or later (recommended iPhone Pro 13+ for 120Hz ProMotion)
- **iPad Models**: iPad Pro (2nd gen) or later

## Installation

### Development Setup

1. **Navigate to the iOS directory**:
   ```bash
   cd "C:\Users\Mighty\Downloads\DAS CRM\ios"
   ```

2. **Build with Swift Package Manager**:
   ```bash
   swift build -c release
   ```

3. **Verify compilation** (zero errors expected):
   ```bash
   swift build
   ```

### Running on Simulator

**From Xcode** (recommended for development):
```bash
xed .
```
Then click the Run button or press `Cmd+R`.

**From command line**:
```bash
swift run DASCRM
```

### Running on Device

1. Open `Package.swift` in Xcode
2. Select your physical iPhone/iPad as the build target
3. Press `Cmd+R` to build and run
4. Approve app installation on your device

## Architecture

### Directory Structure

```
ios/
├── Package.swift                    # Swift Package Manager manifest
├── README.md                        # This file
├── Sources/DASCRM/
│   ├── main.swift                  # @main App entry point
│   ├── Core/
│   │   ├── Engine/
│   │   │   └── DisplayLink120FPS.swift    # CADisplayLink 120Hz pacing
│   │   ├── Network/
│   │   │   └── APIClient.swift           # Swift actor REST client
│   │   └── Sync/
│   │       └── SyncEngine.swift          # NWPathMonitor + offline queue
│   ├── Models/
│   │   ├── CRMModels.swift               # Core Codable DTOs
│   │   └── ExtendedCRMModels.swift       # Additional entity models
│   ├── ViewModels/
│   │   └── CRMViewModels.swift           # @MainActor state managers
│   └── Views/
│       ├── Navigation/
│       │   └── AppTabView.swift          # Bottom TabView + SplitView
│       ├── Dashboard/
│       │   └── DashboardView.swift       # KPI metrics & summaries
│       ├── Leads/
│       │   └── LeadsView.swift           # Lead management
│       ├── Deals/
│       │   └── DealsView.swift           # Kanban pipeline
│       ├── Contacts/
│       │   └── ContactsView.swift        # Contact directory
│       ├── Products/
│       │   └── ProductsView.swift        # Product catalog
│       ├── Quotations/
│       │   └── QuotationsView.swift      # Invoice builder
│       ├── Reports/
│       │   └── ReportsView.swift         # Analytics dashboard
│       ├── BulkIngestion/
│       │   └── BulkIngestionView.swift   # CSV importer
│       ├── Admin/
│       │   └── AdminView.swift           # RBAC & audit logs
│       └── Components/
│           └── AdditionalViews.swift     # Tasks, HR, Automations, Comms
└── Tests/DASCRMTests/
    └── DASCRMTests.swift           # XCTest suite
```

### Core Modules

#### `Core/Engine/DisplayLink120FPS.swift` - 120Hz ProMotion Display Engine
- **CADisplayLink integration**: Drives 120Hz frame pacing on iPhone Pro models
- **Frame delta calculation**: Precise millisecond-level frame timing
- **SwiftUI modifier**: `proMotionAnimation120()` for smooth animations
- **ObservableObject**: Publishes `@Published` FPS and frame delta for reactive UI

#### `Core/Network/APIClient.swift` - REST API Actor
- **Swift actor model**: Thread-safe networking without manual locks
- **URLSession wrapper**: Handles HTTP requests, responses, error codes
- **Token management**: Persists auth tokens to app documents directory
- **Codable support**: Automatic JSON encoding/decoding
- **Endpoints**: Supports all backend routes (authentication, CRUD operations, reports, admin)

#### `Core/Sync/SyncEngine.swift` - Offline-First Architecture
- **NWPathMonitor**: Real-time network connectivity tracking
- **SQLite persistence**: Local data cache at `Documents/.dascrm/offline.db`
- **JSON queue**: Pending actions serialized to `Documents/.dascrm/pending_actions.json`
- **Auto-sync**: Automatically syncs pending mutations when device comes online
- **Conflict resolution**: Server state takes precedence on mismatch

### Backend Connectivity

**Default API Base URL**: `http://localhost:4000/api`

Configurable via app settings. Supports NestJS backend with the following endpoints:
- `/auth/login` — User authentication
- `/auth/profile` — Current user profile
- `/leads` — Lead CRUD operations
- `/deals` — Deal pipeline management
- `/contacts` — Contact directory
- `/products` — Product catalog
- `/quotations` — Quotation & invoice builder
- `/reports/analytics` — Metrics aggregation
- `/bulk-import/upload` — CSV file ingestion
- `/admin/audit-logs` — Security audit trail
- `/admin/roles` — RBAC governance

### Adaptive UI Layout

**iPhone**:
- Bottom `TabView` with 5 primary tabs (Dashboard, Leads, Deals, Contacts, More)
- More tab shows secondary features (Products, Quotations, Reports, Bulk Import, Admin, Tasks, HR, Automations, Comms, Settings)
- Full-screen views with native iOS navigation

**iPad**:
- 3-column `NavigationSplitView` with sidebar navigation
- Split view allows simultaneous viewing of list and detail
- Responsive grid layouts for data tables and catalogs

## Features

✅ **Dashboard**: Executive KPI metrics (Revenue, Growth, Active Deals, Conversion Rate)
✅ **Leads Engine**: Lead lifecycle management with status filtering and search
✅ **Deals & Pipeline**: Multi-stage Kanban pipeline with drag-and-drop (iOS 16+)
✅ **Contacts Directory**: Client management with tags and quick contact actions
✅ **Products Catalog**: SKU management, stock tracking, unit pricing, categories
✅ **Quotations & Invoices**: Proposal builder with status progression and totals
✅ **Reports & Analytics**: MRR, Sales Velocity, CAC, quarterly sales targets
✅ **Bulk CSV Import**: DocumentPickerViewController integration for file selection
✅ **Admin & RBAC**: Role-based access control matrix and audit log viewer
✅ **Tasks & Follow-ups**: Task tracking with priority and due date management
✅ **HR & Attendance**: Employee records and daily attendance logs
✅ **Automations**: Workflow automation trigger and action configuration
✅ **WhatsApp & Comms**: Communication history and message composing hub
✅ **App Settings**: User preferences, theme selection (dark/light), backend URL config

## Performance

### 120Hz ProMotion Support
- Automatic detection on iPhone 13 Pro and later
- Falls back to 60Hz on non-Pro models
- Smooth scrolling and animations throughout the app

### Offline-First Architecture
- Works completely offline with automatic sync on reconnection
- Local SQLite cache for instant data retrieval
- Optimistic UI updates with conflict resolution

### Memory Optimization
- Lazy loading of views and data
- Efficient image caching
- Minimal background task overhead

## Development

### Creating a New Feature View

1. Create a new file in `Views/` (e.g., `MyFeatureView.swift`)
2. Declare struct conforming to `View`
3. Use `@EnvironmentObject` for shared state
4. Connect to `APIClient` for backend calls

### Example View Implementation

```swift
struct MyFeatureView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @StateObject private var featureVM = MyFeatureViewModel()
    
    var body: some View {
        NavigationStack {
            List(featureVM.items, id: \.id) { item in
                ItemRow(item: item)
            }
            .navigationTitle("My Feature")
        }
    }
}
```

### Connecting to Backend

```swift
// Fetch data from API
let leads = try await apiClient.getLeads(skip: 0, limit: 50)

// Create new entity
let newLead = Lead(title: "New Lead", ...)
let created = try await apiClient.createLead(newLead)

// Queue offline action
SyncEngine.shared.enqueueSyncAction(
    type: "CREATE_LEAD",
    payload: ["title": "New Lead", "value": 5000]
)
```

### Running Tests

```bash
swift test
```

## Build & Distribution

### Building for Release

```bash
swift build -c release
```

### Creating App Bundle (via Xcode)

1. Open `Package.swift` in Xcode
2. Select Product → Archive
3. Validate and upload to App Store Connect

### TestFlight Distribution

1. Archive the app in Xcode
2. Upload to App Store Connect
3. Add testers and distribute via TestFlight

## Troubleshooting

### Application Crashes at Launch
- Check Swift compiler errors: `swift build`
- Verify all model types conform to `Codable`
- Check iOS deployment target: must be 15.0 or later

### Backend Connection Fails
- Verify backend is running: `curl http://localhost:4000/api/auth/profile`
- Check network configuration (WiFi/cellular)
- Verify API base URL in app settings

### Offline Queue Not Syncing
- Confirm device has internet connectivity
- Restart the application
- Check pending actions file: `~/.dascrm/pending_actions.json`

### 120Hz ProMotion Not Working
- Requires iPhone 13 Pro or later
- Verify device supports ProMotion displays
- Check iOS version is 15.0 or later

### Memory Warnings
- Reduce number of items loaded in lists (implement pagination)
- Optimize image sizes
- Clear image cache periodically

## iOS Version Support

| iOS Version | Support | Notes |
|---|---|---|
| iOS 15.0 - 15.9 | ✅ Full | Base deployment target |
| iOS 16.0 - 16.9 | ✅ Full | Enhanced drag-and-drop |
| iOS 17.0 - 17.9 | ✅ Full | Performance improvements |
| iOS 18.0+ | ✅ Full | Latest features supported |

## iPad Optimization

- Split view for simultaneous list/detail viewing
- Larger touch targets and spacing
- Landscape orientation support
- Multitasking (Split View, Slide Over, Picture in Picture)

## Accessibility

- VoiceOver support throughout the app
- Dynamic type for text scaling
- High contrast mode support
- Keyboard navigation for all interactive elements

## License

Proprietary - DAS CRM Platform

## Support

For issues or feature requests, contact the development team.
