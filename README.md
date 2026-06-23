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

Run the SQL files against your Supabase project in order:

```bash
# In Supabase SQL editor, run in this exact order:
# 1. supabase/schema.sql        — creates all tables, triggers, and RLS policies
# 2. supabase/seed.sql          — seeds categories, sample products, and the Jan-26 price list
# 3. supabase/migrations/0002_seed_pricelist_products.sql  — (see Migrations section below)
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

## Migrations

Run these SQL files in order after a fresh Supabase project is created:

| # | File | Purpose |
|---|------|---------|
| 1 | `supabase/schema.sql` | Creates all tables, triggers, storage buckets, and RLS policies |
| 2 | `supabase/seed.sql` | Seeds 6 categories, sample second-hand products, and the full Jan-26 retail price list |
| 3 | `supabase/migrations/0002_seed_pricelist_products.sql` | Makes every Jan-26 retail product a buyable item on `/shop` |

**About migration 3:**
- Inserts all 28 Jan-26 catalogue rows into the `products` table so they appear on `/shop` and go through the cart → WhatsApp checkout flow.
- All rows are seeded with `stock_qty = 0` so they are hidden on the public storefront until an admin sets stock from `/admin/inventory`.
- The public storefront filters `is_active = true AND stock_qty > 0`, so a product is only visible once the admin increments its stock.
- The migration is **idempotent**: re-running it updates `name`, `description`, `price_usd`, and `category_id` only — it does **not** reset `stock_qty`, `is_active`, or `image_url`.

## Contacts

- **Phone / WhatsApp:** +263 77 895 5551
- **Email:** vm@equilib.life
- **Address:** 18 Glenelg Road, Vainona, Harare, Zimbabwe
