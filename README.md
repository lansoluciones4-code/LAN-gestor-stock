# Stock Management System — Technology Stores

> A fullstack, robust web application tailored for managing inventory, sales, clients, providers, and users within local technology and mobile phone businesses.

## Overview and Goals
This project serves as a highly scalable and solid foundation for a backend-driven dashboard built cleanly using **Next.js 15 (App Router)**. It aims to solve the operational needs of technology stores by tracking devices (stock flow), processing receipts (in PDF format), auditing every critical action in the system, and splitting authorization contexts between `Admin` and `Vendedor` (Vendor) roles via JWT authentication.

Every layer of the application is deeply separated, applying best practices in Object-Oriented principles, SOLID concepts, and Liskov Substitution Principle (LSP) while retaining the simplicity of modern functional React components.

## Technology Stack

### Core Frameworks
- **[Next.js 15](https://nextjs.org/)** — Fullstack framework leveraging React server components (App Router). API routes are avoided in favor of Server Actions, concentrating backend and frontend in a unified execution model. (TypeScript strictly enabled).

### Front-End Tooling
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first framework handling responsiveness, dark modes, and dynamic aesthetic requirements (zinc palettes natively).
- **[Zustand](https://github.com/pmndrs/zustand)** — Minimalistic global state manager. Primarily used to store client-side Authentication status seamlessly syncing across components without excessive nested context providers.
- **[Framer Motion](https://www.framer.com/motion/)** *(Planned)* — Used for smooth panel transitions, structural lists styling natively integrated.
- **Form Handling & Validity** — Handled via **[Zod](https://zod.dev/)**, guaranteeing that the shapes traversing client-to-server strictly match schema definitions.

### Back-End / Infrastructure 
- **[PostgreSQL](https://www.postgresql.org/) (Docker Compose)** — Relationally sound source-of-truth.
- **[Drizzle ORM](https://orm.drizzle.team/)** — Lightweight, highly performant type-safe object relational mapper. Enables strict type parity between TS shapes and postgres columns.
- **[bcrypt](https://www.npmjs.com/package/bcrypt) & [jose](https://github.com/panva/jose)** — Hashing and edge-compatible JSON Web Token provisioning used for rigorous stateful security verification at `middleware.ts`.
- **[Pino](https://github.com/pinojs/pino)** *(Planned)* — High-throughput JSON structured logger mapping out audit events chronologically.

---

## Infrastructure: Running Locally

The execution context relies heavily on Docker. Assuming you have `Node.js >= 18` and `Docker Compose` installed.

### 1. Pre-requisites
Spin up the PosgreSQL instance via compose. Due to frequent overlaps, it binds externally exposed over `5433` by default mapping internally to `5432`.
```bash
docker compose up -d
```

### 2. Dependency Management
Install Node modules.
```bash
npm install
```

Ensure your `.env` encapsulates:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/stock_db
JWT_SECRET=super_secret_dev_key_change_me_later
```

### 3. Database Sync & Seeding
Using Drizzle natively, invoke generation, migration, and the programmatic seeder scripts mapping admin users and standard inventory baselines automatically.
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Spawning Edge Engine
```bash
npm run dev
```
Navigate to `http://localhost:3000`. Default Administrative Credentials:
**User:** `admin` | **Pass:** `admin`

---

## Architectonic Decisions & Flux

### 1. Component Boundaries & "Next.js Action" Model
Express logic has been completely decoupled. We depend on decoupled generic Service Action modules located logically inside `/server`. No `/api` fallback happens unless forced for specific Edge features like non-SSR'd PDF rendering buffering outputs.
We structure persistence rigorously into repositories. (`src/server/repositories/` acts as the Drizzle boundary abstracting DB intricacies, preventing DB logic bleeding into handler logic). **Single Responsibility Principle**.

### 2. Dual Shield Authentication Flow
Security ensures no UI bypass or data exfiltration happens.
1. `middleware.ts` intercepts requests at the Edge runtime using the lightweight `jose` library (since native Node APIs are banned in standard Vercel edge). Without a token, users are pushed backwards.
2. Inside `Server Actions`, incoming context extracts roles. A standard user attempting to invoke an Administrative mutation `ServerAction` receives a `403/Forbidden` instantly preventing DB penetration.
3. Client Side Store (`Zustand`) triggers conditional UI layers masking buttons they cannot enact upon.

### 3. Feature Directory Structure

```text
src/
├── app/                  → Next.js Route directory representing physical URL paths.
│   ├── (auth)/           → Grouped public pathways bridging layout wrappers.
│   └── (dashboard)/      → Secured interface segments enforcing Session integrity.
├── components/           → Pure UI, reusable and functional segments (Modals, ComboBoxes).
├── lib/
│   ├── auth/             → Key generator & encrypter helpers (jwt.ts).
│   ├── db/               → Drizzle Schema declarations and connection bootstrapping.
│   └── logger/           → JSON Logging (Pino).
├── schemas/              → Extracted Zod schemas for multi-pass validations.
├── server/
│   ├── actions/          → Backend execution closures consumed symmetrically in frontend. 
│   └── repositories/     → Concrete DB interactions, separating query shapes from controllers.
├── stores/               → Zustand state trees (e.g., auth.store.ts).
├── middleware.ts         → The initial execution layer before any router renders UI.
└── types/                → Custom TS Interfaces extending DB inferred structures.
```

## Detailed Entity Context

- **Users**: Admin vs Vendedor. Regulates privileges.
- **Equipos / Categories**: Product line markers (e.g., iPhone 15, Samsung Galaxy S24). Simple dimensional definitions providing categorical grounding.
- **Products**: Actual stock nodes. Binds equipments, quantities (availability logic), metadata (IMEI, Color), tracking purchasing, and forecasted sale price.
- **Transactions / Ventas**: Connects Sellers to Clients bridging total margins spanning snapshot configurations over `venta_items`.
- **Auditing Logs**: Immutable register of `CREATES`, `UPDATES` mapped relationally enabling behavioral analysis context if discrepancies arise.

---
*Built incrementally following SOLID tenets allowing painless expansions for deeper analytics and distributed stock modules.*
