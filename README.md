# 🚀 NexCRM SaaS Monorepo Platform

Enterprise Multi-Tenant CRM SaaS platform built with Next.js 16, NestJS, Prisma ORM, and Expo React Native.

---

## 📁 Repository Structure

```
CRM/
├── backend/                  # NestJS + Prisma ORM API Backend Services
│   ├── prisma/               # Database Schema, Seeders & Migrations
│   └── src/modules/          # LeadFunnelService, TeamsService, HR, Auth
│
├── frontend-web/             # Next.js 16 Web Frontend App Router
│   ├── app/                  # Route Handlers & Role-Based Dashboards
│   ├── components/           # UI Components (3-Model Lead Funnels, HR Audit)
│   └── context/              # AuthContext & RBAC State Provider
│
├── android/                  # React Native + Expo Mobile Application
│   ├── app/                  # Mobile Screens & Dialer Interface
│   └── src/                  # WatermelonDB Offline Sync Engine
│
└── README.md                 # Project Overview & Deployment Guide
```

---

## 🌟 Core Platform Features

- **Dual-Entry Security Gateway**: Web-only Developer Control Plane (`SUPER_ADMIN`) vs. Multi-Tenant Workspace (`ADMIN`, `HR`, `MANAGER`, `TEAM_LEADER`, `SALES_EXEC`).
- **10-Channel Lead Ingestion**: Facebook Ads, Instagram Ads, Google Ads, SEO Organic, Web Form, WhatsApp Webhook, LinkedIn Leads, Manual Entry, Bulk CSV Import, and API Webhooks.
- **3 Lead Funnel Distribution Models**:
  1. **Model 1: Custom Batch Quota** (Leads 1-100 to Manager A, 101-200 to Manager B).
  2. **Model 2: Dynamic "Grab" Flow** (Anonymized Serial # Pool, First View/Mark Acquires Lead & Vanishes for others).
  3. **Model 3: Direct Admin Funnel** (Manual targeting by Tenant Admin).
- **Tenant Admin Exclusive Rights**: ONLY Tenant Admin is authorized to Create Team Leaders (TL) & Assign/Move Employees under Managers or TLs.
- **Hybrid Team Hierarchy**: Manager → Team Leader → Employee A, Manager → Employee B (Direct), Manager → Employee C (Direct Report - No TL).
- **Post-Call Logger Popup & HR Call Audit**: Automatic post-call outcome logging (Interested, Follow-up, No Answer), talk-time duration, and daily employee call analytics.
- **30-Day Free Trial & Expired View-Only Mode**: Automatic 30-day trial with WhatsApp & Email feature locks until upgraded to a paid plan.

---

## 🚀 Quick Local Setup

### 1. Start API Backend (`/backend`)
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run start:dev
```

### 2. Start Web Frontend (`/frontend-web`)
```bash
cd frontend-web
npm install
npm run dev
```

---

## 🌐 Production Deployment Platform Recommendations

| Component | Recommended Hosting Platform | Purpose |
| :--- | :--- | :--- |
| **Web Frontend (`frontend-web`)** | **Vercel** | Next.js Serverless Edge Deployment |
| **Backend API (`backend`)** | **Render** or **Railway** | Persistent Node.js/NestJS Server Container |
| **Database** | **Supabase** or **Neon Tech** | Managed Serverless PostgreSQL Database |
| **Mobile App (`android`)** | **Expo EAS Build** | Automated Android APK / AAB Bundle Compilation |
