# DAS CRM - Windows Desktop Application

Native Windows desktop application built with Python and PyQt6, featuring 120 FPS display pacing, NestJS backend integration, offline synchronization, and complete feature parity with Android and Web frontends.

## System Requirements

- **Windows**: Windows 10 or later (x64)
- **Python**: 3.11+ (for development)
- **.NET Runtime**: Optional (for enhanced system integration)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for application + dependencies

## Installation

### Development Setup

1. **Clone and navigate to the Windows directory**:
   ```bash
   cd "C:\Users\Mighty\Downloads\DAS CRM\Win"
   ```

2. **Create a Python virtual environment** (recommended):
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

**From source (development)**:
```bash
python main.py
```

**Build standalone executable**:
```bash
python build_exe.py
```

This generates `dist/DASCRM.exe` which can be distributed as a standalone executable.

## Architecture

### Directory Structure

```
Win/
├── main.py                          # Application entry point
├── requirements.txt                 # Python dependencies
├── build_exe.py                     # PyInstaller build script
├── core/
│   ├── api_client.py               # NestJS backend REST client
│   ├── sync_engine.py              # Offline queue & SQLite persistence
│   └── display_pacing.py           # 120 FPS QTimer frame pacing
├── models/
│   └── crm_models.py               # Pydantic data models
├── ui/
│   ├── sidebar_navigation.py       # Main window & sidebar
│   └── views/
│       ├── dashboard_view.py       # Executive dashboard
│       ├── leads_view.py           # Leads management
│       ├── deals_pipeline_view.py  # Kanban board
│       ├── contacts_view.py        # Client directory
│       ├── products_view.py        # Product catalog
│       ├── quotations_view.py      # Invoice builder
│       ├── reports_view.py         # Analytics
│       ├── bulk_ingestion_view.py  # CSV importer
│       ├── admin_view.py           # RBAC & audit logs
│       └── additional_views.py     # Tasks, HR, Automations, Comms
└── resources/
    └── styles.qss                  # Dark theme stylesheet
```

### Core Modules

#### `core/api_client.py` - REST API Client
- **Async networking** with `httpx` for non-blocking requests
- **Token management**: Persists auth tokens to `~/.dascrm/auth_token.json`
- **Endpoints**: Supports all backend API routes (leads, deals, contacts, products, quotations, reports, admin, bulk-import)
- **Retry logic**: Automatic retry on transient failures

#### `core/sync_engine.py` - Offline Synchronization
- **Network monitoring**: Detects online/offline state via socket connectivity checks
- **SQLite persistence**: Stores cached entities in `~/.dascrm/offline.db`
- **Pending queue**: JSON-based action queue at `~/.dascrm/pending_actions.json`
- **Auto-sync**: Automatically syncs pending actions when connectivity restored

#### `core/display_pacing.py` - 120 FPS Display Engine
- **QTimer-based ticker**: 8.33ms interval for 120 FPS frame pacing
- **Frame delta tracking**: Measures actual frame render times
- **FPS counter**: Updates UI with real-time frame rate

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

### Features

✅ **Dashboard**: Executive KPI metrics (Revenue, Growth, Active Deals, Conversion Rate)
✅ **Leads Engine**: Lead lifecycle management with status filtering and search
✅ **Deals & Pipeline**: Multi-stage Kanban board with drag-and-drop
✅ **Contacts Directory**: Client management with tags and quick actions
✅ **Products Catalog**: SKU management, stock tracking, unit pricing
✅ **Quotations & Invoices**: Proposal builder with status progression
✅ **Reports & Analytics**: MRR, Sales Velocity, CAC, quarterly targets
✅ **Bulk CSV Import**: Drag-and-drop file ingestion with import history
✅ **Admin & RBAC**: Role-based access control matrix and audit logging
✅ **Tasks & Follow-ups**: Task tracking and assignment
✅ **HR & Attendance**: Employee records and attendance logs
✅ **Automations**: Workflow automation engine
✅ **WhatsApp & Comms**: Communication hub for client outreach
✅ **App Settings**: User preferences, theme selection, backend URL config

## Performance

- **120 FPS Display Pacing**: Smooth animations and scrolling on modern displays
- **Async API Calls**: Non-blocking network requests prevent UI freezing
- **Offline-First**: Works offline with automatic sync when reconnected
- **SQLite Caching**: Fast local data retrieval from persistent cache

## Development

### Adding a New View

1. Create a new file in `ui/views/` (e.g., `my_feature_view.py`)
2. Subclass `QWidget` and implement the view UI
3. Import in `main.py` and add to the navigation tabs
4. Connect to the `APIClient` for backend integration

### Connecting to Backend

```python
self.api_client = APIClient(base_url="http://localhost:4000/api")

# Async API call example
async def fetch_data():
    leads = await self.api_client.get_leads(skip=0, limit=50)
    # Process leads...
```

### Offline Action Queueing

```python
self.sync_engine.enqueue_action(
    action_type="CREATE_LEAD",
    payload={"title": "New Lead", "value": 5000}
)
```

## Build & Distribution

### Creating Standalone Executable

```bash
python build_exe.py
```

**Output**: `dist/DASCRM.exe` (portable, ~120MB with dependencies)

### System Tray Integration

The application minimizes to system tray on close. Right-click tray icon to show/quit.

## Troubleshooting

### Application Won't Start
- Verify Python 3.11+ is installed: `python --version`
- Reinstall dependencies: `pip install -r requirements.txt --force-reinstall`

### Backend Connection Errors
- Check backend is running: `http://localhost:4000/api/auth/profile`
- Verify firewall allows localhost connections
- Check API base URL in app settings

### Offline Queue Not Syncing
- Check network connectivity
- Verify pending actions file: `~/.dascrm/pending_actions.json`
- Restart application to trigger sync

## License

Proprietary - DAS CRM Platform

## Support

For issues or feature requests, contact the development team.
