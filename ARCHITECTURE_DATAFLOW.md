# DAS CRM Architecture & Dataflow Documentation

## Overview
This document outlines the authoritative data consistency pipeline, tenant isolation, cache strategy, and realtime event propagation architecture for DAS CRM.

---

## 1. Authoritative Data Consistency Pipeline

```
USER ACTION (Form / Drag & Drop / Bulk Allocation)
    ↓
FRONTEND COMMAND (apiClient / apiFetch)
    ↓
API / BACKEND GATEWAY (/api/v1/leads, /api/v1/leads/status, etc.)
    ↓
AUTHENTICATION & RBAC VALIDATION (JWT Bearer Token verification, role scoping)
    ↓
DATABASE TRANSACTION (Prisma Client)
    ↓
POSTGRESQL (Sole Authoritative Source of Truth)
    ↓
DOMAIN EVENT PUBLISHING (RealtimeService / Outbox)
    ↓
REALTIME EVENT STREAM (Server-Sent Events / SSE)
    ↓
AUTHORIZED TARGET CLIENTS (Filtered by Organization ID & Hierarchy Scope)
    ↓
PATCH VISIBLE CLIENT CACHE IMMEDIATELY
    ↓
MARK RELATED QUERIES STALE & BACKGROUND REFETCH
    ↓
RECONCILE CACHE WITH POSTGRESQL STATE
    ↓
REACT UI RERENDERS
```

---

## 2. Token Lifecycle & Automatic Refresh Strategy

1. **Access Token Lifespan:** 15 minutes (`JWT_EXPIRES_IN="15m"`).
2. **Refresh Token Lifespan:** 7 days (`JWT_REFRESH_EXPIRES_IN="7d"`).
3. **Automatic Interception:**
   When any API call returns `401 Unauthorized`, the client-side `apiFetch` wrapper transparently requests `POST /api/v1/auth/refresh` using the stored refresh token.
4. **Cache Protection:**
   Under NO circumstances does a failed network call or 401 response overwrite existing cached leads with an empty array `[]`. Cached data is preserved while reconnection or re-authentication takes place.

---

## 3. Realtime Domain Events & Payload Structure

### Lead Created (`lead.created`)
```json
{
  "event": "lead.created",
  "organizationId": "cmuev7n3o000mikew7je1tdiw",
  "leadId": "cmuojhcjd0009ikm4x926jy1e",
  "name": "Arjun Reddy",
  "ownerId": "cmukv4tgl000n7d2d65001ydp",
  "status": "New",
  "timestamp": "2026-10-03T03:30:00.000Z"
}
```

### Lead Status Changed (`lead.status_changed`)
```json
{
  "event": "lead.status_changed",
  "organizationId": "cmuev7n3o000mikew7je1tdiw",
  "leadId": "cmuojhcjd0009ikm4x926jy1e",
  "oldStatus": "New",
  "newStatus": "Contacted",
  "updatedById": "cmukv4tgl000n7d2d65001ydp",
  "timestamp": "2026-10-03T03:30:00.000Z"
}
```

### Lead Allocated / Reassigned (`lead.allocated`)
```json
{
  "event": "lead.allocated",
  "organizationId": "cmuev7n3o000mikew7je1tdiw",
  "leadId": "cmuojhcjd0009ikm4x926jy1e",
  "fromUserId": "cmuev7ni70016ikew8an7tdw8",
  "toUserId": "cmukv4tgl000n7d2d65001ydp",
  "toUserName": "Sachin Puri",
  "toRole": "TEAM_LEADER",
  "timestamp": "2026-10-03T03:30:00.000Z"
}
```

---

## 4. Multi-Tenant & RBAC Isolation

- **Organization Scoping:** All database queries require `where: { organizationId }`. Realtime streams only receive events matching the user's `organizationId`.
- **Role Hierarchy Scoping:**
  - `ADMIN` / `SUPER_ADMIN` / `MANAGER` / `OWNER`: Organization-wide view.
  - `TEAM_LEADER`: Leads assigned to themselves, unassigned leads, or leads assigned to downstream sales executives reporting to their team.
  - `SALES_EXEC`: Leads assigned to their own user ID or unassigned leads.
