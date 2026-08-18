# Security Policy

## Supported Versions

The following versions of DAS CRM are currently receiving security updates:

| Version | Supported |
|---------|-----------|
| `main` (latest) | ✅ Actively supported |
| Older branches | ❌ Not supported |

---

## Reporting a Vulnerability

**⚠️ Please do NOT report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability in DAS CRM — including but not limited to:

- Authentication or authorization bypass
- JWT token forgery or leakage
- Multi-tenant data isolation breach (cross-tenant data access)
- SQL injection or Prisma ORM exploit
- Exposed API keys or secrets in code
- CORS misconfiguration
- Sensitive data exposure in API responses
- SSRF, XSS, CSRF vulnerabilities
- Android app storage/keystore vulnerabilities

Please report it **privately** by emailing:

**📧 [adtyamighty@gmail.com](mailto:adtyamighty@gmail.com)**

### What to include in your report

1. **Description** of the vulnerability and its potential impact
2. **Affected component** (frontend-web / backend / android / superadmin-web)
3. **Steps to reproduce** (proof of concept if possible)
4. **Affected endpoint or file path**
5. **Your suggested fix** (optional but appreciated)

---

## Response Timeline

| Step | Timeline |
|------|----------|
| Acknowledgement of report | Within **48 hours** |
| Initial assessment | Within **5 business days** |
| Fix development & testing | Within **14 days** (critical) / **30 days** (moderate) |
| Patch release & disclosure | After fix is confirmed stable |

---

## Security Architecture Notes

DAS CRM implements the following security controls. Please include details of how these were bypassed in your report:

### Authentication
- JWT Bearer tokens with configurable expiry (default: 24h)
- SuperAdmin access protected by OTP-over-email (not just password)
- Company Key + credential validation enforced on all workspace logins
- Google OAuth requires Company Key pre-validation (not open OAuth)

### Multi-Tenant Isolation
- All database queries are scoped by `organizationId` at the Prisma/NestJS guard layer
- No cross-tenant data access is permitted regardless of role

### Authorization (RBAC)
- Role hierarchy: `SUPER_ADMIN > ADMIN > MANAGER > TEAM_LEADER > SALES_EXEC / HR`
- Record-scope guards enforce `OWN`, `TEAM`, or `ALL` data visibility per role
- Role transition lock: 24-hour cooldown enforced server-side

### API Security
- Rate limiting on all auth endpoints
- All request bodies validated with `class-validator` DTOs
- Internal error details never exposed in API responses

### Android App
- Session tokens stored in `expo-secure-store` (device keystore)
- No sensitive data stored in `AsyncStorage`

---

## Disclosure Policy

We follow **responsible disclosure**:
- We will work with you to understand and resolve the issue
- We ask that you give us a reasonable time to patch before any public disclosure
- We will credit you in the release notes (unless you prefer to remain anonymous)

---

## Bug Bounty

DAS CRM does not currently operate a formal bug bounty program, but we deeply appreciate responsible disclosures and will acknowledge all valid security reports publicly (with your permission).

---

*Thank you for helping keep DAS CRM and its users safe. 🔐*
