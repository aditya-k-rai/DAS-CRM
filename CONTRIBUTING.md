# Contributing to DAS CRM

Thank you for your interest in contributing to **DAS CRM** — an enterprise-grade, multi-tenant SaaS CRM platform! 🎉

We welcome contributions of all kinds: bug reports, feature suggestions, documentation improvements, and code changes.

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Setup](#development-setup)
4. [Branch Strategy](#branch-strategy)
5. [Commit Convention](#commit-convention)
6. [Pull Request Process](#pull-request-process)
7. [Code Style Guidelines](#code-style-guidelines)
8. [Reporting Bugs](#reporting-bugs)
9. [Suggesting Features](#suggesting-features)

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/DAS-CRM.git
   cd DAS-CRM
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/aditya-k-rai/DAS-CRM.git
   ```

---

## Project Structure

```
DAS-CRM/
├── frontend-web/       # Next.js 16 (App Router) — Tenant dashboards & CRM portal
├── superadmin-web/     # Next.js 16 — SuperAdmin control plane
├── backend/            # NestJS + Prisma ORM + PostgreSQL API
├── android/            # Expo / React Native — Android field app
└── .github/            # CI/CD workflows & community files
```

---

## Development Setup

### Prerequisites
- **Node.js** 20+
- **pnpm** or **npm**
- **PostgreSQL** 15+
- **Expo CLI** (for Android development)

### Frontend Web
```bash
cd frontend-web
npm install
cp .env.example .env.local     # Configure your API URL
npm run dev                    # Runs on http://localhost:3000
```

### Backend (NestJS)
```bash
cd backend
npm install
cp .env.example .env           # Configure DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate dev         # Run database migrations
npm run start:dev              # Runs on http://localhost:3001
```

### Android App
```bash
cd android
npm install
cp .env.example .env
npx expo start                 # Start Expo dev server
```

### SuperAdmin Web
```bash
cd superadmin-web
npm install
npm run dev                    # Runs on http://localhost:3002
```

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch for features |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Maintenance, deps, config |
| `docs/<name>` | Documentation only |

Always branch off `develop` (or `main` for hotfixes):
```bash
git checkout develop
git pull upstream develop
git checkout -b feat/my-feature
```

---

## Commit Convention

We follow **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates |
| `perf` | Performance improvements |

### Scope Examples
`android`, `frontend-web`, `backend`, `superadmin`, `auth`, `leads`, `hr`, `billing`

### Examples
```
feat(android): add HR dashboard with attendance and leave queue
fix(backend): resolve JWT token expiry on role transition
docs(readme): update quick start guide for Android setup
chore(frontend-web): upgrade Next.js to 16.3
```

---

## Pull Request Process

1. **Ensure** all tests pass and TypeScript compiles with `0 errors`
2. **Update** documentation if your change affects the public API or user workflow
3. **Write** a clear PR description:
   - What problem does this solve?
   - How was it tested?
   - Any breaking changes?
4. **Link** related issues: `Closes #123`
5. **Request review** from at least one maintainer
6. PRs require **1 approval** before merging to `develop`
7. PRs to `main` require **maintainer approval** only

### PR Title Format
```
feat(scope): short description of the change
```

---

## Code Style Guidelines

### TypeScript / React
- Use **TypeScript** strictly — no `any` unless absolutely unavoidable
- Use **functional components** with hooks
- Name components in **PascalCase**, files in **camelCase**
- Prefer named exports over default exports for components (except Next.js pages)
- Keep components focused — single responsibility

### Backend (NestJS)
- Follow NestJS module structure: `controller → service → repository`
- Use **DTOs** with `class-validator` for all request bodies
- All database queries must be **tenant-scoped** (`organizationId` guard)
- Never expose internal error details in API responses

### Android (React Native / Expo)
- Use `StyleSheet.create()` for all styles — no inline style objects
- Use **Zustand** (`authStore`) for global auth state, not prop drilling
- Use React Navigation's `useNavigation()` / `useRoute()` hooks — never pass `navigation` as a prop

### Styling
- Frontend-web uses **Tailwind CSS** — follow existing `globals.css` tokens
- Android uses `StyleSheet.create()` — match the dark theme color palette (`#060810`, `#0f172a`, etc.)

---

## Reporting Bugs

Use the **GitHub Issues** tab and include:

- **Environment** (OS, Node version, browser/device)
- **Steps to reproduce** (numbered, minimal)
- **Expected behavior**
- **Actual behavior** (screenshots/logs if possible)
- **Which app** is affected (frontend-web / backend / android / superadmin)

---

## Suggesting Features

Open a **GitHub Issue** with the `enhancement` label and describe:

- **The problem** you're trying to solve
- **Your proposed solution**
- **Alternatives considered**
- **Which module** it belongs to (auth, leads, HR, billing, etc.)

---

## Questions?

Open a **GitHub Discussion** or email the maintainer at [adtyamighty@gmail.com](mailto:adtyamighty@gmail.com).

---

*Thank you for helping make DAS CRM better! 🚀*
