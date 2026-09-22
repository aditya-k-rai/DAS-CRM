# 🚀 DAS CRM — Enterprise Multi-Platform Architecture & Technical Specification

Welcome to the official, end-to-end technical documentation for **DAS CRM** — an enterprise-grade, multi-tenant Customer Relationship Management, HRMS, and Field Operations platform spanning Web, Mobile, and SuperAdmin infrastructure.

---

## 📑 Table of Contents

1. [System Overview & 4-Tier Topology](#1-system-overview--4-tier-topology)
2. [Strict Dual-Theme System Architecture (Dark & Light)](#2-strict-dual-theme-system-architecture-dark--light)
3. [Role-Based Access Control (RBAC) & Permission Matrix](#3-role-based-access-control-rbac--permission-matrix)
4. [Core Operational Workflows & Flowcharts](#4-core-operational-workflows--flowcharts)
   - [Flow 1: Tenant Key Provisioning & Workspace Activation](#flow-1-tenant-key-provisioning--workspace-activation)
   - [Flow 2: Multi-Source Lead Ingestion & 3-Tier Funnel Distribution](#flow-2-multi-source-lead-ingestion--3-tier-funnel-distribution)
   - [Flow 3: GPS Geofenced Attendance Punch & Leave Lifecycle](#flow-3-gps-geofenced-attendance-punch--leave-lifecycle)
   - [Flow 4: Product Catalogue, Quotation Builder & PDF Invoice Engine](#flow-4-product-catalogue-quotation-builder--pdf-invoice-engine)
   - [Flow 5: 6-Month Automated Data Retention & Verified Document Exemption Safeguard](#flow-5-6-month-automated-data-retention--verified-document-exemption-safeguard)
   - [Flow 6: Role Transition Governance & 24-Hour Security Lock](#flow-6-role-transition-governance--24-hour-security-lock)
   - [Flow 7: WhatsApp Cloud API & Automated Campaign Dispatcher](#flow-7-whatsapp-cloud-api--automated-campaign-dispatcher)
5. [Backend Architecture & Engine (`backend/`)](#5-backend-architecture--engine-backend)
   - [32 Specialized NestJS Modules Directory](#32-specialized-nestjs-modules-directory)
   - [Database Layer & Prisma Schema](#database-layer--prisma-schema)
   - [API Throttling, Security & Rate Limiting](#api-throttling-security--rate-limiting)
   - [Google Drive Storage Vault Categorization](#google-drive-storage-vault-categorization)
   - [Core REST API Endpoints Specification](#core-rest-api-endpoints-specification)
6. [Frontend Web Application (`frontend-web/`)](#6-frontend-web-application-frontend-web)
   - [Tech Stack & Architecture](#tech-stack--architecture)
   - [Complete 50+ Routes Directory](#complete-50-routes-directory)
   - [UI Components & Layout Controls](#ui-components--layout-controls)
7. [SuperAdmin Overlord Portal (`superadmin-web/`)](#7-superadmin-overlord-portal-superadmin-web)
   - [2-Step OTP Authentication & Bypass Mode](#2-step-otp-authentication--bypass-mode)
   - [Dashboard Controls, Plan Extensions & Telemetry](#dashboard-controls-plan-extensions--telemetry)
   - [6-Month Data Purge Telemetry & Manual Trigger](#6-month-data-purge-telemetry--manual-trigger)
8. [Android Mobile Application (`android/`)](#8-android-mobile-application-android)
   - [Expo SDK 57 & Native Device APIs](#expo-sdk-57--native-device-apis)
   - [Screens & Navigation Directory](#screens--navigation-directory)
   - [In-App APK Auto-Update Launcher](#in-app-apk-auto-update-launcher)
9. [Cross-Platform Feature Parity Matrix](#9-cross-platform-feature-parity-matrix)
10. [Local Development, Environment Variables & Build Guide](#10-local-development-environment-variables--build-guide)

---

## 1. System Overview & 4-Tier Topology

DAS CRM is architected as an interconnected four-tier enterprise system engineered for high-velocity sales pipelines, geofenced workforce management, multi-tenant isolation, and central administrative oversight:

```mermaid
graph TD
    subgraph Clients["Client Applications Layer"]
        A["📱 Android Mobile App<br/>(React Native 0.86 / Expo SDK 57)<br/>Field Sales & Geofence Attendance"]
        W["🌐 Frontend Web Portal<br/>(Next.js 16 / React 19 / Turbopack)<br/>Pipeline CRM, HRMS & Quotes"]
        S["👑 SuperAdmin Overlord Portal<br/>(Next.js 15 / React 19)<br/>Tenant Keys, Data Retention & Telemetry"]
    end

    subgraph Gateway["API Gateway & Security Layer"]
        G["🛡️ CustomThrottlerGuard & JWT Auth<br/>NestJS 10 REST API Server (Port 3001)"]
    end

    subgraph Backend["Core Services Layer (backend/)"]
        M1["Leads & 3-Tier Funnel Service"]
        M2["HR & Geofence Attendance Service"]
        M3["Quotations & PDF Engine"]
        M4["🛡️ 6-Month Data Retention Service"]
        M5["Role Transition 24h Lock Service"]
        M6["WhatsApp Cloud & Notification Hub"]
    end

    subgraph Data["Persistence & Storage Vault Layer"]
        DB[("🐘 PostgreSQL / Prisma ORM<br/>Supabase Connection Pooling")]
        RD[("⚡ Redis Cache & Task Queues")]
        GD[("☁️ Google Drive Storage Vault<br/>Company Files & Verified Documents")]
    end

    A -->|HTTPS / Bearer JWT| G
    W -->|HTTPS / Bearer JWT| G
    S -->|HTTPS / 6-Digit OTP / Bearer JWT| G

    G --> M1 & M2 & M3 & M4 & M5 & M6
    M1 & M2 & M3 & M4 & M5 & M6 --> DB
    M1 & M2 & M3 & M4 & M5 & M6 --> RD
    M3 & M4 --> GD
```

### Core Architecture Capabilities
- **Multi-Tenant Isolation**: Every database query is strictly partitioned by `organizationId`. Cross-tenant data leaks are physically blocked at both the Prisma query layer and controller guards.
- **Micro-Service Ready Modularity**: The backend is partitioned into 32 autonomous NestJS domain modules.
- **Dual-Theme High Contrast Consistency**: Strict Dark and Light modes across Web and Mobile with zero contrast degradation or hover-only text bugs.
- **Automated Compliance & Hygiene**: 6-month automated company history purge engine paired with permanent preservation for verified employee legal documents.

---

## 2. Strict Dual-Theme System Architecture (Dark & Light)

DAS CRM enforces a **strict 2-theme design standard**:
- `dark`: Deep slate/zinc `#0B0F17` & `#131B2B` with high-contrast `#F8FAFC` typography and crisp `#1E293B` borders.
- `light`: Crisp white `#FFFFFF` & cool grey `#F8FAFC` backgrounds with bold `#0F172A` typography and `#E2E8F0` border accents.

```
                  ┌──────────────────────────────┐
                  │ Strict Dual Theme: ['light', 'dark'] │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│           Light Mode            │   │            Dark Mode            │
│ Background: #FFFFFF / #F8FAFC   │   │ Background: #0B0F17 / #131B2B   │
│ Text Primary: #0F172A           │   │ Text Primary: #F8FAFC           │
│ Text Muted: #64748B             │   │ Text Muted: #94A3B8             │
│ Surface Borders: #E2E8F0        │   │ Surface Borders: #1E293B        │
│ Card Surfaces: #FFFFFF          │   │ Card Surfaces: #1E293B / #111827│
└─────────────────────────────────┘   └─────────────────────────────────┘
```

### Key Theme Enhancements & Fixes
1. **No Hover-Only Visibility**: All text labels, metrics, subtitles, and descriptions are rendered with persistent high contrast tokens (`text-slate-900 dark:text-white` or `text-slate-600 dark:text-slate-300`). Text is never hidden or only revealed upon hover.
2. **Elimination of "System" Ambiguity**: The legacy 3-way toggle has been replaced with a deterministic 2-way toggle across `frontend-web`, `superadmin-web`, and the `android` mobile app.
3. **Anti-FOWT (Flash of Wrong Theme)**: An inline script in Next.js `layout.tsx` reads `localStorage.getItem('das_crm_theme')` synchronously before the DOM paints, preventing theme flashing on page refresh.

---

## 3. Role-Based Access Control (RBAC) & Permission Matrix

DAS CRM implements a strict 5-tier role hierarchy within tenant organizations, overseen externally by the SuperAdmin:

| Role Identifier | Portal | Access Scope & Key Capabilities |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin-web` | Overlord platform access. Generates tenant registration keys, monitors all tenant telemetry, triggers manual/automated 6-month retention purges, and manages license plan extensions. |
| **ADMIN / TENANT_ADMIN** | `frontend-web` & `android` | Complete control within their company tenant. Manages user seats, team quotas, billing, pipeline stages, custom fields, data exports, and initiates employee role transitions. |
| **MANAGER** | `frontend-web` & `android` | Oversees departmental teams. Allocates lead quotas, approves deals, reviews team conversion analytics, and manages representative assignments. |
| **HR / HR_MANAGER** | `frontend-web` & `android` | Workforce management. Controls employee onboarding, KYC document verification, geofenced attendance audits, leave approvals, and payroll/salary calculation. |
| **TEAM_LEADER** | `frontend-web` & `android` | Unit supervisor. Distributes incoming lead batches, tracks real-time rep calling velocity, monitors team attendance, and coaches sales reps. |
| **EMPLOYEE / SALES_EXEC** | `frontend-web` & `android` | Frontline operator. Handles claimed leads, executes speed claims from the grab pool, logs calls, creates quotes, generates PDF invoices, and logs geofenced GPS check-ins. |

---

## 4. Core Operational Workflows & Flowcharts

### Flow 1: Tenant Key Provisioning & Workspace Activation

This flow governs how new tenant companies are licensed, provisioned, and activated:

```mermaid
sequenceDiagram
    autonumber
    actor SA as SuperAdmin
    participant SW as SuperAdmin Portal
    participant BE as Backend API (/api/v1)
    participant DB as PostgreSQL DB
    actor TA as Tenant Admin
    participant FW as Frontend Web

    SA->>SW: Configure Plan Tier, Seats & Expiry Days
    SW->>BE: POST /auth/generate-company-key
    BE->>DB: Insert KeyRecord (e.g. ACME-KX-7421)
    BE-->>SW: Key Generated Successfully
    SA->>TA: Shares Key with Tenant Admin
    TA->>FW: Navigates to /register & Enters Key + Admin Details
    FW->>BE: POST /auth/register-with-key
    BE->>DB: Validate Key: exists, active, not expired
    BE->>DB: Create Organization + Workspace Defaults
    BE->>DB: Seed Default Pipelines, Funnels & Admin User
    BE->>DB: Mark Key as CLAIMED and link to Organization
    BE-->>FW: Issue JWT Access & Refresh Tokens
    FW-->>TA: Redirect to /dashboard (Workspace Activated)
```

---

### Flow 2: Multi-Source Lead Ingestion & 3-Tier Funnel Distribution

DAS CRM supports multi-channel lead ingestion routed through three intelligent distribution models:

```mermaid
graph TD
    subgraph Ingestion["1. Multi-Source Ingestion"]
        S1["CSV / Excel Bulk Import"]
        S2["Webhooks / Landing Page APIs"]
        S3["Manual Lead Creation"]
        S4["WhatsApp Cloud Inbound"]
    end

    subgraph Pool["2. Tenant Lead Intake Pool"]
        LP["Unassigned Leads Queue<br/>(ownerId = NULL, organizationId = scoped)"]
    end

    subgraph Models["3. Three Distribution Models"]
        M1["Model 1: Custom Batch Quota<br/>(Admin allocates index range e.g. 1-100 to Manager A)"]
        M2["Model 2: Dynamic 'Grab' Flow (Speed Claim)<br/>(Atomic Prisma $transaction 'Claim & Vanish')"]
        M3["Model 3: Direct Admin Funneling<br/>(Admin directly assigns lead to designated Rep/Manager)"]
    end

    subgraph Pipeline["4. CRM Execution & Pipeline Progression"]
        P1["AI Lead Scoring & Prioritization"]
        P2["Kanban Pipeline Stage Movement"]
        P3["Deal Conversion & Quotation Generation"]
    end

    S1 & S2 & S3 & S4 --> LP
    LP --> M1
    LP --> M2
    LP --> M3
    M1 & M2 & M3 --> P1 --> P2 --> P3
```

#### Detailed Explanation of the 3 Distribution Models:
1. **Model 1: Custom Batch Quota Allocation (`allocateBatchQuota`)**:
   - The Tenant Admin or Team Leader selects a range of unassigned leads by index (e.g. leads 1 to 50 to Team North, 51 to 100 to Team South).
   - The backend validates available unassigned leads, updates `ownerId` in bulk, and emits real-time assignment notifications to the designated managers.
2. **Model 2: Dynamic "Grab" Flow / Speed Claim (`claimDynamicLead`)**:
   - Anonymized lead cards (name/budget visible, contact info hidden until claimed) are broadcast to an open pool.
   - Representatives click **"Claim Lead"**.
   - An **atomic Prisma transaction (`$transaction`)** verifies that `ownerId` is strictly `NULL`. If unclaimed, it assigns the lead to the claiming user immediately. If another representative claimed it a millisecond earlier, a `BadRequestException` is thrown, ensuring the lead instantly vanishes from the pool without race conditions.
3. **Model 3: Direct Admin Funneling (`directAdminFunnel`)**:
   - Targeted assignment where an administrator manually directs specific high-value enterprise leads to specialist sales reps.

---

### Flow 3: GPS Geofenced Attendance Punch & Leave Lifecycle

Ensures workforce accountability by validating physical location coordinates before allowing check-in:

```mermaid
sequenceDiagram
    autonumber
    actor EMP as Employee
    participant APP as Android App / Web
    participant GPS as Device GPS (expo-location)
    participant BE as Backend API (/attendance)
    participant DB as PostgreSQL DB
    actor HR as HR Manager

    EMP->>APP: Opens Attendance Screen
    APP->>GPS: Request Current Lat/Lng Coordinates
    GPS-->>APP: Return Coordinates & Accuracy Radius
    APP->>APP: Compute Haversine distance to Office Coordinates
    alt Inside Office Boundary (dist <= maxRadiusMeters)
        APP-->>EMP: Display Green Geofence Verified Badge
        EMP->>APP: Tap "Punch In Now"
        APP->>BE: POST /attendance/check-in { lat, lng }
        BE->>DB: Upsert EmployeeAttendance (checkIn = NOW(), status = PRESENT)
        BE-->>APP: Punch Confirmed with Timestamp
    else Outside Boundary (dist > maxRadiusMeters)
        APP-->>EMP: Display Red Geofence Alert
        Note over APP,EMP: Punch blocked or flagged as Out-of-Office for HR review
    end

    opt Check-out & Working Hours Calculation
        EMP->>APP: Tap "Punch Out Now"
        APP->>BE: POST /attendance/check-out
        BE->>DB: Calculate duration = (checkOut - checkIn)
        BE->>DB: Update workingHours, status (>=6h: PRESENT, 4-6h: HALF_DAY, <4h: HALF_DAY)
        BE-->>APP: Attendance Summary Confirmed
    end
```

---

### Flow 4: Product Catalogue, Quotation Builder & PDF Invoice Engine

A complete commercial pipeline from product inventory to branded customer PDF generation:

```mermaid
graph TD
    A["📦 Product & Service Catalogue<br/>(SKU, Unit Pricing, Tax Rates)"] --> B["📝 Quotation Builder (/quotes)<br/>(Select Lead/Contact, Line Items, Discounts)"]
    B --> C["🧮 Dynamic Calculation Engine<br/>Subtotal + CGST/SGST/IGST - Discounts = Grand Total"]
    C --> D{"Export Options"}
    D -->|PDF Invoice| E["📄 Multi-Page A4 PDF Renderer<br/>(Branded Header, Terms & Conditions, Signatures)"]
    D -->|WhatsApp Share| F["💬 Direct WhatsApp Web / App Trigger<br/>(Pre-filled Quote Message with Download Link)"]
    D -->|Print| G["🖨️ Native Print & AirPrint Dispatch"]
    E --> H["☁️ Google Drive Storage Vault<br/>Persisted under company quotation archive"]
```

---

### Flow 5: 6-Month Automated Data Retention & Verified Document Exemption Safeguard

To optimize database storage, uphold tenant hygiene, and comply with data privacy policies, DAS CRM enforces an **automated 6-month (180-day) data retention cycle** with **strict permanent exemptions** for verified workforce records:

```mermaid
graph TD
    subgraph Trigger["1. Lifecycle Trigger"]
        T1["⏰ Daily 24-Hour Automated Cron Cycle"]
        T2["🚀 OnApplicationBootstrap (15s delayed check)"]
        T3["👑 SuperAdmin Manual 'Purge Expired Data Now' Trigger"]
    end

    subgraph Calculation["2. Cutoff Date Calculation"]
        C["Cutoff Date = NOW() - 180 Days (6 Months Exact)"]
    end

    subgraph Purge["3. Company History Auto-Purge (Older than 180 Days)"]
        P1["❌ Expired Leads & AI Scores"]
        P2["❌ Expired Activities (Calls, Emails, Logs)"]
        P3["❌ Expired Tasks & Scheduled Meetings"]
        P4["❌ Expired Quotations & Line Items"]
        P5["❌ Expired Deals & Pipeline Stages"]
        P6["❌ Expired Notifications & Imports"]
        P7["❌ Expired Attendance Operational Logs"]
        P8["❌ Expired Ephemeral Company Drive Files"]
    end

    subgraph Exemption["4. STRICT LEGAL EXEMPTION GUARANTEE (NEVER PURGED)"]
        E1["🛡️ Verified Employee Profiles & KYC Records"]
        E2["🛡️ Aadhaar Cards, PAN Cards & Passports"]
        E3["🛡️ Bank Account Details & Verification Documents"]
        E4["🛡️ Employee Profile Photos & Avatar Storage"]
        E5["🛡️ Data Retention Audit Trail Logs"]
    end

    T1 & T2 & T3 --> C
    C --> Purge
    C -.->|Permanently Excluded & Shielded| Exemption
    Purge --> L["📝 Write AuditLog Entry: DATA_RETENTION_PURGE with Total Purged Counts"]
```

#### Retention Purge Breakdown:
| Data Category | Retention Cutoff | Purge Action | Exemption Status |
| :--- | :---: | :---: | :--- |
| **Sales Leads & Status History** | 180 Days | Automatically deleted | None |
| **Activities, Calls & Notes** | 180 Days | Automatically deleted | None |
| **Tasks & Scheduled Meetings** | 180 Days | Automatically deleted | None |
| **Quotations & Invoices** | 180 Days | Automatically deleted | None |
| **Deals & Pipeline Records** | 180 Days | Automatically deleted | None |
| **Attendance Punch Logs** | 180 Days | Automatically deleted | None |
| **Drive Company Files** | 180 Days | Automatically deleted | None |
| **Verified Employee Documents** | **PERMANENT** | **SHIELDED** | **100% Permanently Preserved (KYC, IDs, Bank Proofs)** |
| **Employee Core Profiles** | **PERMANENT** | **SHIELDED** | **100% Permanently Preserved** |

---

### Flow 6: Role Transition Governance & 24-Hour Security Lock

To prevent unauthorized privilege escalation and maintain audit compliance, role alterations enforce a two-man rule with a 24-hour verification window:

```mermaid
sequenceDiagram
    autonumber
    actor ADM as Tenant Admin
    participant BE as Backend API (/role-transition)
    participant DB as PostgreSQL DB
    actor USR as Target Employee

    ADM->>BE: POST /role-transition/initiate { userId, newRole }
    BE->>DB: Create RoleTransitionRecord (status = PENDING, expiresAt = NOW + 24h)
    BE->>DB: Apply Active Security Lock on User Account
    BE-->>ADM: Transition Initiated (24-Hour Lock Active)

    alt Option A: Employee Confirms New Role
        USR->>BE: POST /role-transition/accept
        BE->>DB: Verify Transition Record & Expiry
        BE->>DB: Update user.role = newRole
        BE->>DB: Release Security Lock (status = COMPLETED)
        BE-->>USR: Role Updated & Session Refreshed
    else Option B: Admin Reverts Transition
        ADM->>BE: POST /role-transition/revert/:id
        BE->>DB: Cancel Transition & Release Lock (status = REVERTED)
        BE-->>ADM: Transition Reverted Successfully
    else Option C: 24-Hour Lock Expiry
        Note over BE,DB: If unaccepted after 24h, transition automatically expires
    end
```

---

### Flow 7: WhatsApp Cloud API & Automated Campaign Dispatcher

Multi-channel customer communications powered by pre-configured template engines:

```mermaid
graph LR
    A["💬 WhatsApp Cloud API Hub (/whatsapp-templates)"] --> B["📝 Template Selector<br/>(e.g. Lead Welcome, Quotation Sent, Payment Reminder)"]
    B --> C["🔤 Dynamic Variable Hydration<br/>{{name}} -> Client Name<br/>{{company}} -> Organization<br/>{{amount}} -> Quote Total"]
    C --> D["🚀 Dispatcher via WhatsApp Cloud API"]
    D --> E["📱 Direct Delivery to Customer Device"]
    E --> F["📊 Real-time Delivery & Read Receipt Webhook Telemetry"]
```

---

## 5. Backend Architecture & Engine (`backend/`)

Location: `c:/Users/Mighty/Downloads/DAS CRM/backend`

Built on **NestJS 10** with **Prisma ORM 5**, structured around modular domain design with dependency injection, global interceptors, and custom throttling guards.

### 32 Specialized NestJS Modules Directory

| # | Module Name | Location | Responsibility & Domain Logic |
| :-: | :--- | :--- | :--- |
| 1 | `ActivitiesModule` | `modules/activities` | Logs calls, notes, emails, meetings, and stage changes across leads and deals. |
| 2 | `AiScoringModule` | `modules/ai-scoring` | AI-driven lead scoring algorithm based on budget, velocity, and engagement. |
| 3 | `AttendanceModule` | `modules/attendance` | Geofenced GPS punch-in/out, daily work hour calculation, and team attendance telemetry. |
| 4 | `AuditLogsModule` | `modules/audit-logs` | Immutable audit trail for all write, delete, role changes, and purge events. |
| 5 | `AuthModule` | `modules/auth` | JWT issuance, SuperAdmin OTP verification, tenant registration via company keys. |
| 6 | `AutomationsModule` | `modules/automations` | Workflow automation rules (trigger -> condition -> action). |
| 7 | `BillingModule` | `modules/billing` | Razorpay subscription checkout, payment verification, and invoice tracking. |
| 8 | `CompaniesModule` | `modules/companies` | B2B accounts directory, parent organizations, and corporate contact maps. |
| 9 | `ContactsModule` | `modules/contacts` | Individual customer contacts, email/phone registries, and lead associations. |
| 10 | `CustomFieldsModule` | `modules/custom-fields` | Dynamic custom metadata schema builder for leads, contacts, and deals. |
| 11 | `DataRetentionModule` | `modules/data-retention` | **6-month company history auto-purge engine with verified document protections.** |
| 12 | `DealsModule` | `modules/deals` | Sales deal pipeline, Kanban stages, win/loss probabilities, and deal values. |
| 13 | `DriveModule` | `modules/drive` | Google Drive Vault service, company file uploads, and employee KYC folder isolation. |
| 14 | `EmailModule` | `modules/email` | SMTP / SendGrid email campaign dispatcher, automated transactional emails. |
| 15 | `ExportsModule` | `modules/exports` | CSV, XLSX, and JSON telemetry export engine with role-based masking. |
| 16 | `HrModule` | `modules/hr` | Employee profiles, salary structures, department hierarchies, and KYC verification. |
| 17 | `ImportsModule` | `modules/imports` | Multi-format CSV/XLSX lead import parser with duplicate detection and column mapping. |
| 18 | `LeadsModule` | `modules/leads` | Core lead pipeline, 3-tier distribution engine (Batch Quota, Speed Claim, Direct). |
| 19 | `LeavesModule` | `modules/leaves` | Employee leave application lifecycle (Sick, Casual, Paid) & manager approvals. |
| 20 | `NotificationsModule` | `modules/notifications` | Real-time task alerts, 5-minute prior reminders, and lead assignment pushes. |
| 21 | `OrganizationsModule` | `modules/organizations` | Tenant organization profile, branding, logo, timezone, and currency settings. |
| 22 | `PipelinesModule` | `modules/pipelines` | Custom sales pipelines and multi-stage funnel visualizer configuration. |
| 23 | `ProductsModule` | `modules/products` | Inventory catalog, pricing tiers, tax categories, and brochure attachments. |
| 24 | `QuotationsModule` | `modules/quotations` | Quotation generator, itemized calculations, discount margins, and PDF compilation. |
| 25 | `RoleTransitionModule` | `modules/role-transition` | Two-man rule role alteration governance with 24-hour security locks. |
| 26 | `RolesModule` | `modules/roles` | Granular permission definitions across the 5 internal user roles. |
| 27 | `SalaryModule` | `modules/salary` | Payroll generation, overtime bonuses, deductions, and salary slips. |
| 28 | `TasksModule` | `modules/tasks` | Action items, due dates, priority tiers, and automated follow-up reminders. |
| 29 | `TeamsModule` | `modules/teams` | Team grouping, leader-to-member assignment, and territorial lead pools. |
| 30 | `TemplatesModule` | `modules/templates` | Master templates for email, WhatsApp, contracts, and SMS communications. |
| 31 | `UsersModule` | `modules/users` | User credentials, avatar management, account status toggles, and profile updates. |
| 32 | `WhatsappModule` | `modules/whatsapp` | WhatsApp Cloud API webhook receiver, template sender, and chat log storage. |

---

### Database Layer & Prisma Schema

DAS CRM connects to **PostgreSQL** (via Supabase pooling with PgBouncer) and supports local SQLite development fallback.
- **Connection Pooling**: `DATABASE_URL` (Port 6543 / PgBouncer) for high-concurrency connection handling.
- **Direct Migrations**: `DIRECT_URL` (Port 5432) for schema updates and migrations.
- **Multi-Tenant Schema Pattern**: All business models (`Lead`, `Contact`, `Deal`, `Task`, `Quotation`, `EmployeeAttendance`, `Activity`) enforce mandatory foreign key constraints referencing `organizationId`.

---

### API Throttling, Security & Rate Limiting

DAS CRM enforces endpoint-aware rate limiting via NestJS `@nestjs/throttler` (`CustomThrottlerGuard`):
- **User-Based Tracking**: Authenticated requests are throttled by `user_<USER_ID>` so quotas are unified across Web and Mobile.
- **IP-Based Tracking**: Unauthenticated requests are throttled by `ip_<IP_ADDRESS>`.

| Endpoint Group | Hourly Limit | Rationale |
| :--- | :---: | :--- |
| **Auth & OTP Endpoints** (`/auth/login`, `/auth/register-with-key`, `/auth/super-admin/request-otp`) | **15 req / hr** | Blocks brute-force credential stuffing and SMS/Email toll-fraud. |
| **Bulk File Ingestion & Drive** (`/imports/*`, `/drive/upload`) | **40 req / hr** | Prevents memory exhaustion and database lockup during file parsing. |
| **General CRM Operations** (`/leads`, `/deals`, `/contacts`, `/attendance`) | **1,000 req / hr** | Guarantees high-velocity UI responsiveness for day-to-day operations. |

---

### Google Drive Storage Vault Categorization

Files managed by `DriveService` are partitioned into two strict architectural categories:
1. **Company Operational Files (`/das_crm_storage_hub/company-files/`)**:
   - Quotes, brochures, CSV imports, temporary lead attachments.
   - **Subject to the 6-month automated data retention purge policy.**
2. **Employee Verified Documents Vault (`/das_crm_storage_hub/employee-verified-documents/`)**:
   - Government ID proofs (Aadhaar, PAN, Passport, Voter ID).
   - Bank passbooks, cancelled cheques, and signed employment contracts.
   - **PERMANENTLY PROTECTED. The retention purge engine is programmatically hardcoded to bypass this directory.**

---

### Core REST API Endpoints Specification

```http
### Authentication & Registration
POST   /api/v1/auth/login                         # Standard email & password login
POST   /api/v1/auth/register-with-key             # Onboard new tenant via company key
POST   /api/v1/auth/super-admin/request-otp       # Request 6-digit SuperAdmin OTP
POST   /api/v1/auth/super-admin/verify-otp        # Authenticate SuperAdmin session
POST   /api/v1/auth/generate-company-key          # Generate new tenant license key

### Leads & Funnel Distribution
GET    /api/v1/leads                              # List tenant leads (paginated, filtered)
POST   /api/v1/leads                              # Ingest single lead
POST   /api/v1/leads/batch-allocate               # Model 1: Allocate batch range
POST   /api/v1/leads/:id/claim                    # Model 2: Dynamic grab / Speed claim
POST   /api/v1/leads/:id/direct-funnel            # Model 3: Direct Admin funneling

### Geofenced Attendance & HR
POST   /api/v1/attendance/check-in                # Submit GPS-verified check-in punch
POST   /api/v1/attendance/check-out               # Check out and compute daily hours
GET    /api/v1/attendance/my                      # Fetch personal monthly punch calendar
GET    /api/v1/attendance/team                    # Team Leader / Manager team punch audit
GET    /api/v1/hr/employees                       # Full tenant workforce directory

### Data Retention & Governance
GET    /api/v1/data-retention/status              # Query 6-month purge telemetry & stats
POST   /api/v1/data-retention/purge-now           # SuperAdmin manual purge trigger
POST   /api/v1/role-transition/initiate           # Initiate role change (creates 24h lock)
POST   /api/v1/role-transition/accept             # Employee accepts new role (unlocks)
POST   /api/v1/role-transition/revert/:id         # Admin cancels pending role change
```

---

## 6. Frontend Web Application (`frontend-web/`)

Location: `c:/Users/Mighty/Downloads/DAS CRM/frontend-web`

Built on **Next.js 16 (App Router)** and **React 19**, styled with **Tailwind CSS v4** and headless primitives from **Radix UI**.

### Tech Stack & Architecture
- **Framework**: Next.js `16` / React `19` / Turbopack
- **Icons**: `lucide-react`
- **Charts**: `recharts` (ResponsiveAreaChart, ConversionBarChart, PipelineFunnel)
- **Data Fetching**: `@tanstack/react-query` v5
- **Theme**: Strict 2-theme engine (`'dark' | 'light'`) with anti-FOWT zero-latency hydration

### Complete 50+ Routes Directory

```
frontend-web/app/
├── (auth)/
│   ├── login/                     # Standard user authentication portal
│   └── register/                  # Tenant onboarding via company key
├── (dashboard)/
│   ├── about/                     # System architecture & version release notes
│   ├── admin/                     # Organization administration & audit center
│   ├── attendance/                # Employee attendance log & GPS punch audit
│   ├── automations/               # Workflow builder (Trigger -> Condition -> Action)
│   ├── comms/                     # Team chat & rapid announcements
│   ├── communicate/               # Unified communication center (SMS/Email/WhatsApp)
│   ├── companies/                 # B2B Account directory
│   ├── contacts/                  # Individual contacts registry
│   ├── dashboard/                 # Executive dashboard with KPI summary cards
│   │   ├── hr/                    # HR telemetry, active punch counts & leaves
│   │   ├── manager/               # Department revenue, targets & team leaderboard
│   │   ├── sales/                 # Sales rep personal call queue & daily goals
│   │   └── team-leader/           # Unit quota allocation & rep conversion velocity
│   ├── database/                  # Data hygiene & schema viewer
│   ├── deals/                     # Interactive Kanban deal pipeline with drag-and-drop
│   ├── downloads/                 # In-app download center for Android APK & Mac apps
│   ├── emails/                    # Email campaign dispatcher & delivery metrics
│   ├── goals/                     # Target setting & quota achievement tracker
│   ├── help/                      # User documentation & support ticket center
│   ├── hr/
│   │   ├── attendance/            # Master geofenced punch telemetry
│   │   ├── employees/             # Staff roster, KYC status & role manager
│   │   ├── interviews/            # Recruitment candidate tracking pipeline
│   │   ├── leaves/                # Employee leave application approval board
│   │   └── salary/                # Payroll, overtime, bonus & salary slip generator
│   ├── imports/                   # Excel/CSV bulk ingestion wizard
│   ├── leads/                     # Master lead management table & filters
│   │   └── [id]/                  # Comprehensive lead detail view & activity timeline
│   ├── pdf-catalogue/             # Digital brochure compiler & PDF downloader
│   ├── pipeline/                  # Funnel conversion stage visualizer
│   ├── products/                  # Product inventory & price list manager
│   ├── profile/                   # Personal account settings & security credentials
│   ├── quotes/                    # Quotation and estimate builder
│   ├── reports/                   # BI analytics, export generator & conversion charts
│   ├── settings/
│   │   ├── billing/               # Plan upgrade & payment receipts
│   │   ├── funnel/                # Lead distribution model configuration
│   │   ├── profile/               # Organization details & branding
│   │   └── team/                  # Employee seat allocation & invitations
│   ├── tasks/                     # Task manager with priority tags & 5-min alerts
│   └── whatsapp-templates/        # WhatsApp Cloud API template configuration
├── billing/                       # Public/Checkout subscription plans
├── onboarding/                    # Post-registration 4-step wizard
└── verification-pending/          # Account verification holding state
```

### UI Components & Layout Controls
- **Topbar (`components/layout/Topbar.tsx`)**: Responsive header with hamburger toggle, global search trigger (`⌘K`), 2-way `ThemeToggle`, notification badge, and profile menu.
- **Sidebar (`components/layout/Sidebar.tsx`)**: Dynamic, collapsible navigation drawer filtering visible links strictly based on the authenticated user's role.
- **ThemeToggle (`components/common/ThemeToggle.tsx`)**: High-contrast, animated 2-way toggle switching between Light and Dark modes.
- **CommandPalette (`components/layout/CommandPalette.tsx`)**: Modal search index (`⌘K`) for instant access across leads, contacts, deals, and navigation routes.

---

## 7. SuperAdmin Overlord Portal (`superadmin-web/`)

Location: `c:/Users/Mighty/Downloads/DAS CRM/superadmin-web`

Built on **Next.js 15** and **React 19**, running on **Port 3002**, providing platform-level administration across all tenant companies.

### 2-Step OTP Authentication & Bypass Mode
- **Step 1**: SuperAdmin email and password validation.
- **Step 2**: 6-digit numerical OTP dispatched to administrator email.
- **Bypass / Fallback Mode**: If the mail server or backend OTP service is unreachable during offline maintenance, an automated developer fallback enables secure recovery.

### Dashboard Controls, Plan Extensions & Telemetry
1. **Top KPI Metric Cards**:
   - Total Registered Companies & Platform Users.
   - Active Free Trials vs. Paid Subscriptions.
   - Plan Expired Counter with 1-click filter.
2. **Management Tabs**:
   - **Keys & Companies**: Full registry of generated license keys, seat quotas, and expiry timestamps.
   - **Plan Expired Companies**: One-click **"+30 Days Extension"** buttons to grant subscription extensions.
   - **Templates Hub**: Master repository for WhatsApp onboarding messages and system notification templates.
   - **WhatsApp Cloud Telemetry**: Usage charts, message delivery success rates, and token consumption logs.
   - **Company Approvals**: Review queue for incoming registration requests.

### 6-Month Data Purge Telemetry & Manual Trigger
- **Live Retention Monitor**: Displays the 180-day cutoff date, total records pending purge, and the count of **Permanently Shielded Employee Documents**.
- **Manual Trigger Button (`Purge Expired Company Data Now`)**: Calls `/api/v1/data-retention/purge-now` to run the 180-day purge immediately, reporting live counts of purged activities, leads, notes, and tasks.

---

## 8. Android Mobile Application (`android/`)

Location: `c:/Users/Mighty/Downloads/DAS CRM/android`

Built with **React Native 0.86** and **Expo SDK 57**, styled with **NativeWind v4**, providing full offline capabilities and native hardware integration for field teams.

### Expo SDK 57 & Native Device APIs
- **`expo-location`**: Captures high-accuracy GPS coordinates for geofenced attendance punches.
- **`expo-camera`**: Document scanning for employee KYC uploads and expense receipts.
- **`expo-notifications`**: Pushes 5-minute prior reminders for scheduled sales calls and lead allocation alerts.
- **`expo-print` & `expo-sharing`**: Generates and prints multi-page PDF quotations and invoices directly from mobile devices.
- **`@react-native-async-storage/async-storage`**: Persists local authentication tokens, offline queues, and theme preferences.

### Screens & Navigation Directory

The mobile app employs a hybrid navigation structure with bottom tabs and modal stacks:

| Screen Name | Path | Description & Hardware Integration |
| :--- | :--- | :--- |
| `LoginScreen` | `src/screens/LoginScreen.tsx` | Mobile/Email credentials, tenant domain selector, token persistence. |
| `AdminDashboardScreen` | `src/screens/AdminDashboardScreen.tsx` | High-level company revenue KPIs, active sales reps, system health. |
| `ManagerDashboardScreen`| `src/screens/ManagerDashboardScreen.tsx`| Department conversion targets, rep leaderboard, deal pipeline summary. |
| `HRDashboardScreen` | `src/screens/HRDashboardScreen.tsx` | Today's punch telemetry, late arrival list, pending leave requests. |
| `TeamLeaderDashboardScreen`| `src/screens/TeamLeaderDashboardScreen.tsx`| Team unit quotas, daily call logs, speed-claim queue status. |
| `EmployeeDashboardScreen` | `src/screens/EmployeeDashboardScreen.tsx` | Personal lead queue, scheduled tasks, 5-min prior call alerts. |
| `LeadsScreen` | `src/screens/LeadsScreen.tsx` | Filterable lead list, status badges, one-tap Phone Call and WhatsApp triggers. |
| `LeadDetailScreen` | `src/screens/LeadDetailScreen.tsx` | Lead activity timeline, call logs, note additions, stage updates. |
| `AttendanceScreen` | `src/screens/AttendanceScreen.tsx` | **GPS Geofenced punch-in/out, live shift timer, punch history.** |
| `QuotationsInvoicesScreen`| `src/screens/QuotationsInvoicesScreen.tsx`| PDF quotation generator, discount calculator, native print/share. |
| `DealsPipelineScreen` | `src/screens/DealsPipelineScreen.tsx` | Mobile Kanban deal stages with touch-friendly stage progression. |
| `WhatsAppTemplatesScreen`| `src/screens/WhatsAppTemplatesScreen.tsx`| Fast message dispatch with placeholder injection (`{{name}}`). |
| `AIHubScreen` | `src/screens/AIHubScreen.tsx` | AI lead scoring assistant and suggested conversational talking points. |

### In-App APK Auto-Update Launcher
The Android app includes a built-in over-the-air (OTA) version verification engine (`App.tsx`):
- Checks current version (`v2.4.1`) against the latest release (`v2.5.0`).
- Displays an animated modal showcasing changelog highlights.
- Downloads the new APK package directly with real-time progress indicators and triggers native Android package installation.

---

## 9. Cross-Platform Feature Parity Matrix

| Feature Module | Android App (`android`) | Frontend Web (`frontend-web`) | SuperAdmin Web (`superadmin-web`) |
| :--- | :---: | :---: | :---: |
| **Strict 2-Way Theme (Dark / Light)** | ✅ NativeWind + AsyncStorage | ✅ Tailwind v4 + localStorage | ✅ Tailwind v4 + localStorage |
| **5-Role Dynamic Dashboard Dispatcher** | ✅ Role-based screens | ✅ Role-based routes | N/A (SuperAdmin Role) |
| **Lead Ingestion & Management** | ✅ Mobile List & Fast Actions | ✅ Advanced Table & Filters | ✅ Cross-Tenant Telemetry |
| **3-Tier Lead Funnel Distribution** | ✅ Speed Claim from Grab Pool | ✅ Batch Quota & Grab Pool | ✅ Global Funnel Defaults |
| **Geofenced GPS Attendance Punch** | ✅ Hardware GPS Verified | ✅ Punch Audit Log & Map | N/A |
| **5-Min Prior Task Notifications** | ✅ Native Push & Banners | ✅ Topbar Popover Center | N/A |
| **Quotation & PDF Invoice Engine** | ✅ Native Print & Share | ✅ A4 PDF Document Builder | N/A |
| **Interactive Kanban Deals Pipeline** | ✅ Mobile Stage Selector | ✅ Drag-and-Drop Kanban | N/A |
| **6-Month Auto-Purge Telemetry** | N/A | ✅ Audit Log History | ✅ Live Telemetry & Manual Trigger |
| **Verified Document Exemption Shield** | ✅ Camera KYC Upload | ✅ KYC Verification Hub | ✅ Exemption Guarantees |
| **Company Registration Key Engine** | N/A (Consumes Keys) | ✅ Registration Portal | ✅ Key Generator & License Manager |
| **In-App APK Auto-Update Engine** | ✅ Version Checker & Installer| ✅ Downloads Center Page | N/A |

---

## 10. Local Development, Environment Variables & Build Guide

### Prerequisites
- **Node.js**: `v18.18.0` or higher
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: Local instance or Supabase cloud instance
- **Redis**: Local or cloud instance (optional for dev)
- **Expo CLI**: `npm install -g expo-cli` (for Android development)

---

### Environment Variables Setup

#### Backend (`backend/.env`)
```env
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"

# PostgreSQL Connections
DATABASE_URL="postgresql://user:password@localhost:5432/das_crm?pgbouncer=true"
DIRECT_URL="postgresql://user:password@localhost:5432/das_crm"

# Redis Cache
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="your-256-bit-secret-key-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-token-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Google Drive Storage Vault
GOOGLE_PROJECT_ID="das-crm-drive"
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@das-crm.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_KEY_FILE="service-account.json"
GOOGLE_DRIVE_FOLDER_ID="das_crm_storage_hub"
```

#### Frontend Web (`frontend-web/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

#### SuperAdmin Web (`superadmin-web/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

---

### Starting All Services Locally

Open 4 terminal windows and run the respective service:

```bash
# Terminal 1: Backend API Engine (Port 3001)
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev

# Terminal 2: Frontend Web Application (Port 3000)
cd frontend-web
npm install
npm run dev

# Terminal 3: SuperAdmin Overlord Portal (Port 3002)
cd superadmin-web
npm install
npm run dev

# Terminal 4: Android Mobile App (Expo Metro Server)
cd android
npm install
npx expo start
```

---

### Production Verification & Build Commands

```bash
# 1. Compile & Build Backend
cd backend && npm run build

# 2. Compile & Build Frontend Web (Next.js 16 Production Bundle)
cd frontend-web && npm run build

# 3. Compile & Build SuperAdmin Web (Next.js 15 Production Bundle)
cd superadmin-web && npm run build

# 4. TypeScript Type-Check Android Mobile App
cd android && npx tsc --noEmit
```

---

*Documentation compiled, audited, and verified for the DAS CRM Enterprise Ecosystem v2.5.0.*
