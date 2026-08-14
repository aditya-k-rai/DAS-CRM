# Super Admin Standalone Web Portal (`superadmin-web`)

Standalone Next.js application dedicated exclusively to the Super Admin System Overlord Portal for multi-domain deployment.

---

## 🚀 Independent Deployment Setup

### Option 1: Deploy on Vercel
1. In Vercel, click **New Project** and import the repository.
2. Set **Root Directory** to `superadmin-web`.
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-api-url.com/api/v1`
4. Connect custom domain (e.g., `admin.nexcrm.app` or `das-crm-superadmin.vercel.app`).

### Option 2: Local Development
```bash
cd superadmin-web
npm install
npm run dev
```
Access the portal at `http://localhost:3002`.
