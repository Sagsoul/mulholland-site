# Mulholland Traders Pvt Ltd — E-Commerce Site

A full-stack e-commerce platform for **Mulholland Traders Pvt Ltd**, a Zimbabwe-based wholesaler/retailer of pipe repair, roof repair, waterproofing, heat-reflective paint, rust converter and related hardware products. The site doubles as a second-hand goods marketplace.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes (Node.js)
- **Database / Auth / Storage:** Supabase (PostgreSQL + Auth + Storage)
- **PDF Generation:** jsPDF + jspdf-autotable
- **Deployment:** Vercel

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Sagsoul/mulholland-site.git
cd mulholland-site
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 3. Database Setup

Run the SQL files against your Supabase project:

```bash
# In Supabase SQL editor, run:
# 1. supabase/schema.sql
# 2. supabase/seed.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── admin/              # Auth-guarded admin panel
│   └── api/                # REST API endpoints
├── components/             # Reusable React components
├── context/                # React Context (cart)
├── lib/                    # Utilities (Supabase, PDF, WhatsApp, etc.)
└── types/                  # TypeScript types
supabase/
├── schema.sql              # Database schema with RLS
└── seed.sql                # Seed data (categories, products, price list)
```

## Key Features

- 🛒 **Shop** — Product grid with category filters; sold items disappear instantly
- 📋 **Price List** — Full retail price list rendered from DB, printable
- 🧾 **WhatsApp Checkout** — Pro-forma PDF generated client-side, order sent via WhatsApp
- 🏪 **POS Terminal** — In-store point-of-sale for admin
- 📦 **Inventory Management** — CRUD products, stock management
- 📊 **Sales Dashboard** — Online + POS sales history

## Contacts

- **Phone / WhatsApp:** +263 77 895 5551
- **Email:** vm@equilib.life
- **Address:** 18 Glenelg Road, Vainona, Harare, Zimbabwe
