# Stock Management Application — Tech Retail POS

> A robust, full-stack web application meticulously engineered to manage inventory, sales, clients, providers, and user credentials for local technology and mobile phone retail businesses. Built with scalability, clean architecture, and modern security patterns in mind.

## 📖 Official Documentation

This repository serves as the official source of truth for the system's architecture, technologies, capabilities, and workflows. It is meant to provide seamless onboarding for future maintainers and developers. All architectural decisions strictly honor **Clean Code**, **SOLID principles** (particularly Single Responsibility and Liskov Substitution Principle), and **Separation of Concerns**.

---

## 🛠 Technology Stack

The project sits on the absolute bleeding edge of the JavaScript/TypeScript ecosystem, leveraging the highest performance paradigms currently available:

### Core Frameworks & UI

- **[Next.js 15 (App Router)](https://nextjs.org/)** — Full-stack framework utilizing React Server Components (RSC). We strictly avoid standalone API routes; preferring Next.js **Server Actions** to unify the backend/frontend execution model efficiently.
- **[React 19](https://react.dev/)** — Employing cutting-edge hooks (`useTransition`, `useActionState`, `useFormStatus`) and concurrent rendering features.
- **[Tailwind CSS v4](https://tailwindcss.com/)** — A utility-first CSS engine handling layout constraints, dark mode integrations via dynamic system preferences, and complex CSS custom properties natively.
- **[Lucide React](https://lucide.dev/)** — For consistent, clean, and scalable vector iconography.

### State & Forms

- **[Zustand](https://github.com/pmndrs/zustand)** — A lightweight, un-opinionated global state manager. Solely used to handle Client-Side Authentication state sync across disjointed components avoiding deeply nested Context Providers.
- **[React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)** — We enforce rigorous end-to-end type safety. Zod schemas guarantee the exact shape of data bridging the client payload into backend Server Actions.

### Back-End Engine & Infrastructure

- **[PostgreSQL](https://www.postgresql.org/)** — Relational database providing transactional integrity and robust querying capability. Orchestrated locally via Docker Compose.
- **[Drizzle ORM](https://orm.drizzle.team/)** — A high-performance, edge-ready Object Relational Mapper. It bridges our TypeScript schemas with Postgres gracefully utilizing deep relational `with` queries to eliminate N+1 problems.
- **[jose](https://github.com/panva/jose) & [bcrypt](https://www.npmjs.com/package/bcrypt)** — Used for cryptographically secure hashing of user passwords and minting / verifying Edge-compatible JSON Web Tokens (JWT).

---

## 🏗 Architectural Decisions & Patterns

### 1. The Repository Pattern

To maintain the Single Responsibility Principle, database interactions are purely isolated within the `/src/server/repositories/` layer. Server Actions orchestrate business logic but delegate actual DB reads/writes to Repositories. This avoids bleeding ORM logic into UI components or handler orchestration.

### 2. React Server Components (RSC) vs Client Components

- **Server Components:** Utilized heavily at `/page.tsx` boundaries to pre-fetch initial data concurrently via `Promise.all()` directly from the DB, shipping zero JavaScript to the browser.
- **Client Components (`'use client'`):** Confined to specific interactive islands (`*-manager.tsx`), managing local states, modal dialogs, and real-time client-side search filtering arrays without triggering costly network roundtrips per keystroke.

### 3. Rigorous Type-Safety & Data Validation (Zod)

We enforce a strict **Fail-Fast** architecture on the server. Data integrity is managed through a dual-schema pattern in the `/src/schemas/` directory:

#### The `DefSchema` Pattern

To maintain absolute consistency, we separate **Input** from **Output/Definition** schemas:

- **`InputSchema` (e.g., `userSchema`):** Defines the requirements for creating or updating an entity (validation of names, email formats, password lengths). Used by `react-hook-form` and Server Actions for payload verification.
- **`DefSchema` (e.g., `userDefSchema`):** Defines the **Source of Truth** for an entity as it exists in the system. This includes database-generated fields like `id`, `createdAt`, `updatedAt`, and nested relations (e.g., a product's associated `provider`).

#### Centralized Server Validation

Unlike traditional patterns where the frontend "casts" types blindly, our architecture offloads validation to the **Server Actions**:

1.  **Server-Side Parsing:** Every `fetch` action validates the database output against its `DefSchema` before shipping it to the client.
2.  **Type Inference:** The frontend receives already-validated, strongly-typed objects. This eliminates the need for `as any` or manual `parse` calls in UI components.
3.  **Contract Enforcement:** If a database migration adds or changes a field, the Server Action will throw an error immediately, preventing the UI from entering an inconsistent state with missing or malformed data.

This ensures a seamless flow of integrity from the Postgres Schema $\rightarrow$ Drizzle $\rightarrow$ Server Actions $\rightarrow$ Zod $\rightarrow$ UI State.

### 3. Dual-Layer Security Model (RBAC)

Security enforces Strict Role-Based Access Control (`admin` vs `vendedor`).

1. **Edge Middleware (`middleware.ts`):** Intercepts requests evaluating HttpOnly Session Cookies. Unauthenticated users are permanently locked out of the `/(main)` route group.
2. **Server Action Authorization (`verifyAuthOrAdmin`):** Every mutation validates permissions on execution. If a `vendedor` forcibly attempts to mock a backend payload reserved for `admin`, the Server Action aborts instantly.
3. **Self-Harm Protections:** Administrators contain logical blocks preventing them from accidentally downgrading their own roles or deleting their own active profile.

---

## 📦 System Modules & Workflows

### 💻 1. Authentication Module (`/login`)

A pristine, fully-responsive login interface evaluating credentials against the hashed PostgreSQL records. Successful logins mint an HttpOnly token shielding against XSS payload extractions.

### 📊 2. Dashboard (`/`)

The analytical focal point. Aggregates metrics (active stock value, monthly revenue margins, top sellers) pulling statistical slices concurrently.

### 📱 3. Devices & Categories (`/equipos`)

An administrative classification ledger. Defines models, brands, or device variations (e.g., iPhone 15 Pro, Samsung S24).

- **Admin Privilege:** Full CRUD.

### 📦 4. Stock & Inventory Management (`/productos`)

The core beating heart of the system. Represents actual physical units tied to a `device` and a `provider`.

- **Pricing:** Manages specific `purchasePrice` vs `salePrice`.
- **In-Memory Search Architecture:** Instantaneous client-side memory search against Device Names and Descriptions. By avoiding debounced API calls for filtering, we achieve sub-millisecond responsiveness for the user.
- **Conditional Soft Deletes:** To preserve FK integrity, the system implements a strict "Relationship Check" before any hard deletion. If an entity (Provider, Device, Customer) has ever been part of a transaction or record, it is restricted to a **Soft Delete** (`isActive: false`). This keeps historical data intact for future audits while removing the item from active operational views.

### 🛒 5. Point of Sale (POS) - _Current Development Phase_

The upcoming engine for generating revenue. It will allow vendors to:

- **Select Products:** Add multiple items to a synchronized cart.
- **Client Association:** Link sales to existing customers or fast-track a guest checkout.
- **Stock Automation:** Automatic decrement of `products.stock` upon checkout completion.
- **Revenue Tracking:** Integrated with the Dashboard for real-time sales metrics.

### 👥 5. Client Portfolio (`/clientes`)

A CRM directory preserving final purchaser identities required for warranties or invoice association.

- **Vendor Privilege:** Can register new clients and edit contact information (Phone/Email/DNI).
- **Admin Privilege:** Exclusive rights to perform deletions.

### 🏢 6. Provider Registry (`/proveedores`)

A B2B directory managing wholesalers and external suppliers from whom hardware is sourced.

- **Admin Privilege:** Exclusive rights to create, modify, and delete supplier relationships.

### 🛡 7. User Profiles & Credentials (`/usuarios`)

A strict internal Administrative panel designed to onboard new employees, assigning them access bounds (`vendedor` / `admin`). Capable of password overrides or complete access revocation.

### 📜 8. Audit Logging & Tracing (`/logs`) — _Newly Implemented_

To ensure absolute accountability, the system maintains a **High-Fidelity Audit Log** of all critical operations:

- **Event Capture:** Every `CREATE`, `UPDATE`, `DELETE`, and `LOGIN` event is recorded with the specific User ID, Entity ID, and a JSON payload of the affected data.
- **Data Integrity (Soft Deletes):** Entites are now protected by an `isActive` flag. The system prohibits the permanent deletion of any record that has historical relationships (Foreign Keys) to preserve data consistency.
- **Administrative Inspector:** Admins can filter logs and view a deep-dive JSON comparison of data states, ensuring complete visibility over who changed what and when.

### ⚡ UI/UX Philosophy: Performance over Decoration

We have explicitly removed transition animations (`Framer Motion`) from the main layouts. The application is tuned to feel like a high-performance native cockpit: **instant interaction, zero latency.** Every click and search result is immediate, prioritizing professional efficiency over decorative effects.

---

## 🚀 Running the Project Locally

Assuming you have `Node.js >= 18` and `Docker Compose` installed.

### 1. Spawn Infrastructure

Start the PostgreSQL container. It binds externally to port `5433` (as designated in `docker-compose.yml`) to prevent clashes with native Postgres installations.

```bash
docker compose up -d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file at the root:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/stock_db
JWT_SECRET=super_secret_dev_key_change_me_later
```

### 4. Database Sync & Seeding

Execute Drizzle to generate SQL structures, push migrations, and seed out the foundational Administrative User.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Ignite the Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`.
**Default Administrative Credentials:**

- **User:** `admin`
- **Pass:** `admin`

---

_Code is meant to be read by humans, and occasionally compiled by machines. Prioritize the clean code lifecycle._
