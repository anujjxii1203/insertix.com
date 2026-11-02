# Insertix Media — Production Deployment & Architecture

A high-performance modern web platform for **Insertix Media**, featuring a cinema-grade Next.js frontend and a secured standalone Express.js REST API.

---

## 🏗️ Architecture Overview

- **Frontend (`/`)**: Next.js 16 with React 19, Tailwind CSS v4, ISR cache tags, and dynamic proxy routing. Designed for deployment on **Vercel**.
- **Backend (`/backend`)**: Node.js & Express.js REST API with MongoDB Atlas integration, Helmet, Rate Limiting, JWT Cookie/Bearer Auth, SSE Live Updates, and ImageKit image optimization. Designed for deployment on **Render**.

--
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
