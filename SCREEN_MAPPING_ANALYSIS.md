# DAS CRM — Screen-by-Screen Implementation Mapping
**Goal:** Exact replica of Android screens in Windows (PyQt6) and macOS (SwiftUI)

**Status:** Analysis Complete | Implementation Priority Order Identified

---

## 📊 Screen Inventory Summary

### Android Screens (30 total)
| # | Screen Name | Key Features | Priority | Complexity |
|---|---|---|---|---|
| 1 | **DashboardScreen** | Executive KPIs (4 stat cards), upcoming leads, recent 5 leads preview | 1 (CRITICAL) | Medium |
| 2 | **LeadsScreen** | Excel spreadsheet grid (11 columns), column reordering/resizing, funnel/collections tabs, multi-format import (CSV/Google Sheets/JSON) | 1 (CRITICAL) | **Very High** |
| 3 | **DealsPipelineScreen** | Kanban board with 5 stages, revenue goals, target progress bar, create deal modal | 2 | High |
| 4 | **ContactsScreen** | Client directory with tags/search, contact actions (call/WhatsApp) | 2 | Medium |
| 5 | **ProductsCatalogScreen** | SKU catalog, stock, pricing, category filters | 2 | Medium |
| 6 | **QuotationsInvoicesScreen** | Quote builder, status tracker (Draft/Sent/Approved), PDF generation | 3 | Medium |
| 7 | **ReportsAnalyticsScreen** | Charts (MRR, Sales Velocity, CAC), quarterly targets, performance metrics | 3 | High |
| 8 | **BulkIngestionScreen** | Drag-drop CSV/file import, import history, success/failure logs | 3 | Medium |
| 9 | **AdminDashboardScreen** | Won revenue, active pipeline, workforce attendance, telemetry, meeting audit | 2 | High |
| 10 | **TasksScreen** | Task tracking, priority levels, due dates, status (Pending/Overdue) | 3 | Low |
| 11 | **HRDashboardScreen** | Employee records, attendance logs, leaves, salary info | 3 | Medium |
| 12 | **EmployeeDashboardScreen** | Personal dashboard (attendance, tasks, payslip) | 3 | Low |
| 13 | **ManagerDashboardScreen** | Team KPIs, rep performance, allocation, quotas | 2 | High |
| 14 | **TeamLeaderDashboardScreen** | TL-specific metrics, team insights, rep scoring | 2 | High |
| 15 | **EmployeesScreen** | Staff directory with roles, contact info, status | 3 | Low |
| 16 | **HrControlScreen** | HR admin (leave approvals, salary, policies) | 3 | Medium |
| 17 | **ManagerControlScreen** | Manager admin (team assignment, quota setup, performance review) | 2 | Medium |
| 18 | **TeamLeaderControlScreen** | TL admin (rep assignment, territory management) | 2 | Medium |
| 19 | **SalesExecControlScreen** | Sales rep dashboard (personal performance, assigned leads) | 3 | Low |
| 20 | **AttendanceScreen** | Daily attendance check-in, punch in/out, logs | 3 | Low |
| 21 | **WorkflowAutomationsScreen** | Workflow builder, trigger/action config, automation rules | 4 | **Very High** |
| 22 | **CommunicationScreen** | Message hub, WhatsApp/SMS/Email templates, history | 4 | Medium |
| 23 | **EmailMarketingScreen** | Email campaigns, templates, delivery tracking | 4 | Medium |
| 24 | **WhatsAppTemplatesScreen** | WhatsApp message templates, media upload, broadcast | 4 | Medium |
| 25 | **AiCustomizationScreen** | AI model config, prompt tuning, LLM selection | 4 | High |
| 26 | **PdfCatalogueScreen** | Product PDF generation, download, sharing | 4 | Low |
| 27 | **ProfileScreen** | User profile, account settings, preferences | 1 | Low |
| 28 | **MoreControlsScreen** | Settings hub, modules access, feature toggles | 1 | Low |
| 29 | **NotificationsScreen** | Notification center, alert history, preferences | 2 | Low |
| 30 | **LoginScreen** | Auth, multi-tenant login, password reset | 1 | Medium |

### Web Frontend Screens (38+ total)
| # | Screen Name | Role(s) | Key Features | Notes |
|---|---|---|---|---|
| 1 | **/dashboard** | All Roles | Executive summary, KPIs, charts | Role-specific variants |
| 2 | **/dashboard/sales** | Sales Exec | Personal performance, assigned leads | Web-only enhanced |
| 3 | **/dashboard/manager** | Manager | Team performance, rep metrics | Web-only enhanced |
| 4 | **/dashboard/team-leader** | Team Leader | Territory insights, benchmarking | Web-only enhanced |
| 5 | **/dashboard/hr** | HR Admin | Workforce telemetry, payroll | Web-only enhanced |
| 6 | **/leads** | Sales/Admin | Lead management, search, filters | Web has advanced filters |
| 7 | **/leads/[id]** | All | Lead detail, contact history, notes | Deep lead profile |
| 8 | **/deals** | Sales/Manager | Deal pipeline, Kanban, revenue goals | Web has stage automation |
| 9 | **/contacts** | All | Contact directory, company tags | Web has CRM linking |
| 10 | **/products** | Sales/Admin | Product catalog, pricing, stock | Web has variant management |
| 11 | **/quotes** | Sales/Admin | Quotation builder, templates, PDF | Web has advanced templates |
| 12 | **/reports** | Manager/Admin | Analytics dashboard, exports | Web has scheduled reports |
| 13 | **/imports** | Admin | Bulk import, file upload, history | Web has data validation UI |
| 14 | **/tasks** | All | Task management, reminders | Web has calendar view |
| 15 | **/hr** | HR/Admin | HR dashboard, employees, attendance | Web has advanced reports |
| 16 | **/hr/employees** | HR/Admin | Staff directory, roles | Web has bulk upload |
| 17 | **/hr/attendance** | HR/Admin | Attendance logs, check-in/out | Web has biometric integration |
| 18 | **/hr/leaves** | HR/Admin | Leave requests, approvals | Web has policy management |
| 19 | **/hr/salary** | HR/Admin | Payroll, salary slips | Web has tax calculations |
| 20 | **/admin/audit-logs** | Admin | Audit trail, user actions, changes | Web has advanced filtering |
| 21 | **/admin/custom-fields** | Admin | Custom field builder | Web-only advanced feature |
| 22 | **/admin/workflow** | Admin | Workflow automation builder | Web-only advanced feature |
| 23 | **/admin/team-leaders** | Admin | TL management, permissions | Web has bulk actions |
| 24 | **/admin/super** | Super Admin | Multi-tenant admin, app config | Web has advanced settings |
| 25 | **/automations** | Admin | Workflow automation hub | Web has templates |
| 26 | **/comms** | All | Communication hub, templates | Web has CRM integration |
| 27 | **/emails** | Marketing | Email campaigns, templates | Web has design builder |
| 28 | **/goals** | Manager/Admin | Revenue goals, targets, tracking | Web has forecasting |
| 29 | **/help** | All | Help/Support center | Web-only documentation |
| 30 | **/downloads** | All | Download center, reports, exports | Web-only feature |
| 31 | **/companies** | Sales/Admin | Company directory, relationships | Web-specific feature |
| 32 | **/profile** | All | User profile, preferences | Web has SSO setup |
| 33 | **/settings** | All | App settings, integrations | Web has more options |
| 34 | **/settings/profile** | All | Profile edit, password, 2FA | Web has API keys |
| 35 | **/settings/team** | Admin | Team member management | Web has role editor |
| 36 | **/settings/billing** | Admin | Billing, subscription, invoices | Web-only feature |
| 37 | **/auth/login** | Public | Login, signup, password reset | Web has social auth |
| 38 | **/onboarding** | New User | Tenant setup, workspace config | Web-only onboarding |

---

## 🔄 Implementation Strategy

### Phase 1: **Core Screens (Highest Priority)**
**Order of Implementation:** Dashboard → Leads → AdminDashboard → ProfileScreen

#### 1.1 **DashboardScreen** → Windows `dashboard_view.py` / macOS `DashboardView.swift`
```
CURRENT STATE (Generic):
- 4 stat cards with hardcoded values
- Recent 5 leads preview
- KPI summary

MUST BECOME (Android-exact):
✓ Executive Performance Overview (4 stat cards with real data)
✓ Upcoming Lead Follow-ups (3-item list with priority tags)
✓ Recent 5 Ingested Leads (name, company, status, score, value)
✓ View More Leads button → navigate to Leads tab
✓ Role-aware header banner (Tenant Admin, Manager, Team Leader, Sales Exec)
✓ Exactly match dark theme colors (#090d16, #0f172a, #34d399, etc.)
✓ SafeAreaInsets padding (Android safe area equivalent)
```

**Windows Implementation Requirements:**
- PyQt6 `QScrollArea` with dark stylesheet
- 4 `QLabel` cards in grid layout
- `QTableWidget` for recent leads (readonly)
- Role detection from `apiClient.currentUser.role`
- Colors from `styles.qss` dark palette

**macOS Implementation Requirements:**
- SwiftUI `ScrollView` with `.dark` color scheme
- `HStack` grid of 4 cards using `@State var stats: [StatCard]`
- `List` for recent leads, tap → navigate to LeadsView
- Dynamic role banner using `@EnvironmentObject var authVM: AuthViewModel`

---

#### 1.2 **LeadsScreen** → Windows `leads_view.py` / macOS `LeadsView.swift`
**This is the most complex screen. Must replicate exactly:**

```
ANDROID FEATURES (ALL CRITICAL):
✓ Segmented Slider: FUNNEL vs COLLECTIONS (toggle between two sections)

FUNNEL SECTION:
  ✓ Lead Distribution Strategy Engine (3 chips: BATCH_QUOTA, VANISH_POOL, MANUAL)
  ✓ Google Sheets Live Sync card (status + "Connect Sheet" button)
  ✓ CSV/Excel Spreadsheet Uploads card (status + "Import File" button)

COLLECTIONS SECTION:
  ✓ Multi-field search bar (covers 11 fields)
  ✓ Search results counter + clear button
  ✓ Action row (+ New Lead button, Excel Grid toggle, Reorder button)
  ✓ Filter chips (ALL, NEW LEAD, QUALIFIED, IN NEGOTIATION, WON)

EXCEL SPREADSHEET MODE (DEFAULT):
  ✓ 11 columns (name, email, phone, company, source, status, value, assignedRep, city, budget, requirement)
  ✓ Column reordering (← → shift buttons in header)
  ✓ Inline column rename (tap header to edit)
  ✓ Column width toggler (│↔│ button expands 140→210→280px)
  ✓ Horizontal scroll for all columns
  ✓ Data rows with alternating background colors (#090d16 / #0b1120)
  ✓ Status pills with color-coding (Won=green, Negotiation=yellow, default=blue)
  ✓ Call telemetry display under phone (Synced: Today 2:45 PM • Connected)

CARD VIEW MODE:
  ✓ Lead cards with name, company, email, value, phone
  ✓ Edit button per row
  ✓ Status badge
  ✓ Call button (initiates callSyncEngine) + WhatsApp button

MODALS (7 total):
  1. Inline Header Rename - TextInput + Save button
  2. Dynamic Column Reorder - List of columns with shift buttons
  3. Edit Lead Record - Full lead form
  4. New Lead Creation - Form with name, company, phone, value, source
  5. Google Sheets Multi-Tab Sync - URL input, tab selector, header row picker
  6. Universal Multi-Format Import - Format chips, header picker, raw data textarea
  7. Post-Call Outcome - Call outcome tracking modal

ROLE-BASED DATA ISOLATION:
  ✓ Admin: sees all leads
  ✓ Manager: sees leads assigned to self + rep team
  ✓ Team Leader: sees leads assigned to self + TL team
  ✓ Sales Exec: sees ONLY leads assigned to self

STATE MANAGEMENT:
  - activeSegment: 'FUNNEL' | 'COLLECTIONS'
  - viewMode: 'EXCEL_GRID' | 'CARD_LIST'
  - search: string
  - activeFilter: 'ALL' | 'NEW LEAD' | 'QUALIFIED' | 'IN NEGOTIATION' | 'WON'
  - leadsList: LeadItem[]
  - columnOrder: string[] (reorderable)
  - columnNames: Record<string, string> (editable headers)
  - columnWidths: Record<string, number> (resizable)
  - 7 modal open states
```

**Windows Implementation (`leads_view.py`):**
```python
class LeadsView(QWidget):
    def __init__(self, parent=None):
        # Two main sections: FUNNEL and COLLECTIONS
        # Use QStackedWidget to switch between views
        
        # COLLECTIONS view:
        # - QLineEdit for search
        # - QHBoxLayout for filter chips (QCheckBox-style)
        # - QTableWidget for Excel grid (custom delegates for editing, resizing)
        # - Custom column header with ← → buttons and │↔│ resizer
        
        # MODALS:
        # - QDialog for each modal type
        # - QLineEdit/QTextEdit for form inputs
        # - Custom signals/slots for save/cancel

class LeadExcelModel(QAbstractTableModel):
    def __init__(self, leads, columnOrder, columnNames, columnWidths):
        # Support drag/drop reordering
        # Support inline editing via delegates
        # Alternate row coloring
        
class ColumnHeaderDelegate(QStyledItemDelegate):
    def paint(self, painter, option, index):
        # Draw header with shift arrows + resize button
```

**macOS Implementation (`LeadsView.swift`):**
```swift
struct LeadsView: View {
    @StateObject var vm: LeadsViewModel
    @State var activeSegment: LeadsSegment = .collections
    @State var viewMode: ViewMode = .excelGrid
    @State var search = ""
    @State var activeFilter = "ALL"
    @State var columnOrder: [String]
    @State var columnNames: [String: String]
    @State var columnWidths: [String: CGFloat]
    
    // 7 modal states
    @State var showHeaderRenameModal = false
    @State var showColumnReorderModal = false
    // ... etc
    
    var body: some View {
        VStack {
            // Segmented picker (FUNNEL vs COLLECTIONS)
            Picker("", selection: $activeSegment) {
                Text("⚡ Lead Funnel").tag(LeadsSegment.funnel)
                Text("🎯 Leads Collections").tag(LeadsSegment.collections)
            }
            .segmented() // Looks like Android segmented slider
            
            if activeSegment == .funnel {
                FunnelView()
            } else {
                CollectionsView()
                    .searchable(text: $search, prompt: "🔍 Search by name, company, phone...")
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            HStack {
                                Button("+ New Lead") { showInsertModal = true }
                                Button(viewMode == .excelGrid ? "📊 Excel" : "📱 Card") {
                                    viewMode.toggle()
                                }
                                Button("🔀 Reorder") { showColumnReorderModal = true }
                            }
                        }
                    }
            }
        }
    }
}

struct ExcelGridView: View {
    // Custom view for Excel spreadsheet rendering
    // ScrollViewReader for horizontal scroll
    // LazyVStack for rows
    // Each column header has ← → ↔ buttons
}
```

---

#### 1.3 **AdminDashboardScreen** → Windows `admin_view.py` / macOS `AdminView.swift`
```
MUST REPLICATE:
✓ Won Revenue ($128,400 example)
✓ Active Pipeline ($412,000 example)
✓ Total Leads (3,420 example)
✓ Conversion Rate (14.2% example)
✓ Scheduled Meetings Today (3 meetings with details modal)
✓ Workforce & Attendance Today (19 Present / 24 Staff)
✓ Telemetry: $18,450 Sales, 142 Leads Allocated, 384 Calls, 820 Msgs
✓ Quick Action Bar (Staff Inspector, Lead Handover, Funnel Setup, Column Shifting)
✓ Multi-Source Ingestion Telemetry (Google Sheets, CSV Uploads, Meta Webhooks)
✓ Meeting filter (ALL / TODAY / UPCOMING)
✓ Meeting details modal showing lead info, assigned agent, purpose
```

**Key State:**
```python
# Windows
self.adminMetrics = {
    'wonRevenue': 128400,
    'activePipeline': 412000,
    'totalLeads': 3420,
    'conversionRate': 14.2,
    'staffPresent': 19,
    'staffTotal': 24,
    'telemetry': {
        'salesToday': 18450,
        'leadsAllocated': 142,
        'callsDone': 384,
        'msgsSent': 820
    }
}
self.scheduledMeetings = [...]  # 6 meetings
self.meetingFilter = 'TODAY'
self.selectedMeeting = None

# macOS
@State var adminMetrics: AdminMetricsModel
@State var scheduledMeetings: [ScheduledMeetingItem]
@State var meetingFilter: MeetingFilter = .today
@State var selectedMeeting: ScheduledMeetingItem?
```

---

### Phase 2: **Secondary Screens (Medium Priority)**
ContactsScreen → ProductsCatalogScreen → DealsPipelineScreen → ManagerDashboardScreen → TeamLeaderDashboardScreen

---

### Phase 3: **Tertiary Screens (Lower Priority)**
Tasks, HR, Automations, Communications, Reports, Settings

---

## 🎨 Design System

### Color Palette (Exact Match Required)
```
Dark Background:
  #090d16 - Primary background
  #0f172a - Card/container background
  #0b1329 - Header background
  #020617 - Input/dark overlay
  #1e293b - Border color
  #334155 - Disabled/muted
  #64748b - Subtext
  #94a3b8 - Secondary text
  #cbd5e1 - Tertiary text
  #f8fafc - Primary text (white)
  #ffffff - Pure white

Status Colors:
  #34d399 - Success/green (Won, Present)
  #38bdf8 - Info/blue (Default, Pending)
  #fbbf24 - Warning/yellow (Negotiation, Medium)
  #ef4444 - Error/red (Overdue, Failed)
  #a5b4fc - Indigo (Primary accent)
  #818cf8 - Indigo lighter
```

### Typography (Exact Match Required)
```
Fonts:
  iOS: SF Pro Display (system default)
  Windows: Segoe UI (system default)
  macOS: SF Pro Display (system default)

Weights:
  700 = Bold
  800 = ExtraBold
  900 = Black

Sizes:
  8pt = Captions, badges
  9pt = Small labels, helper text
  10pt = Filter chips, action buttons
  11pt = Input text, table rows
  12pt = Medium labels, list items
  13pt = Section titles, lead names
  14pt = Modal titles, lead names (large)
  15pt = Screen titles
  18pt = Header titles
```

### Component Patterns

**Status Badge:**
```python
# Windows - QLabel with stylesheet
badge_stylesheet = """
    QLabel {
        background-color: rgba(99,102,241,0.15);
        border: 1px solid rgba(99,102,241,0.3);
        border-radius: 6px;
        padding: 2px 6px;
        color: #a5b4fc;
        font-weight: bold;
    }
"""
```

```swift
// macOS
Text("PENDING")
    .font(.caption2.weight(.bold))
    .padding(.horizontal, 8)
    .padding(.vertical, 2)
    .background(Color(red: 0.4, green: 0.4, blue: 0.95).opacity(0.15))
    .cornerRadius(6)
    .border(Color(red: 0.4, green: 0.4, blue: 0.95).opacity(0.3), width: 1)
```

**Action Button:**
```python
# Windows - QPushButton
btn = QPushButton("+ New Lead")
btn.setStyleSheet("""
    QPushButton {
        background-color: #4f46e5;
        border: none;
        border-radius: 8px;
        padding: 6px 10px;
        color: white;
        font-weight: bold;
        font-size: 10px;
    }
    QPushButton:hover { background-color: #6366f1; }
    QPushButton:pressed { background-color: #4338ca; }
""")
```

```swift
// macOS
Button(action: { showInsertModal = true }) {
    Text("+ New Lead")
        .font(.system(size: 10, weight: .bold))
        .foregroundColor(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color(red: 0.31, green: 0.27, blue: 0.90))
        .cornerRadius(8)
}
```

---

## 📋 Implementation Checklist

### Windows (`Win/`)
- [ ] **Phase 1:**
  - [ ] Update `dashboard_view.py` (exact Android replica)
  - [ ] Rewrite `leads_view.py` (complete Excel grid + modals)
  - [ ] Rewrite `admin_view.py` (metrics + meetings)
  - [ ] Refactor `profile_view.py` for exact Android match
  
- [ ] **Phase 2:**
  - [ ] `contacts_view.py`
  - [ ] `products_view.py`
  - [ ] `deals_pipeline_view.py`
  
- [ ] **Phase 3:**
  - [ ] Remaining view files

### macOS (`macOs/Sources/DASCRM/Views/`)
- [ ] **Phase 1:**
  - [ ] Update `DashboardView.swift`
  - [ ] Rewrite `LeadsView.swift`
  - [ ] Rewrite `AdminView.swift`
  - [ ] Update `ProfileView.swift`
  
- [ ] **Phase 2:**
  - [ ] `ContactsView.swift`
  - [ ] `ProductsView.swift`
  - [ ] `DealsPipelineView.swift`
  
- [ ] **Phase 3:**
  - [ ] Remaining view files

---

## 🚀 Next Steps

1. **Approve this mapping** — Does this capture exact Android parity requirements?
2. **Start Phase 1 implementation:**
   - Begin with `LeadsView` (most complex, unblocks other modules)
   - Parallel development: Windows `leads_view.py` + macOS `LeadsView.swift`
3. **Build once, verify twice:**
   - Each view must render pixel-perfect to Android screenshot
   - State management must match Android flow exactly
   - API calls must use exact NestJS endpoints

---

## 📊 Complexity Scoring

**High Complexity (Requires custom widgets/components):**
- LeadsScreen: Excel spreadsheet grid, column manipulation, 7 modals
- WorkflowAutomationsScreen: Visual workflow builder
- ReportsAnalyticsScreen: Chart rendering, aggregations

**Medium Complexity (Standard CRUD + modals):**
- DealsPipelineScreen, AdminDashboardScreen, ManagerDashboard
- ProductsCatalog, QuotationsInvoices, BulkIngestion

**Low Complexity (Simple list/form):**
- Tasks, Attendance, Profile, Settings, HR basics

