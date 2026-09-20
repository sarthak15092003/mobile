# FixFlow Pro — Mobile Repair Management Web Application

A full-stack, enterprise-grade web application for managing mobile phone repair/service records, built with **Next.js 14+ (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL**.

Designed specifically for local development and seamless zero-code-change production deployment on **Vercel**.

---

## 🌟 Key Features

1. **Multi-User PostgreSQL Persistence**: All tickets, audit trails, and user accounts live in a single shared PostgreSQL database. No reliance on browser localStorage or client-side mock data.
2. **Concurrency-Safe Repair ID Generator**: Generates sequential IDs (`REP-YYYY-00001`, `REP-YYYY-00002`, etc.) using atomic database transactions and row-locking to guarantee no duplicate IDs under concurrent multi-user submissions.
3. **Role-Based Access Control (RBAC)**:
   - **Admin**: Full control (view/create/edit repairs, assign technicians, update statuses, manage team accounts, reset passwords, access reports, export data).
   - **Technician**: View assigned repairs, inspect device problems, advance status workflow (`In Process` → `Completed`), add technical completion notes.
   - **User / Front Desk**: Create repair tickets, search repairs, view repair history.
4. **Complete Audit Trail**: Every status change records: `old_status`, `new_status`, `changed_by`, `changed_at`, and an optional note in a clean chronological timeline.
5. **Multiple Repairs for the Same Serial Number**: Serial numbers are non-unique, enabling phones to be serviced multiple times over their lifespan, with all historical records displayed chronologically.
6. **Advanced Search**: Instant deep query by Serial Number, Repair ID, Additional Reference ID, or Mobile Model.
7. **Reports & Exports**: Filter by date range, status, or technician with one-click export to **CSV** and **Excel (.xlsx)**.

---

## 🏗️ Architecture

### Local Development
```text
Browser / Tester
       ↓
http://localhost:3000 (Next.js App Router)
       ↓
Prisma ORM
       ↓
PostgreSQL Database (Local or Neon / Supabase)
```

### Production (Vercel)
```text
Multiple Users / Testers (Mobile phones & Laptops)
       ↓
https://your-app.vercel.app
       ↓
Vercel Serverless (Next.js + Prisma)
       ↓
Cloud PostgreSQL Database (Neon, Supabase, Vercel Postgres, Railway, or AWS RDS)
```

> [!NOTE]
> Moving from local development to production on Vercel requires **zero code changes** — only setting the `DATABASE_URL` environment variable.

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22.13.0)
- **PostgreSQL**: A running PostgreSQL instance. You can use:
  - **Option A (Instant Cloud DB - Recommended)**: Create a free database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com). Copy the connection string.
  - **Option B (Local PostgreSQL)**: Install PostgreSQL locally (default port `5432`).

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root (copied from `.env.example`):
```env
# Database connection string
DATABASE_URL="postgresql://username:password@localhost:5432/mobile_repair?schema=public"

# Secret key for JWT session authentication (at least 32 characters)
AUTH_SECRET="dev-mobile-repair-jwt-secret-key-32-chars-long-2026"

# Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize Database Schema & Seed Data
Push the Prisma schema to your PostgreSQL database:
```bash
npm run db:push
```

Generate the Prisma Client:
```bash
npm run db:generate
```

Seed the default admin, technician, service desk users, and sample repair tickets:
```bash
npm run db:seed
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Seed Accounts

The database seed script automatically provisions three accounts representing each system role:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@mobilerepair.com` | `admin123` | Full access, user management, reports export |
| **Technician** | `tech@mobilerepair.com` | `tech123` | Assigned repairs, status update, completion |
| **Service Desk** | `user@mobilerepair.com` | `user123` | Create repair tickets, search, view records |

*(The login page features 1-click quick-fill buttons for these demo credentials to make testing fast).*

---

## ☁️ Production Deployment to Vercel

Follow these steps to deploy to Vercel for multi-user testing:

### Step 1: Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Mobile Repair Management System"
git branch -M main
git remote add origin https://github.com/your-username/mobile-repair-management.git
git push -u origin main
```

### Step 2: Create a Cloud PostgreSQL Database
If you do not already have a cloud database:
1. Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
2. Create a new free project and database (e.g., `mobile_repair`).
3. Copy the pooled connection string (`postgresql://...`).

### Step 3: Import Project into Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New** → **Project**.
2. Select your GitHub repository (`mobile-repair-management`).
3. Under **Environment Variables**, add:
   - `DATABASE_URL`: Your cloud PostgreSQL connection string.
   - `AUTH_SECRET`: A secure 32+ character random string (e.g. run `openssl rand -base64 32`).
   - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (or leave blank initially).

### Step 4: Run Production Database Migrations & Seed
You can push the schema and seed your production database directly from your local terminal pointing to the cloud `DATABASE_URL`:
```bash
# Push schema to cloud database
DATABASE_URL="your-cloud-postgres-url" npx prisma db push

# Seed default accounts into cloud database
DATABASE_URL="your-cloud-postgres-url" npm run db:seed
```

### Step 5: Deploy
Click **Deploy** in Vercel. Once completed, your application will be live at `https://your-app.vercel.app`.

---

## 🧪 Multi-User End-to-End Testing Walkthrough

Before sharing with testing teams, verify this scenario:

1. **User 1 (Service Desk)**:
   - Log in as `user@mobilerepair.com` / `user123`.
   - Click **New Repair**.
   - Enter:
     - Serial Number: `TEST123`
     - Mobile: `iPhone 15`
     - Problem: `Display problem`
     - Additional ID: `ABC001`
   - Submit.
   - Verify that the server returns a generated ID (e.g. `REP-2026-00005`) and the **Copy ID** button functions.

2. **User 2 (Technician - on another browser or device)**:
   - Log in as `tech@mobilerepair.com` / `tech123`.
   - Go to **Search Repair** and search `TEST123`.
   - Verify that the exact repair record created by User 1 appears.
   - Click **Details** → **Update Status**.
   - Change status from `Pending` → `In Process` with note: `Diagnostics initiated`.

3. **User 3 (Admin - on a third device or private window)**:
   - Log in as `admin@mobilerepair.com` / `admin123`.
   - Search `TEST123`.
   - Verify that the status shows `In Process` in real time.
   - Click **Update Status** → change to `Completed`.
   - In the **Completed By** dropdown, select `Rahul (Technician)`.
   - Submit.
   - Inspect the **Repair History & Audit Trail** card on the right to verify the full chronological log:
     - Ticket creation by User 1
     - Transition `Pending → In Process` by User 2
     - Transition `In Process → Completed` with technician attribution by User 3

---

## 🛡️ Security Best Practices Implemented

- **Password Hashing**: `bcryptjs` with salt rounds = 10.
- **Session Authentication**: Signed JWTs with `HS256` stored in `HttpOnly`, `SameSite=lax`, and `Secure` (in production) cookies.
- **Server-Side Authorization**: API routes check active account state and roles directly in PostgreSQL (`requireAuth`, `requireRoles`).
- **SQL Injection Prevention**: Prisma ORM parameterized queries throughout the application.
- **No Client Secrets**: Database credentials and JWT secrets are strictly read on the server side via environment variables.
