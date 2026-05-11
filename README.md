# Phone Center — Stock Management & POS System

> A high-performance, full-stack web application engineered for technology retail and mobile phone businesses. It seamlessly manages inventory, point-of-sale (POS) operations, clients, providers, user credentials, and exhaustive audit logging. Built with strict adherence to Clean Architecture, SOLID principles, and modern Next.js paradigms.

---

## 📖 Developer Onboarding & Documentation

Welcome to the Phone Center project. This document is your single source of truth for understanding the system's architecture, business rules, technologies, and local setup. Whether you are adding a new feature or debugging a production issue, this guide will provide the context you need to start coding immediately.

---

## 🛠 Technology Stack

This project leverages the bleeding edge of the JavaScript/TypeScript ecosystem to deliver uncompromising performance and type safety.

### Core Frameworks & UI

- **[Next.js 16 (App Router)](https://nextjs.org/)**: The backbone of the application. We use React Server Components (RSC) and **Server Actions** to unify the backend and frontend execution models, explicitly avoiding standalone API routes.
- **[React 19](https://react.dev/)**: Utilizing concurrent rendering features and hooks (`useTransition`, `useActionState`).
- **[Tailwind CSS v4](https://tailwindcss.com/)**: Utility-first CSS engine handling layout constraints and responsive design.
- **[Lucide React](https://lucide.dev/)**: Scalable vector iconography.
- **[Playwright](https://playwright.dev/)**: End-to-End (E2E) testing framework guaranteeing critical business flows.

### State Management & Forms

- **[Zustand](https://github.com/pmndrs/zustand)**: Lightweight global state management. Used primarily for client-side entity synchronization (e.g., `useSaleStore`, `useProductStore`) avoiding deeply nested React Contexts.
- **[React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)**: End-to-end type safety. Zod schemas bridge the client payload into backend Server Actions with rigorous validation.

### Back-End Engine & Infrastructure

- **[PostgreSQL](https://www.postgresql.org/)**: Relational database orchestrating transactional integrity.
- **[Drizzle ORM](https://orm.drizzle.team/)**: High-performance, edge-ready Object Relational Mapper bridging TypeScript schemas with Postgres.
- **[jose](https://github.com/panva/jose) & [bcrypt](https://www.npmjs.com/package/bcrypt)**: Cryptographically secure password hashing and Edge-compatible JSON Web Tokens (JWT) for authentication.

---

## 🏗 Architecture & Conventions

The project strictly follows a **Feature-Oriented Clean Architecture**. Code is grouped by business capability (feature) rather than technical role.

### Directory Structure

```text
src/
  app/              # Next.js App Router (Pages, Layouts, Routing)
  features/         # Core business logic organized by feature
    [feature_name]/ # e.g., auth, product, sale, customer, audit
      actions/      # Server Actions (Application Layer / Use Cases)
      domain/       # Zod Schemas & Types (Domain Layer)
      repository/   # Drizzle DB interactions (Infrastructure Layer)
      store/        # Zustand State (Client State Management)
      ui/           # Feature-specific React Components
  components/       # Shared, generic UI components (Buttons, Modals, Tables)
  lib/              # Shared utilities, DB connection, constants
```

### Strict Layer Separation

- **Domain Layer (`domain/`)**: Pure business logic and data shapes (Zod schemas). Zero external dependencies.
- **Infrastructure Layer (`repository/`)**: Database access via Drizzle. **Repositories never handle HTTP or UI logic.**
- **Application Layer (`actions/`)**: Thin Server Actions that validate input (via Zod), call the repository, and return a typed `ActionResult`. **Business logic never lives in UI components.**
- **Presentation Layer (`app/` & `ui/`)**: React components. They consume Server Actions and Zustand stores. They never query the database directly.

### Coding Standards

1. **SOLID Principles**: Single Responsibility (functions do one thing), Dependency Inversion (depend on abstractions).
2. **Type-Safety (Zod)**: We use a dual-schema pattern.
   - `InputSchema` (e.g., `userSchema`): Validates incoming data from forms.
   - `DefSchema` (e.g., `userDefSchema`): The Source of Truth representing the database record.
3. **Action Results**: All Server Actions must return a standardized `ActionResult<T>` type instead of throwing raw errors to the client:
   ```typescript
   type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string };
   ```
4. **Zustand Naming**: Store hooks must use singular naming conventions (e.g., `useCustomerStore` instead of `useCustomersStore`).
5. **Concurrency**: Assume operations run concurrently. Use `Promise.all` for independent async operations.

---

## 📜 Business Rules

### 1. Dual-Layer Security & RBAC

Security enforces Strict Role-Based Access Control (`admin` vs `vendedor`).

- **Edge Middleware (`middleware.ts`)**: Evaluates HttpOnly Session Cookies. Unauthenticated users are redirected to `/login`.
- **Action Authorization**: Every mutation validates permissions (`verifyAuthOrAdmin`). `vendedor` roles cannot mock backend payloads to execute admin-only actions.

### 2. Relational Integrity & Soft Deletes

To preserve Foreign Key (FK) integrity and historical audit data, the system relies on **Conditional Soft Deletes**.
If an entity (Provider, Device, Customer) has been part of a transaction, it is restricted to a Soft Delete (`isActive: false`). It is removed from operational views but kept intact for the database.

### 3. Point of Sale (POS) & Stock Automation

When a sale is confirmed via the POS interface, the system processes a database transaction that:

1. Records the sale and associates it with the vendor and customer.
2. Automatically decrements `stock` for all purchased products.
3. Registers the sale revenue in the dashboard analytics.

### 4. High-Fidelity Audit Logging

Every critical operation (`CREAR`, `ACTUALIZAR`, `ELIMINAR`, `LOGIN`, `PÉRDIDA`) is recorded in the Audit Log.

- The log captures the User ID, Entity ID, timestamp, and a JSON payload of the affected data.
- **Filtered Search Mechanism**: 
  - **Frontend Normalization**: The UI is designed to be user-friendly. Users can search using natural language terms to filter specific entities or actions.
    - **Actions**: `creación`, `edición`, `borrado`, `baja`, `pérdida`
    - **Entities**: `usuario`, `proveedor`, `producto`, `cliente`, `equipo`, `venta`
  - **Backend Unaccent**: The backend queries the database using the Postgres `unaccent` extension paired with `ILIKE`. This ensures that searches are completely accent-insensitive (e.g., searching for "pérdida", "perdida", or "PERDIDA" all match the same logs).
  - **IMPORTANT**: The `unaccent` extension is **not activated by default** in standard Postgres installations. To guarantee this search mechanism functions properly, you **must** manually activate the `unaccent` extension in your database (e.g. running `CREATE EXTENSION IF NOT EXISTS unaccent;`).

### 5. Product Image Management

To ensure a consistent and premium visual experience across the application (especially on the landing page and product details), the frontend displays product images in a strict `1:1` (square) container to maintain layout uniformity.
- **Client Recommendation:** Always take and upload product photos in a **1:1 aspect ratio** (e.g., using the "Square" mode on a smartphone camera).
- **Fallback Behavior:** If non-square (rectangular) images are uploaded, the system utilizes an intelligent "zoom-to-fill" strategy (via CSS `object-cover` and Cloudinary's AI-driven `crop: 'fill'`). This guarantees that there are no empty gaps/letterboxing in the UI, but it may result in the edges of the image being cropped.

---

## 📦 System Modules

- 💻 **Authentication (`/login`)**: Secure access using bcrypt and HttpOnly JWTs.
- 📊 **Dashboard (`/`)**: Business intelligence aggregating revenue, stock value, and top sellers.
- 📱 **Devices (`/categorias`)**: Administrative ledger defining hardware models (e.g., iPhone 15 Pro).
- 📦 **Products/Inventory (`/productos`)**: Core inventory management tying devices to physical stock and providers.
- 🛒 **Point of Sale (`/ventas`)**: Synchronized cart checkout, customer association, and automated stock decrement.
- 👥 **Customers (`/clientes`)**: CRM directory preserving purchaser identities.
- 🏢 **Providers (`/proveedores`)**: B2B directory of external hardware suppliers.
- 🛡 **Users (`/usuarios`)**: Internal administrative panel for employee credentials.
- 📜 **Audit Logs (`/logs`)**: High-fidelity tracing of all system mutations.

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose (for PostgreSQL)

### 1. Clone & Install

```bash
git clone <repository-url>
cd StockManagementApp
npm install
```

### 2. Environment Configuration & Deployment Environments

The project relies on a strict `.env` hierarchy to prevent accidental modifications to production data. Thanks to the `.gitignore` configuration (`.env*`), **all environment files are safely ignored by Git**.

#### A. Local Development (`.env.local`)
Create a `.env.local` file at the root of the project. Next.js and Drizzle automatically prioritize this file when running standard commands (like `npm run dev`). Use this strictly for your local/development database and services.

```env
# Connects to the local Docker Postgres instance on port 5433
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5433/stock_db
JWT_SECRET=super_secret_dev_key_change_me_later
CLOUDINARY_URL=cloudinary://your_dev_key...
```

#### B. Production Scripts (`.env.prod`)
Vercel handles the actual production environment variables securely via its dashboard. However, if you need to run local CLI commands against the production database (e.g., pushing schema migrations), create a `.env.prod` file:

```env
# Production Database Connection
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5433/
DATABASE_URL=postgresql://postgres.your_project:password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
CLOUDINARY_URL=cloudinary://your_prod_key...
```

**How to run scripts against production:**
By default, all terminal commands use `.env.local`. To explicitly target production and avoid disastrous mistakes, use the installed `dotenv-cli` package to inject the production variables:

```bash
# Example: Migrate production database
npx dotenv -e .env.prod -- npm run db:migrate

# Example: Seed production database
npx dotenv -e .env.prod -- npm run db:seed
```

### 3. Spawn Database Infrastructure

Start the PostgreSQL container (binds to port `5433` to prevent clashes with local DBs):

```bash
docker compose up -d
```

### 4. Database Setup & Seeding

Generate the schema, apply migrations, enable the unaccent extension, and seed the initial data:

```bash
# Push SQL schemas to the database
npm run db:generate
npm run db:migrate

# Enable 'unaccent' extension for flexible search queries
npx tsx src/scripts/enable-unaccent.ts

# Seed the foundation (creates the initial admin user)
npm run db:seed-users
```

### 5. Start the Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`.

**Default Administrative Credentials:**

- **User:** `admin`
- **Pass:** `admin`

---

## 🛠 Useful Scripts & Commands

The `package.json` includes several utility scripts to streamline your workflow:

| Command                  | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| `npm run dev`            | Starts the Next.js development server with Turbopack.                 |
| `npm run build`          | Creates an optimized production build.                                |
| `npm run lint`           | Runs ESLint to verify code quality.                                   |
| `npm run db:generate`    | Generates Drizzle SQL migration files based on schema changes.        |
| `npm run db:migrate`     | Applies pending Drizzle migrations to the database.                   |
| `npm run db:seed`        | Injects foundational data (like the master admin account).            |
| `npm run db:reset-data`  | Clears and resets standard operational data (useful for dev testing). |
| `npm run db:reset-full`  | Wipes the entire database completely (Warning: Destructive).          |
| `npm run db:stress-test` | Runs a script to flood the DB with mock data for performance testing. |
| `npx playwright test`    | Executes the End-to-End (E2E) test suite via Playwright.              |

---

_Code is meant to be read by humans, and occasionally compiled by machines. Prioritize the clean code lifecycle._
