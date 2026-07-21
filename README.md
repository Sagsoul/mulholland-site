# Mulholland Traders Pvt Ltd — SQLite E-Commerce App

This repository now contains a simple full-stack e-commerce application built with **Next.js 14 + TypeScript** and backed by **SQLite** for product, inventory, sales, invoice, and price-list data.

It is designed for a small catalog (roughly a few hundred products/variants) with:

- a public storefront
- an admin backend for inventory and direct sales
- local image uploads
- invoice generation via printable HTML invoice pages
- WhatsApp-based purchase handoff instead of online card checkout

## Stack

- **Frontend:** Next.js App Router + React + TypeScript + Tailwind CSS
- **Backend:** Next.js route handlers
- **Database:** SQLite (`better-sqlite3`)
- **Uploads:** local filesystem in `public/uploads/`
- **Invoices:** printable HTML invoice pages at `/invoices/:id`

## Features

### Storefront

- Product listing at `/shop`
- Product detail pages at `/product/[id]`
- Exact stock display (`1 left` / `N in stock`)
- Add-to-cart flow
- **Buy via WhatsApp** button with prefilled product message and link back to the product

### Admin

- Admin login protected by env-based credentials
- Product CRUD with stock, SKU, price, description, active flag, and local image upload
- POS/direct sale entry at `/admin/pos`
- Sales history at `/admin/sales`
- Price list editor at `/admin/pricelist`

### Orders / Sales

- Online order capture through `/api/orders`
- POS sale capture through `/api/pos`
- Stock decremented transactionally when a sale is recorded
- Invoice page generated for every sale at `/invoices/:id`

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Supported variables:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Base URL used in metadata and WhatsApp/product links |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | Seller WhatsApp number used in deep links |
| `ADMIN_USERNAME` | Yes | Admin login username |
| `ADMIN_PASSWORD` | Yes | Admin login password |
| `ADMIN_SESSION_SECRET` | Yes | Secret used to sign the admin session cookie |
| `SQLITE_DB_PATH` | No | SQLite file path (defaults to `./data/mulholland.sqlite3`) |

## Local Development

Install dependencies:

```bash
npm install
```

Seed sample products:

```bash
npm run seed
```

Start development server:

```bash
npm run dev
```

Open:

- Storefront: `http://localhost:3000/shop`
- Admin login: `http://localhost:3000/admin/login`

## Production

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## SQLite Initialization / Migration Strategy

- Startup migrations live in `database/migrations/`
- The app initializes the SQLite database automatically on first access
- `src/lib/db.ts` applies any unapplied SQL migration files at runtime
- Seed data is added with `npm run seed`

## Important Routes

### Pages

- `/shop`
- `/product/[id]`
- `/cart`
- `/checkout`
- `/admin`
- `/admin/inventory`
- `/admin/pos`
- `/admin/sales`
- `/admin/pricelist`
- `/invoices/[id]`

### API

- `GET /api/products`
- `POST /api/products`
- `GET/PATCH/DELETE /api/products/:id`
- `GET /api/categories`
- `POST /api/upload`
- `POST /api/orders`
- `POST /api/pos`
- `GET /api/sales`
- `GET/PUT /api/pricelist`
- `POST/DELETE /api/admin/session`

## File Uploads

- Product images upload to `public/uploads/`
- Uploaded images are referenced by local URLs like `/uploads/<filename>`
- Runtime uploads and SQLite DB files are gitignored

## Validation

Verified commands:

```bash
npm run lint
npm run build
npm run seed
```
