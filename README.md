# ⚡ INSERTIX MEDIA — Award-Level 3D Creative Agency Platform

A complete, production-ready, award-caliber 3D website and full-stack management platform engineered for **INSERTIX MEDIA** (Digital media, creative, and performance agency).

---

## 🌟 Key Features

### 🎨 Creative Frontend & 3D Experience
- **Interactive Three.js WebGL Hero Scene**: Organic iridescent geometry (glossy distorted torus knot, orbiting satellite orbs, ambient particle cloud) reacting in real-time to pointer coordinates and scroll depth.
- **Persistent 3D Scroll Canvas**: Ambient starfield/geometry canvas subtly panning camera and color gradients as users explore sections.
- **3D Parallax Tilt Cards (`TiltCard`)**: Mouse-responsive 3D perspective tilt with radial spotlight glare on all service cards, team member portraits, and portfolio items.
- **Editorial Typography**: Styled with high-contrast Syne, Space Grotesk, and Inter fonts.
- **60fps Smooth Scroll**: Powered by Lenis for ultra-fluid kinetic scrolling.
- **Interactive Preloader**: Displays the Insertix Media logo with neon pulse and real-time progress counter.
- **Custom Follower Cursor**: Smooth trailing magnetic ring with hover scaling over interactive elements.
- **Direct WhatsApp Integrations**:
  - Navbar **"Contact Us"** highlighted CTA opens WhatsApp directly (`https://wa.me/...` with pre-filled greeting).
  - Floating bottom-right pulsing WhatsApp button on all pages.
- **Recent Work Filterable 3D Portfolio**: Filter projects by *All*, *Video*, *Branding*, *Social*, and *Web*, with hover video previews and full-screen detail case study modals.
- **Animated Metrics & Counters**: Live counting statistics for projects delivered, happy clients, years, and team members.
- **Client Brands Marquee**: Infinite smooth scrolling ticker of partner brands.

### 🛡️ Full-Stack Backend & Admin Suite
- **Flexible Dual Database Layer**: Built-in support for MongoDB via Mongoose and automatic persistent local JSON fallback (`data/db.json`) for instant zero-dependency execution.
- **Admin Dashboard (`/admin`)**:
  - Full CRUD for **Projects** (title, category, client, cover image, video preview, deliverables, metrics).
  - Full CRUD for **Team Members** (name, role, bio, avatar, social handles).
  - Full CRUD for **Testimonials** (client name, company, role, review, avatar, star rating).
  - **Inquiries Manager**: Review, inspect, and delete incoming contact form leads.
  - Built-in image upload endpoint (`/api/upload`) saving to `public/uploads/`.
- **JWT & Bcrypt Security**: Secure HTTP-only cookie-based authentication with `jose` and `bcryptjs`.
- **Zod Validation & Rate Limiting**: Server-side validation and sliding-window IP rate limiting on contact submissions.
- **Nodemailer Alerts**: Asynchronous admin email notifications for every project inquiry.

---

## 📁 Project Structure

```
insertix/
├── data/
│   └── db.json                   # Local persistent database
├── public/
│   ├── assets/                   # Brand logo & team portraits
│   ├── logo.jpeg                 # Official Insertix logo
│   ├── robots.txt                # SEO crawler directives
│   └── sitemap.xml               # Search engine index
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── login/page.tsx    # Admin login portal
│   │   │   └── page.tsx          # Full-featured Admin Dashboard
│   │   ├── api/
│   │   │   ├── admin/contacts/   # Admin inquiries endpoint
│   │   │   ├── auth/             # Login, logout, session routes
│   │   │   ├── contact/          # Validated contact form endpoint
│   │   │   ├── projects/         # Portfolio CRUD API
│   │   │   ├── team/             # Team CRUD API
│   │   │   ├── testimonials/     # Testimonials CRUD API
│   │   │   └── upload/           # Media upload handler
│   │   ├── globals.css           # Glassmorphism, glows, & tokens
│   │   ├── layout.tsx            # Root layout with SEO & Preloader
│   │   ├── not-found.tsx         # 3D 404 error page
│   │   └── page.tsx              # Main 3D single-page experience
│   ├── components/
│   │   ├── 3d/
│   │   │   ├── BackgroundCanvas.tsx # Persistent 3D background
│   │   │   └── HeroScene.tsx        # Interactive WebGL hero scene
│   │   ├── sections/
│   │   │   ├── Navbar.tsx           # Sticky glassmorphic navbar
│   │   │   ├── HeroSection.tsx      # Editorial hero + marquee
│   │   │   ├── ServicesSection.tsx  # 6 core services with 3D tilt
│   │   │   ├── AboutSection.tsx     # Agency story & metrics
│   │   │   ├── TeamSection.tsx      # Team grid from API
│   │   │   ├── RecentWorkSection.tsx # Filterable portfolio & modal
│   │   │   ├── TestimonialsSection.tsx # Client reviews
│   │   │   ├── ContactSection.tsx   # Brief form + WhatsApp
│   │   │   └── Footer.tsx           # Agency links & copyright
│   │   └── ui/
│   │       ├── CustomCursor.tsx     # Trailing cursor follower
│   │       ├── Preloader.tsx        # Logo loading counter
│   │       ├── ProjectModal.tsx     # Portfolio detail modal
│   │       ├── SmoothScroll.tsx     # Lenis smooth scroll
│   │       ├── SocialIcons.tsx      # SVG social icons
│   │       ├── TiltCard.tsx         # 3D Parallax tilt effect
│   │       └── WhatsAppFloating.tsx # Pulsing WhatsApp action
│   ├── lib/
│   │   ├── auth.ts                  # JWT & password verification
│   │   ├── db.ts                    # Dual MongoDB / JSON storage adapter
│   │   ├── email.ts                 # Nodemailer email dispatcher
│   │   ├── models.ts                # TypeScript interfaces & Mongoose schemas
│   │   └── rate-limit.ts            # Sliding rate limiter
│   └── scripts/
│       └── seed.ts                  # Database seeding script
├── .env.example
├── .env.local
└── package.json
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js 18+ or Node.js 24+
- npm or pnpm

### 2. Environment Setup
Review `.env.local` (or copy from `.env.example`):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=15551234567
NEXT_PUBLIC_CONTACT_EMAIL=contact@insertixmedia.com

# Database (Leave blank to use local persistent JSON, or enter MongoDB URI)
MONGODB_URI=

# JWT Secret
JWT_SECRET=insertix_super_secret_jwt_key_2026_ultra_secure

# Admin Credentials (for seed & login)
ADMIN_EMAIL=admin@insertixmedia.com
ADMIN_PASSWORD=admin123
```

### 3. Seed Realistic Data
Populate the database with 8 showcase projects, 6 team members, 4 testimonials, and the admin user:

```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔑 Admin Dashboard Guide

1. Navigate to: **[http://localhost:3000/admin](http://localhost:3000/admin)**
2. If not logged in, you will be redirected to `/admin/login`.
3. Enter default credentials:
   - **Email:** `admin@insertixmedia.com`
   - **Password:** `admin123`
4. In the Dashboard:
   - **Recent Work**: Add new projects, edit titles, categories, upload cover imagery, or delete old case studies.
   - **Team Members**: Add specialists, roles, bios, and upload portraits.
   - **Testimonials**: Manage client ratings and endorsements.
   - **Inquiries**: Review incoming project briefs submitted via the public contact form, complete with client budget, phone number, and scope.

---

## 🚢 Deploy to Vercel

1. Push the repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - `JWT_SECRET`
   - `MONGODB_URI` (from MongoDB Atlas)
   - `SMTP_USER` & `SMTP_PASS` (optional, for email notifications)
4. Click **Deploy**. Vercel will automatically build and deploy your award-winning 3D website.
