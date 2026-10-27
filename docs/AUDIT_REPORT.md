# Insertix Media — Final Pre-Launch Audit & Verification Report

**Date**: October 28, 2026  
**Local Test URL**: [http://localhost:3000](http://localhost:3000)  
**Admin Command Center**: [http://localhost:3000/admin](http://localhost:3000/admin)  
**Production Build Status**: ✅ Passed (`next build` - 0 errors)  
**Security Status**: ✅ Clean (`npm audit` - 0 vulnerabilities)

---

## 1. Admin Tabs vs Actions Verification Matrix

| Admin Tab | Add | Edit | Delete | Reorder (Up/Down) | Publish / Hide | Live Sync on Main Page |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Projects (Work & Recent Work)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Specialists (Members)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Testimonials (Partners)** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **Site Settings (Hero, Stats, Info)** | N/A *(Singleton)* | **PASS** | N/A | **PASS** *(Stats/Services)* | **PASS** | **PASS** |
| **Inquiries (Leads)** | N/A *(User-submitted)* | **PASS** *(Read status)* | **PASS** | N/A | N/A | **PASS** *(New Badge)* |

---

## 2. API Routes Inventory (Path, Method, Auth & Validation)

| HTTP Method | API Path | Auth Required? | Input Validation & Protection |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/projects` | No *(Public: visible only)* | Whitelisted query parameters |
| `POST` | `/api/projects` | **Yes** *(Admin Bearer/Cookie)* | Schema validation & order calculation |
| `PUT` | `/api/projects/[id]` | **Yes** *(Admin Bearer/Cookie)* | Field whitelist update |
| `DELETE` | `/api/projects/[id]` | **Yes** *(Admin Bearer/Cookie)* | ID verification & order compaction |
| `GET` | `/api/team` | No *(Public: visible only)* | Whitelisted query parameters |
| `POST` | `/api/team` | **Yes** *(Admin Bearer/Cookie)* | Schema validation & order calculation |
| `PUT` | `/api/team/[id]` | **Yes** *(Admin Bearer/Cookie)* | Field whitelist update |
| `DELETE` | `/api/team/[id]` | **Yes** *(Admin Bearer/Cookie)* | ID verification & order compaction |
| `GET` | `/api/testimonials` | No *(Public: visible only)* | Whitelisted query parameters |
| `POST` | `/api/testimonials` | **Yes** *(Admin Bearer/Cookie)* | Schema validation & order calculation |
| `PUT` | `/api/testimonials/[id]` | **Yes** *(Admin Bearer/Cookie)* | Field whitelist update |
| `DELETE` | `/api/testimonials/[id]` | **Yes** *(Admin Bearer/Cookie)* | ID verification & order compaction |
| `GET` | `/api/settings` | No *(Public configuration)* | Safe fallback defaults |
| `PUT` | `/api/settings` | **Yes** *(Admin Bearer/Cookie)* | Zod `SiteSettingsUpdateSchema` |
| `POST` | `/api/upload` | **Yes** *(Admin Bearer/Cookie)* | MIME filter (`jpeg`,`png`,`webp`) + 5MB limit |
| `POST` | `/api/contact` | No *(Public inquiry)* | Zod + Rate limiting + Honeypot bot protection |
| `POST` | `/api/auth/login` | No *(Public)* | Zod + 10 tries/15 mins rate limiting |
| `POST` | `/api/auth/logout` | No *(Invalidates cookie)* | Cookie expiration |
| `GET` | `/api/auth/me` | **Yes** *(Admin Bearer/Cookie)* | Session verification |
| `GET` | `/api/admin/contacts` | **Yes** *(Admin Bearer/Cookie)* | Session verification |
| `PATCH` | `/api/admin/contacts/[id]` | **Yes** *(Admin Bearer/Cookie)* | Status whitelist validation |
| `DELETE` | `/api/admin/contacts/[id]` | **Yes** *(Admin Bearer/Cookie)* | ID verification |
| `GET` | `/api/admin/activity-logs` | **Yes** *(Admin Bearer/Cookie)* | Session verification |
| `POST` | `/api/admin/change-password` | **Yes** *(Admin Bearer/Cookie)* | Zod + bcrypt hash (cost: 12) |
| `GET` | `/api/events` | No *(Public SSE)* | Read-only live broadcast |
| `POST` | `/api/revalidate` | **Yes** *(Secret token header)* | Shared secret verification |

---

## 3. Security Findings & Fixes Summary

### Critical Severity
- **Unauthenticated Backend API Access**: Several routes previously relied on ambient cookie headers without parsing request tokens directly.  
  *Fix*: Enhanced `getAdminSession(req)` to check both HTTP-only cookies and Bearer tokens passed via headers. Protected `/api/upload`, `/api/settings`, `/api/admin/contacts`, `/api/admin/contacts/[id]`, and `/api/admin/activity-logs`. Unauthenticated attempts receive `401 Unauthorized`.
- **API Proxy Interception**: `next.config.ts` had a blanket rewrite that rerouted `/api/*` to `localhost:5000` if active.  
  *Fix*: Constrained rewrites to only run if `NEXT_PUBLIC_API_URL` points to an explicit remote domain (not localhost).

### High Severity
- **Unrestricted Media Upload**: `/api/upload` allowed files up to 8MB without strict MIME checks.  
  *Fix*: Added MIME filtering (`image/jpeg`, `image/png`, `image/webp`), lowered max file limit to 5MB, and ensured filenames are sanitized before WebP conversion via Sharp.
- **Login Brute-Force Vulnerability**: Login endpoint had no attempt limits.  
  *Fix*: Implemented IP sliding window rate-limiting limiting users to 10 login attempts per 15 minutes.
- **Spam Submissions on Public Contact Form**:  
  *Fix*: Integrated hidden bot honeypot (`website` field) and string length clamps in Zod.

### Medium Severity
- **Missing HTTP Security Headers**:  
  *Fix*: Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security` in `next.config.ts`.
- **Admin Indexing by Web Crawlers**:  
  *Fix*: Configured `robots: { index: false, follow: false }` on the admin layout and added `Disallow: /admin` in `public/robots.txt`.
- **Unsafe External Links**:  
  *Fix*: Verified all `target="_blank"` anchors across all components use `rel="noopener noreferrer"`.
- **Plain Object Boundary Violations**:  
  *Fix*: Sanitized all MongoDB BSON `ObjectId` and `Date` instances via `serialize()` before crossing Server Component to Client Component boundaries.

### Low Severity
- **Tracked Environment Variables**: Confirmed with `git ls-files` that `.env*` files are ignored by git. Updated `.env.example` with sanitized placeholder keys.
- **Dependency Vulnerabilities**: Executed `npm audit` — **0 vulnerabilities**.

---

## 4. Responsive & Typography Fixes

1. **Hero Stats Alignment**: Fixed horizontal centering on the stats container (`grid-cols-3 mx-auto justify-center text-center`) across all screen widths from 320px to 1920px.
2. **Responsive Headings**: Applied fluid font sizing (`clamp()`) to ensure hero and section headings do not break or cause horizontal scroll on 320px/375px screens.
3. **Typography Standard**: Verified fonts (`Inter`, `Playfair Display`, `Great Vibes`) load self-hosted through `next/font/google` with zero layout shift (`display: "swap"`).
4. **Touch Target Sizing**: Ensured all interactive elements, floating buttons (WhatsApp), and carousel arrows have minimum 44px tap targets.

---

## 5. Vercel Environment Variables & Setup Guide

### Required Vercel Environment Variables:
Add the following keys under **Vercel Dashboard -> Project Settings -> Environment Variables**:

| Variable Name | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `ADMIN_EMAIL` | Default admin login email address |
| `ADMIN_PASSWORD` | Secure password for initial admin login |
| `JWT_SECRET` | 32+ character random secret key for admin tokens |
| `NEXT_PUBLIC_SITE_URL` | Production website URL (`https://insertixmedia.com`) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Contact phone number with country code (e.g. `919876543210`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public email displayed on contact page |
| `ADMIN_NOTIFICATION_EMAIL` | Destination email address for receiving contact inquiries |
| `SMTP_HOST` | *(Optional)* SMTP mail server host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | *(Optional)* SMTP mail server port (e.g. `587`) |
| `SMTP_USER` | *(Optional)* SMTP sender account username |
| `SMTP_PASS` | *(Optional)* SMTP sender account app password |
| `IMAGEKIT_PUBLIC_KEY` | *(Optional)* ImageKit CDN public key |
| `IMAGEKIT_PRIVATE_KEY` | *(Optional)* ImageKit CDN private key |
| `IMAGEKIT_URL_ENDPOINT` | *(Optional)* ImageKit CDN URL endpoint |
| `REVALIDATE_SECRET` | *(Optional)* Secret token for ISR cache purging |

### Manual Configuration Checklist:
1. **MongoDB Atlas IP Allowlist**:
   - Go to **MongoDB Atlas** -> **Network Access** -> **IP Access List**.
   - Ensure `0.0.0.0/0` is added to allow Vercel's dynamic serverless IP pool to connect.
2. **ImageKit Allowed Domains**:
   - In ImageKit Dashboard -> **URL Endpoints**, add `https://insertixmedia.com` to the list of allowed origins.
3. **Custom Domain Setup**:
   - In Vercel -> **Domains**, verify DNS A record (`76.76.21.21`) or CNAME (`cname.vercel-dns.com`).

---

## 6. List of Modified Project Files

- `next.config.ts`
- `.env.example`
- `public/robots.txt`
- `data/db.json`
- `src/lib/auth.ts`
- `src/lib/db.ts`
- `src/lib/models.ts`
- `src/lib/serialize.ts`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/settings/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/team/route.ts`
- `src/app/api/team/[id]/route.ts`
- `src/app/api/testimonials/route.ts`
- `src/app/api/testimonials/[id]/route.ts`
- `src/app/api/admin/contacts/route.ts`
- `src/app/api/admin/contacts/[id]/route.ts`
- `src/app/api/admin/activity-logs/route.ts`
- `src/app/api/admin/change-password/route.ts`
- `src/components/sections/HeroSection.tsx`
- `src/components/sections/RecentWorkSection.tsx`
- `src/components/sections/TeamSection.tsx`
- `src/components/sections/TestimonialsSection.tsx`
- `src/components/ui/AvatarPlaceholder.tsx`
