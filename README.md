# Insertix Media — Production Deployment & Architecture

A high-performance modern web platform for **Insertix Media**, featuring a cinema-grade Next.js frontend and a secured standalone Express.js REST API.

---

## 🏗️ Architecture Overview

- **Frontend (`/`)**: Next.js 16 with React 19, Tailwind CSS v4, ISR cache tags, and dynamic proxy routing. Designed for deployment on **Vercel**.
- **Backend (`/backend`)**: Node.js & Express.js REST API with MongoDB Atlas integration, Helmet, Rate Limiting, JWT Cookie/Bearer Auth, SSE Live Updates, and Cloudinary image optimization. Designed for deployment on **Render**.

---

## 🔐 Environment Variables Specification

> **IMPORTANT**: Never commit `.env` or `.env.*` files to source control. Configure these variables directly in your deployment dashboards (Vercel & Render).

### 1. Backend Service (Render)
| Variable Name | Description | Example / Note |
|---|---|---|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Web service listening port | `10000` (auto-assigned by Render) |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/insertix?retryWrites=true&w=majority` |
| `JWT_SECRET` | 32+ character random string for signing admin tokens | Generate with `crypto.randomBytes(48).toString('hex')` |
| `FRONTEND_URL` | Production URL of Vercel frontend | `https://your-frontend.vercel.app` (or custom domain) |
| `REVALIDATE_SECRET` | Shared secret to trigger Vercel ISR on mutations | Keep identical between Vercel and Render |
| `ADMIN_EMAIL` | Initial admin account email | `admin@insertixmedia.com` |
| `ADMIN_PASSWORD` | One-time password for seed script | Must be at least 8 characters and not weak |
| `ADMIN_NOTIFICATION_EMAIL` | Recipient email for contact leads | `contact@insertixmedia.com` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | Your email |
| `SMTP_PASS` | SMTP app password | Your app-specific password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud name | For media uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | For media uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | For media uploads |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Contact phone number | E.g. `919717150055` |

---

### 2. Frontend Web App (Vercel)
| Variable Name | Description | Example / Note |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Render backend service URL | `https://insertix-backend.onrender.com` |
| `NEXT_PUBLIC_SITE_URL` | Public site domain | `https://insertixmedia.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Contact phone number | `919717150055` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Display contact email | `contact@insertixmedia.com` |
| `REVALIDATE_SECRET` | Secret for protected `/api/revalidate` route | Must match Render backend `REVALIDATE_SECRET` |

---

## 🛠️ Local Development

### 1. Run the Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Run the Frontend
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Deployment Guide

### Deploy Backend to Render
1. Create a new **Web Service** on Render connected to this repository.
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to `Node`.
4. Set **Build Command** to: `npm ci && npm run build`
5. Set **Start Command** to: `npm start`
6. Add the environment variables listed in the Backend table above.
7. Set **Health Check Path** to `/health`.
8. Once deployed, open the Render **Shell** and run:
   ```bash
   npm run seed
   ```
   *(After successful seed, you can remove `ADMIN_PASSWORD` from environment settings).*

### Deploy Frontend to Vercel
1. Import this repository in your Vercel Dashboard.
2. Framework Preset: **Next.js**.
3. Set **Root Directory** to `./` (root).
4. Add the environment variables listed in the Frontend table above (especially `NEXT_PUBLIC_API_URL` pointing to your Render service).
5. Deploy.
