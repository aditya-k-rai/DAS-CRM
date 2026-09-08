# 🚀 DAS CRM — Enterprise Multi-Platform Architecture & Technical Specification

Welcome to the comprehensive technical documentation for **DAS CRM** — a full-featured, multi-tenant Customer Relationship Management system spanning Mobile (Android via React Native/Expo) and Web (Frontend Web & SuperAdmin Portals via Next.js).

---

## 📐 Table of Contents

1. [Executive Summary & System Architecture](#-executive-summary--system-architecture)
2. [📱 App 1: Android Application (`android`)](#-app-1-android-application-android)
   - [Tech Stack & Native Capabilities](#tech-stack--native-capabilities)
   - [Complete Screens Directory](#complete-screens-directory)
   - [Navigation Architecture & Routing](#navigation-architecture--routing)
   - [Modals & Overlay System](#modals--overlay-system)
   - [State Management](#state-management)
3. [🌐 App 2: Frontend Web Application (`frontend-web`)](#-app-2-frontend-web-application-frontend-web)
   - [Tech Stack & Frameworks](#tech-stack--frameworks)
   - [Complete Routes Directory](#complete-routes-directory)
   - [UI Controls & Reusable Components](#ui-controls--reusable-components)
   - [State Management & Data Fetching](#state-management--data-fetching)
4. [👑 App 3: SuperAdmin Portal (`superadmin-web`)](#-app-3-superadmin-portal-superadmin-web)
   - [Purpose & Auth Engine](#purpose--auth-engine)
   - [Dashboard Controls & Operations](#dashboard-controls--operations)
   - [Tenant & Subscription Engine](#tenant--subscription-engine)
5. [⚡ Cross-Platform Feature Directory](#-cross-platform-feature-directory)
6. [⚠️ Security Vulnerabilities & Technical Debt Audit](#%EF%B8%8F-security-vulnerabilities--technical-debt-audit)
7. [🔌 Backend & API Integration Overview](#-backend--api-integration-overview)

---

## 📐 Executive Summary & System Architecture

DAS CRM is engineered as a three-tier software package designed for high-velocity sales organizations, field teams, and system administrators.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DAS CRM ECOSYSTEM                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
│   Android App     │         │   Frontend Web    │         │  SuperAdmin Web   │
│  (React Native /  │         │    (Next.js 16    │         │    (Next.js 15    │
│    Expo 57)       │         │    React 19)      │         │    React 19)      │
└───────────────────┘         └───────────────────┘         └───────────────────┘
   Field Sales & HR             Sales Reps & Admin            System Overlord &
  Geofence Punching             Pipeline Analytics            Tenant Management
```

### Role-Based Access Control (RBAC) Hierarchy

All applications enforce a strict 5-tier role hierarchy:
1. **ADMIN / TENANT_ADMIN**: Complete operational control over company tenant, user quotas, pipeline configuration, and attendance logs.
2. **MANAGER**: Oversees department teams, target allocation, deal stage approvals, and team analytics.
3. **HR / HR_MANAGER**: Manages staff directory, geofenced attendance punches, leave approvals, and payroll telemetry.
4. **TEAM_LEADER**: Controls unit lead allocations, representative performance, and team pipeline stages.
5. **EMPLOYEE / SALES_EXEC**: Field or desk sales representative handling personal leads, call logs, tasks, and deal closures.

---

## 📱 App 1: Android Application (`android`)

Location: `C:\Users\Mighty\Downloads\DAS CRM\android\`

### Tech Stack & Native Capabilities

- **Framework**: React Native `0.86.2` + Expo SDK `~57.0.12`
- **Navigation**: React Navigation v7 (`@react-navigation/bottom-tabs`, `@react-navigation/stack`)
- **State Management**: Zustand `^5.0.14` + React Context API
- **Styling & UI**: NativeWind `^4.2.6` (Tailwind CSS for React Native) + Custom `StyleSheet`
- **Native Device APIs**:
  - `expo-camera`: Receipt/document scanning & photo uploads
  - `expo-location`: Geofenced GPS attendance punch verification
  - `expo-notifications`: Real-time task reminders and 5-min prior call alerts
  - `expo-secure-store` & `@react-native-async-storage/async-storage`: Secure token & theme persistence
  - `expo-document-picker` & `expo-sharing`: File upload & invoice sharing
  - `expo-print`: Direct PDF catalog & receipt printing

---

### Complete Screens Directory

The Android app features 20+ purpose-built screens organized by role and feature set:

| Screen Name | Path | Access Roles | Key Features & Controls |
| :--- | :--- | :--- | :--- |
| **LoginScreen** | `src/screens/LoginScreen.tsx` | Public / Unauthenticated | Mobile/Email login, password toggle, domain selector, remember me, error alerts. |
| **AdminDashboardScreen** | `src/screens/AdminDashboardScreen.tsx` | ADMIN | High-level tenant KPIs, lead ingestion channels, system health, revenue cards. |
| **ManagerDashboardScreen** | `src/screens/ManagerDashboardScreen.tsx` | MANAGER | Department revenue telemetry, team targets, deal closure velocity, leaderboard. |
| **HRDashboardScreen** | `src/screens/HRDashboardScreen.tsx` | HR | Today's punch logs, late arrivals, active leave requests, pending payroll count. |
| **TeamLeaderDashboardScreen** | `src/screens/TeamLeaderDashboardScreen.tsx` | TEAM_LEADER | Unit quota distribution, representative call conversion stats, team queue. |
| **EmployeeDashboardScreen** | `src/screens/EmployeeDashboardScreen.tsx` | EMPLOYEE / SALES_EXEC | Daily call queue, pending tasks, lead pipeline status, individual targets. |
| **LeadsScreen** | `src/screens/LeadsScreen.tsx` | ALL | Filterable lead list, search, status pills (HOT/WARM/COLD), fast action buttons (Call/WhatsApp). |
| **LeadDetailScreen** | `src/screens/LeadDetailScreen.tsx` | ALL | Lead contact info, activity timeline, note addition, stage progress, call trigger. |
| **EmployeesScreen** | `src/screens/EmployeesScreen.tsx` | ADMIN, MANAGER, HR | Staff directory, role badges, active status toggle, department filter, unassigned list. |
| **AttendanceScreen** | `src/screens/AttendanceScreen.tsx` | ALL | GPS Geofence punch-in/out, live timer, punch history, leave application form. |
| **TasksScreen** | `src/screens/TasksScreen.tsx` | ALL | Scheduled tasks, 5-min prior alerts, priority markers, completion checkboxes. |
| **NotificationsScreen** | `src/screens/NotificationsScreen.tsx` | ALL | Push notification log, task alerts, lead assignment alerts, mark all as read. |
| **ProductsCatalogScreen** | `src/screens/ProductsCatalogScreen.tsx` | ALL | Product catalogue grid, price filter, direct WhatsApp quotation generator. |
| **MoreControlsScreen** | `src/screens/MoreControlsScreen.tsx` | ALL | Navigation launcher for specialized modules (Deals, Comms, Salary, Reports). |
| **WorkflowBuilderScreen** | `src/screens/WorkflowBuilderScreen.tsx` | ADMIN, MANAGER | Trigger-action workflow visual builder, rule toggles, automation triggers. |
| **DealsPipelineScreen** | `src/screens/DealsPipelineScreen.tsx` | ALL | Visual Kanban deal stages, drag-and-drop simulation, total value accumulator. |
| **QuotationInvoicesScreen** | `src/screens/QuotationsInvoicesScreen.tsx` | ALL | PDF invoice generator, discount selector, tax calculation, print/share trigger. |
| **ReportsAnalyticsScreen** | `src/screens/ReportsAnalyticsScreen.tsx` | ADMIN, MANAGER | Graphical performance charts, lead conversion metrics, rep velocity. |
| **AIHubScreen** | `src/screens/AIHubScreen.tsx` | ALL | AI lead scoring assistant, automated follow-up suggestions, chat interface. |
| **WhatsAppTemplatesScreen** | `src/screens/WhatsAppTemplatesScreen.tsx` | ALL | Pre-configured message templates, placeholder auto-fill ({{name}}, {{company}}). |

---

### Navigation Architecture & Routing

The app uses a hybrid navigation structure combining Bottom Tabs and Stack Navigators:

```
NavigationContainer (ref: navigationRef)
│
├── Unauthenticated State: LoginScreen
│
└── Authenticated State: MainTabNavigator (BottomTabBar)
    ├── Tab 1: "Home" ────────► RoleDashboardDispatcher
    │                            ├── ADMIN ────────► AdminDashboardScreen
    │                            ├── MANAGER ──────► ManagerDashboardScreen
    │                            ├── HR ───────────► HRDashboardScreen
    │                            ├── TEAM_LEADER ──► TeamLeaderDashboardScreen
    │                            └── EMPLOYEE ─────► EmployeeDashboardScreen
    │
    ├── Tab 2: "Leads" ───────► LeadsStackNavigator (Stack)
    │                            ├── LeadsList ────► LeadsScreen
    │                            └── LeadDetail ───► LeadDetailScreen
    │
    ├── Tab 3: "Employees" ───► EmployeesScreen
    │
    ├── Tab 4: "Menu" ────────► MoreControlsScreen (Launcher to sub-modules)
    │
    ├── Tab 5: "Attendance" ──► AttendanceScreen
    │
    └── Hidden Tab: ──────────► WorkflowBuilderScreen (Navigated explicitly)
```

---

### Modals & Overlay System

`App.tsx` manages a rich multi-modal state machine:
1. **Hamburger Drawer Modal**: Left-sliding animated panel (`Animated.Value`) with user avatar, profile quick link, and role-customized shortcut groups.
2. **Profile Modal**: Full-screen user details, credentials review, and logout trigger.
3. **Notifications Center Modal**: Real-time 5-min prior alerts, unread counts, fast-action direct phone call/WhatsApp launch.
4. **Products Catalog Modal**: In-app catalog browser with instant quotation builder.
5. **In-App APK Update Engine**: Built-in OTA version checker (`v2.4.1` vs `v2.5.0`), progress bar simulator, and direct APK package installer.
6. **ModernAlertModal**: Global animated popups replacing standard native alerts (`initModernAlertOverride()`).

---

### State Management

- **Authentication (`src/store/authStore.ts`)**: Managed via `zustand`. Tracks `token`, `currentUser`, `subscription`, role helper normalizer (`normalizeRoleStr`), and logout handler.
- **Theme (`src/context/ThemeContext.tsx`)**: 3-way theme state (`'light' | 'dark' | 'system'`). Automatically detects OS preference changes via `useColorScheme()`, persists choice to `AsyncStorage` (`das_crm_theme`), and supplies values via `useTheme()`.

---

## 🌐 App 2: Frontend Web Application (`frontend-web`)

Location: `C:\Users\Mighty\Downloads\DAS CRM\frontend-web\`

### Tech Stack & Frameworks

- **Framework**: Next.js `15` / App Router + React `19`
- **Styling**: Tailwind CSS v4 + `lucide-react` icons + Custom CSS custom properties
- **Components**: Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tabs`)
- **Data Visualization**: `recharts` (AreaChart, BarChart, PieChart, ResponsiveContainer)
- **Data Fetching**: `@tanstack/react-query` v5

---

### Complete Routes Directory

The Next.js App Router enforces the following complete route hierarchy:

| Route Path | File Location | Purpose & Functionality |
| :--- | :--- | :--- |
| `/` | `app/page.tsx` | Root landing / Redirect dispatcher to `/dashboard` or `/login`. |
| `/login` | `app/login/page.tsx` | Standard user authentication portal with JWT handling. |
| `/register` | `app/register/page.tsx` | Tenant registration page with company key validation. |
| `/dashboard` | `app/dashboard/page.tsx` | Main Executive Dashboard with KPI summary cards. |
| `/dashboard/hr` | `app/dashboard/hr/page.tsx` | Specialized HR telemetry dashboard. |
| `/dashboard/manager` | `app/dashboard/manager/page.tsx` | Department Manager revenue & team target board. |
| `/dashboard/sales` | `app/dashboard/sales/page.tsx` | Sales Executive daily activity & lead tracker. |
| `/dashboard/team-leader`| `app/dashboard/team-leader/page.tsx`| Team Leader unit queue & conversion performance. |
| `/leads` | `app/leads/page.tsx` | Comprehensive Lead Management Table with search & filters. |
| `/leads/[id]` | `app/leads/[id]/page.tsx` | Dynamic Lead Detail view with full interaction history. |
| `/contacts` | `app/contacts/page.tsx` | Organization Contact Directory. |
| `/companies` | `app/companies/page.tsx` | B2B Account / Company Account Registry. |
| `/deals` | `app/deals/page.tsx` | Interactive Kanban Deal Pipeline with stage progression. |
| `/pipeline` | `app/pipeline/page.tsx` | Funnel conversion stage visualizer. |
| `/tasks` | `app/tasks/page.tsx` | Task scheduler with priority markers & notifications. |
| `/attendance` | `app/attendance/page.tsx` | Employee Attendance Audit & Punch log viewer. |
| `/hr` | `app/hr/page.tsx` | HR Control Panel for workforce management. |
| `/hr/attendance` | `app/hr/attendance/page.tsx` | Attendance telemetry & geofence punch logs. |
| `/hr/employees` | `app/hr/employees/page.tsx` | Full Employee Roster & Role Assignment. |
| `/hr/interviews` | `app/hr/interviews/page.tsx` | Candidate recruitment & interview schedule tracking. |
| `/hr/leaves` | `app/hr/leaves/page.tsx` | Employee Leave Application approval pipeline. |
| `/hr/salary` | `app/hr/salary/page.tsx` | Payroll, overtime, and salary distribution board. |
| `/products` | `app/products/page.tsx` | Product & Service Catalogue with price controls. |
| `/pdf-catalogue` | `app/pdf-catalogue/page.tsx` | PDF Brochure generator & download center. |
| `/quotes` | `app/quotes/page.tsx` | Quotation and Estimate Builder. |
| `/billing` | `app/billing/page.tsx` | Subscription Plan Manager & Razorpay payment integration. |
| `/automations` | `app/automations/page.tsx` | Automated Lead Allocation & Email/WhatsApp trigger rules. |
| `/communicate` | `app/communicate/page.tsx` | Multi-Channel Communication Center (SMS/Email/WhatsApp). |
| `/comms` | `app/comms/page.tsx` | Simplified Team Communication Hub. |
| `/whatsapp-templates` | `app/whatsapp-templates/page.tsx` | WhatsApp Cloud API message template manager. |
| `/emails` | `app/emails/page.tsx` | Email Marketing Campaign Dispatcher. |
| `/reports` | `app/reports/page.tsx` | Advanced Analytics & Export Engine. |
| `/goals` | `app/goals/page.tsx` | Sales Target & Goal Setting module. |
| `/imports` | `app/imports/page.tsx` | Excel / CSV Bulk Ingestion wizard. |
| `/onboarding` | `app/onboarding/page.tsx` | New Tenant Setup Wizard. |
| `/downloads` | `app/downloads/page.tsx` | Direct downloads for Android APK & Mac desktop apps. |
| `/settings` | `app/settings/page.tsx` | Organization & General Settings. |
| `/settings/profile` | `app/settings/profile/page.tsx` | User Account Profile & Security Settings. |
| `/settings/team` | `app/settings/team/page.tsx` | Team Member Invitations & Role Controls. |
| `/settings/billing` | `app/settings/billing/page.tsx` | Billing History & Invoices. |

---

### UI Controls & Reusable Components

The web application includes custom components in `components/`:

- **Topbar (`components/layout/Topbar.tsx`)**: Responsive top navigation bar featuring hamburger sidebar collapse button, title heading, quick command palette search trigger (`⌘K`), page action slot, 3-way `ThemeToggle`, mobile app downloads link, and `NotificationCenter`.
- **Sidebar (`components/layout/Sidebar.tsx`)**: Collapsible navigation drawer supporting nested sub-menus, role-based link filtering, active path indicators, and user account switcher.
- **ThemeToggle (`components/common/ThemeToggle.tsx`)**: 3-way segmented control (Light / System / Dark) with active pill animation and icon indicators.
- **NotificationCenter (`components/layout/NotificationCenter.tsx`)**: Popover dropdown displaying unread alerts with quick action buttons.
- **CommandPalette (`components/layout/CommandPalette.tsx`)**: Global modal search box (`⌘K`) for instant access to leads, contacts, deals, and pages.

---

### State Management & Data Fetching

- **Theme Context (`context/ThemeContext.tsx`)**: Supplies `'light' | 'dark' | 'system'` state, listens to OS color scheme changes via `matchMedia`, persists preference to `localStorage['das_crm_theme']`, and synchronizes with an anti-FOWT script in `app/layout.tsx`.
- **Sidebar Context (`context/SidebarContext.tsx`)**: Controls desktop collapsed state and mobile overlay drawer visibility.

---

## 👑 App 3: SuperAdmin Portal (`superadmin-web`)

Location: `C:\Users\Mighty\Downloads\DAS CRM\superadmin-web\`

### Purpose & Auth Engine

The SuperAdmin web portal is an administrative management platform designed for multi-tenant control, company key generation, license management, and platform analytics.

- **Authentication (`app/page.tsx`)**: 2-Step Authentication system combining Admin Email + Password with a **6-Digit Email OTP** verification engine.
- **Bypass / Fallback Feature**: Includes an automatic developer bypass mode if the backend API fails to reach the OTP service, ensuring system access during offline maintenance.

---

### Dashboard Controls & Operations

The core dashboard (`components/SuperAdminDashboard.tsx`) features:

1. **Top KPI Oval Cards**:
   - Number of Tenant Companies & Total Users
   - Active Companies & Users
   - Active Free Trials vs. Paid Plans
   - Expired Subscription Counter (interactive filter tab)
2. **Main Section Tabs**:
   - **Keys & Their Companies Table**: Overview of all generated registration keys, allocated seats, validity periods, and associated tenant admins.
   - **Plan Expired Companies**: Filtered view of tenants whose subscription dates have elapsed, featuring 1-click **"+30 Days Extension"** buttons.
   - **System Templates Hub**: Master manager for default system funnels, WhatsApp onboarding templates, and OTP dispatch emails.
   - **WhatsApp Cloud Uses & Logs**: Daily usage charts, delivery success rates, and API call logs across all tenants.
   - **Pending Upgrade Approvals**: Razorpay payment verification queue for subscription upgrade requests.
   - **Companies & Their Employees**: Full cross-tenant user directory with account status toggles (`ACTIVE` / `DISABLED`).

---

### Tenant & Subscription Engine

SuperAdmin controls the entire lifecycle of tenant keys and subscriptions:
- **Company Key Generation (`KeyRecord`)**: Generates structured keys (e.g., `ACME-KX-7421`) bound to a plan tier (`FREE_TRIAL`, `GROWTH`, `BUSINESS`, `ENTERPRISE`), seat limit, and validity period.
- **Live Expiry Auditor**: Automatically calculates remaining trial days and flags accounts as `isExpired` when the calendar date passes.

---

## ⚡ Cross-Platform Feature Directory

| Feature Module | Android App | Frontend Web | SuperAdmin Web |
| :--- | :---: | :---: | :---: |
| **3-Way Dark/Light/System Theme** | ✅ NativeWind + AsyncStorage | ✅ Tailwind v4 + localStorage | ✅ Tailwind v4 + localStorage |
| **5-Role Dashboard Dispatcher** | ✅ Role-based screens | ✅ Role-based pages | N/A (SuperAdmin Role Only) |
| **Lead Ingestion & Management** | ✅ Mobile List & Detail | ✅ Table View & Filter | ✅ Cross-Tenant Telemetry |
| **Geofenced Attendance Punch** | ✅ Location GPS Verified | ✅ Punch Audit Log | N/A |
| **5-Min Prior Task Notifications**| ✅ Push Alerts + Banner | ✅ Topbar Popover | N/A |
| **WhatsApp Quotation Generator** | ✅ Direct App Link | ✅ Template Builder | ✅ Master Template Hub |
| **PDF Invoice & Catalogue Engine**| ✅ Native Print & Share | ✅ Web PDF Renderer | N/A |
| **Kanban Deals Pipeline** | ✅ Mobile Kanban View | ✅ Interactive Web Kanban | N/A |
| **Company Registration Key Engine**| N/A (Consumes Keys) | ✅ Registration Form | ✅ Master Key Generator |
| **In-App APK Update Launcher** | ✅ Full Engine (`v2.5.0`) | ✅ App Download Page | N/A |

---

## ⚠️ Security Vulnerabilities & Technical Debt Audit

During code analysis, the following technical debt items and security considerations were identified:

### Critical Security Findings

1. **SuperAdmin OTP API Fallback Bypass (`superadmin-web/components/SuperAdminAuthModal.tsx`)**:
   - *Observation*: If the backend OTP endpoint returns a non-200 status code, the authentication modal falls back to auto-verifying the OTP code locally (`isDevBypass = true`) to allow developer login.
   - *Recommendation*: Remove hardcoded bypass logic before deploying to production environments. Require valid backend OTP signatures.

2. **Hardcoded Fallback Email Credentials**:
   - *Observation*: Default emails like `dynamicadvancesolution@gmail.com` and demo tokens are hardcoded as fallbacks across multiple screens.
   - *Recommendation*: Move all fallback credentials to strict environment variables (`.env.local`).

3. **Storage of Sensitive JWT Tokens**:
   - *Observation*: `localStorage` is used directly on Web apps without token encryption.
   - *Recommendation*: Implement `httpOnly` secure cookies for Next.js web portals to protect against XSS token extraction.

---

## 🔌 Backend & API Integration Overview

All three applications communicate with the central DAS CRM RESTful API service.

- **Base API Endpoint**: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'`
- **Authentication Protocol**: Bearer Token Authorization (`Authorization: Bearer <token>`)

### Core API Endpoint Groups

```
POST /api/v1/auth/login                  -> User login & JWT issuance
POST /api/v1/auth/register-with-key     -> Tenant registration via company key
GET  /api/v1/auth/super-admin/companies  -> (SuperAdmin) List all tenant companies
POST /api/v1/auth/generate-company-key   -> (SuperAdmin) Create new tenant key
GET  /api/v1/leads                       -> Fetch tenant lead list
POST /api/v1/leads                       -> Ingest new lead
GET  /api/v1/attendance/punch-status     -> Fetch today's punch state & geofence
POST /api/v1/attendance/punch-in         -> Submit geofenced location punch-in
```

---

## 🛡️ API Rate Limiting, Throttling & Security Policies

DAS CRM enforces multi-tier, endpoint-aware API Throttling via NestJS `@nestjs/throttler` to protect backend services against DDoS, credential-stuffing, SMS OTP toll-fraud, and database lockup during file parsing.

### 1. Subscription Plan Hourly Rate Limits

Rate limits are evaluated per authenticated `User ID` (or IP address for unauthenticated requests). When a user is logged in, their requests across both **Web** and **Android Mobile** share their account's tier quota seamlessly:

| Plan Tier | Hourly Request Limit | Equivalent Per Minute Rate | Target Use Case |
| :--- | :---: | :---: | :--- |
| **Free Trial / Starter** | **500 req / hour** | ~8 req / min | Basic evaluation & trial accounts |
| **Growth / Business** | **2,000 req / hour** | ~33 req / min | Active daily sales & team operations |
| **Pro Max / Enterprise** | **5,000 req / hour** | ~83 req / min | High-velocity pipelines & heavy automation |

---

### 2. Endpoint-Specific Protection Limits

Critical and sensitive API endpoints enforce targeted rate limits regardless of subscription tier:

| Endpoint Group | Target Endpoints | Hourly Limit | Security & Performance Rationale |
| :--- | :--- | :---: | :--- |
| **Auth & OTP** | `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`, `/api/v1/auth/super-admin/request-otp` | **15 req / hour** | Prevents SMS OTP toll-fraud, costs, and brute-force credential stuffing. |
| **Bulk Ingestion & CSV** | `/api/v1/imports/csv`, `/api/v1/imports/multi-format`, `/api/v1/drive/upload` | **40 req / hour** | Prevents database lockup & high CPU consumption during multi-row parsing. |
| **General Read & Write** | `/api/v1/leads`, `/api/v1/quotes`, `/api/v1/contacts`, `/api/v1/deals` | **1,000 req / hour** | Ensures smooth UI responsiveness across Web and Android for general sales operations. |

---

### 3. Technical Implementation Details

- **Guard**: [`CustomThrottlerGuard`](file:///c:/Users/Mighty/Downloads/DAS%20CRM/backend/src/common/guards/custom-throttler.guard.ts) in NestJS (`APP_GUARD`).
- **Tracking Mechanism**:
  - Authenticated Users: `user_<USER_ID>` (unified quota across Web and Mobile app).
  - Unauthenticated Users: `ip_<IP_ADDRESS>` (IP-based protection).

---

*Documentation compiled & verified for DAS CRM Ecosystem v2.5.0.*

