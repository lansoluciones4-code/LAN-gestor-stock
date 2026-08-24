# CLAUDE.md — Guía completa del proyecto

Guía de referencia para cualquier agente de IA que trabaje en este repositorio sin contexto previo. Complementa (no reemplaza) a `README.md` — el README es la guía de instalación/setup orientada a humanos; este archivo es el mapa completo de arquitectura, reglas de negocio y trampas conocidas.

## 1. Qué es este proyecto

**ArgenStock** es el sistema de gestión de stock + punto de venta (POS) + catálogo público para "LAN Soluciones Tecnológicas", un comercio de tecnología con dos rubros de negocio: **Tech** y **Librería**.

El mismo código fuente sirve **dos productos distintos** desde el mismo repo:

1. **El gestor interno**: la app de administración completa (stock, ventas, clientes, proveedores, usuarios, auditoría). Corre en Docker, en la LAN del negocio, sin acceso desde internet.
2. **El sitio público**: un catálogo de solo-lectura (`/home`, `/product/[id]`) desplegado en Vercel, que cualquiera puede visitar desde internet.

Esta dualidad es la decisión arquitectónica más importante del proyecto — ver sección 2.

## 2. La regla más importante: aislamiento gestor / sitio público

**El código del gestor (`src/app/(main)/**`, `src/app/(auth)/**` y sus Server Actions de negocio) nunca debe quedar alcanzable desde el sitio público en Vercel.** Si estás trabajando "en el sitio público" y el pedido es ambiguo sobre si debe tocar el gestor, asumí que **no** — mantenelos aislados salvo que se diga explícitamente lo contrario.

Hay **tres capas de defensa independientes** para esto:

1. **Borrado físico en build-time**: `scripts/prepare-vercel-build.js`, ejecutado solo por `npm run build:public`, borra con `fs.rmSync` las carpetas `src/app/(main)` y `src/app/(auth)` **antes** de correr `next build`. El código de gestión ni siquiera queda bundleado. El build local (`npm run build`, usado por Docker/LAN) nunca corre este script — ahí sí se compila todo.
2. **Redirect en runtime**: `src/proxy.ts` (el middleware de Next 16 — reemplaza a `middleware.ts`, que ya no existe en este proyecto). Si `process.env.DEPLOYMENT_MODE === 'public'` y la ruta pedida no es pública, redirige a `/home`.
3. **Aislamiento de Server Actions por archivo**: cada feature que el catálogo público necesita expone sus lecturas en un archivo separado y minimalista `public-*.actions.ts` (ej. `src/features/product/actions/public-product.actions.ts`), en vez de reusar el archivo de actions completo del gestor. Como Next.js empaqueta cada Server Action como su propio endpoint según qué la importe transitivamente, esta separación es la única forma de garantizar que crear/editar/borrar producto (u otra mutación de negocio) no quede expuesto como endpoint público.

**Qué es de cada lado:**

| Público (sobrevive el build de Vercel) | Gestor (se borra en el build público) |
|---|---|
| `src/app/home/**` (catálogo/landing) | `src/app/(main)/**` (dashboard, productos, ventas, clientes, proveedores, categorías, servicios-técnicos, tarjetas, usuarios, logs) |
| `src/app/product/[id]/**` (ficha de producto) | `src/app/(auth)/**` (login) |
| `src/app/api/product-photos/route.ts` | Todas las Server Actions "de negocio" (`*.actions.ts` sin prefijo `public-`) |
| `public-*.actions.ts` de cada feature | |
| Layouts raíz (`src/app/layout.tsx`, `providers.tsx`, `globals.css`) | |

**Flujo de datos entre local y público**: no hay sync automática. Un botón manual en el dashboard ("Publicar cambios al sitio web", admin-only) dispara `publicarStock()` en `src/features/sync/actions/publish-stock.actions.ts`: lee todo el catálogo de la base LOCAL y lo reescribe (DELETE + INSERT en transacción) en una base Supabase separada, vía un pool de conexión propio (`src/lib/db/supabase-pool.ts`, usa `SUPABASE_DB_URL`). Solo se replican `devices`, `providers`, `products`, `productImages`, `appSettings`. **Nunca** se replican `users`, `sales`, `customers`, `auditLogs` — esas tablas son exclusivamente locales.

## 3. Stack técnico

| Área | Tecnología |
|---|---|
| Framework | **Next.js 16** (App Router, React Server Components + Server Actions — se evita deliberadamente usar Route Handlers salvo excepciones puntuales) |
| UI | **React 19**, **Tailwind CSS v4** (config CSS-first, sin `tailwind.config.ts`), **lucide-react** (iconos), **framer-motion** (animaciones), **next-themes** (dark mode) |
| Estado cliente | **Zustand** (un store simple `{ items, isLoaded, setItems, setLoaded }` por feature) |
| Formularios/validación | **react-hook-form** + **Zod** (schemas Zod derivados de las tablas Drizzle vía **drizzle-zod**) |
| Base de datos | **PostgreSQL** + **Drizzle ORM** (driver `pg` crudo, `drizzle-orm/node-postgres`) |
| Auth | **jose** (JWT, compatible con Edge runtime) + **bcrypt** (hash de contraseñas) |
| Imágenes | **Cloudinary** |
| PDF/capturas | **html2canvas** + **jspdf** |
| Listas grandes | **react-virtuoso** (tablas virtualizadas) |
| Logging | **pino** |
| Testing | **Playwright** |

## 4. Cómo correr el proyecto localmente

Setup paso a paso completo en `README.md` — resumen: `docker compose up -d` levanta `db` (Postgres 16, solo `127.0.0.1`) + `app` (el gestor, expuesto a toda la LAN en `0.0.0.0:3000`). Un tercer servicio `migrator` (perfil `tools`, no se levanta con `up`) corre los scripts `db:*` vía `docker compose run --rm migrator <script>` — pensado para que el servidor del cliente solo necesite Docker, sin Node instalado.

Variables de entorno clave (`.env.example`):

- `DATABASE_URL` / `DB_PASSWORD` — Postgres local (contenedor `db`). Desde la migración a LAN, el gestor **solo** habla con este Postgres local, nunca con Supabase directamente.
- `LOCAL_DATABASE_URL` — fallback para `npm run dev` fuera de Docker.
- `SUPABASE_DB_URL` — connection string de escritura a Postgres de Supabase, usada **únicamente** por "Publicar cambios al sitio web". Nunca debe guardarse en el código ni en Vercel.
- `JWT_SECRET`, `CLOUDINARY_URL`.
- `DEPLOYMENT_MODE=public` — solo se setea en Vercel; habilita el recorte de rutas en `src/proxy.ts` (ver sección 2).

Credenciales demo tras el seed: `admin/admin` y `vendedor/vendedor` (el README insiste en crear credenciales reales y desactivar las demo desde `/usuarios` antes de ir a producción).

## 5. Scripts de `package.json`

| Script | Qué hace |
|---|---|
| `dev` | Servidor de desarrollo (`next dev`) |
| `build` | Build completo (incluye gestor) — el que usa Docker/LAN |
| `build:public` | `prepare-vercel-build.js` (borra rutas de gestión) + `next build` — el que usa Vercel |
| `start` | Levanta el build de producción ya generado |
| `lint` | ESLint 9 (flat config) |
| `db:generate` | Genera migraciones SQL desde `src/lib/db/schema.ts` |
| `db:migrate` | Aplica migraciones pendientes |
| `db:seed` / `db:reset-data` | Alias del mismo script (`setup-initial-data.ts`) — datos base/operativos, sin tocar usuarios |
| `db:seed-users` | Crea las cuentas demo `admin`/`vendedor` |
| `db:reset-full` | Wipe destructivo completo de la base |
| `db:stress-test` | Datos masivos mock para pruebas de performance |
| `db:backfill-cost` | Backfill histórico de `sale_items.unit_cost` |
| `db:enable-unaccent` | Activa la extensión Postgres `unaccent` (necesaria para la búsqueda de auditoría insensible a tildes) |

## 6. Arquitectura de carpetas

```
src/
  app/
    (auth)/login/              # gestor — login
    (main)/                    # gestor — panel de administración completo
      categorias/ clientes/ logs/ productos/ proveedores/
      servicios-tecnicos/ tarjetas/ usuarios/ ventas/
    home/                      # público — catálogo/landing
    product/[id]/              # público — ficha de producto
    api/product-photos/        # único Route Handler (subida de fotos, multipart)
    globals.css layout.tsx providers.tsx
  components/ui/                # componentes genéricos compartidos (ver sección 11)
  components/contact/           # ContactButtons (WhatsApp), usado en el sitio público
  config/tables/                # *-columns.tsx — definiciones de columna por entidad
  config/cards/                 # *-card.tsx — render de card mobile por entidad
  constants/test-ids.ts         # data-testid centralizados para Playwright
  features/<dominio>/           # núcleo de la arquitectura — ver abajo
  hooks/                        # use-entity-manager, use-entity-actions, use-auto-sync
  lib/
    auth/ (jwt.ts, utils.ts)
    db/ (index.ts, schema.ts, supabase-pool.ts, migrations/, scripts/)
    action-result.ts audit-logs.ts cloudinary.ts db-errors.ts errors.ts utils.ts
  stores/index.ts               # invalidateAllCaches() y registro de stores globales
  proxy.ts                      # middleware de Next 16
```

### Patrón por feature: `src/features/<dominio>/{domain,repository,actions,store,ui}`

No todas las features tienen las 5 subcarpetas — cada una tiene solo lo que su dominio necesita (ej. `settings` no tiene `domain` ni `ui`; `sync` solo tiene `actions`). Features existentes: `audit`, `auth`, `card`, `customer`, `device`, `product`, `provider`, `sale`, `settings`, `stats`, `sync`, `technical-service`, `user`.

Qué hace cada capa (ejemplos reales en `src/features/product/`):

- **`domain/*.schema.ts`** — schemas Zod (a menudo derivados de las tablas Drizzle vía `createInsertSchema`/`createSelectSchema` de drizzle-zod) + tipos inferidos. Patrón **dual-schema**: un `*InputSchema` (lo que manda el form, con transforms para campos numéricos) y un `*RowSchema`/`*Def` (shape de lectura desde DB, con relaciones anidadas). Ej: `product.schema.ts` → `productCreateSchema`, `productUpdateSchema` (con `version` para optimistic locking), `productRowSchema`/`ProductDef`.
- **`repository/*.repository.ts`** — clases con queries Drizzle puras (`ProductRepository`). Nunca validan input de Zod ni tocan sesión/HTTP. Aceptan un `dbtx` opcional para participar de transacciones armadas en `actions/`.
- **`actions/*.actions.ts`** — Server Actions (`'use server'`), delgadas: `verifyAuthOrAdmin()` → `schema.safeParse(input)` → repository (a veces en `db.transaction()`) → `recordAuditLog()` → devuelven `ActionResult<T>`.
- **`store/*.store.ts`** — Zustand, patrón mínimo: `{ items: T[], isLoaded, setItems, setLoaded }`. Convención de nombre singular: `useProductStore`, no `useProductsStore`.
- **`ui/`** — componentes específicos del feature (modales de formulario, managers).

Piezas transversales que sostienen el patrón: `src/lib/action-result.ts` (`ActionResult<T>`), `src/lib/auth/utils.ts` (`verifyAuthOrAdmin`), `src/lib/audit-logs.ts` (`recordAuditLog`), `src/lib/db-errors.ts`/`src/lib/errors.ts` (`ConcurrencyError`, `DuplicateEntityError`).

## 7. Rutas de la aplicación

### Gestor (`(main)`, todas requieren sesión; layout en `src/app/(main)/layout.tsx`)

| Ruta | Qué es |
|---|---|
| `/` | Dashboard de estadísticas (KPIs, ingresos por medio de pago, top vendedores, botón "Publicar cambios al sitio web") |
| `/productos` | Stock: CRUD de productos, fotos, visibilidad en catálogo (individual y masiva) |
| `/ventas` | POS: armar venta, cobrar, historial |
| `/clientes` | Cartera de clientes |
| `/proveedores` | Distribuidores/mayoristas |
| `/categorias` | "Alta de productos" — gestión de `devices` (los modelos/equipos que luego se instancian como stock) |
| `/servicios-tecnicos` | Catálogo de servicios técnicos vendibles |
| `/tarjetas` | Tarjetas aceptadas + recargo por cuotas |
| `/usuarios` | Cuentas admin/vendedor |
| `/logs` | Auditoría |

`(auth)/login` — login.

### Público

`home/` (catálogo, ISR `revalidate=30`) y `product/[id]/` (ficha de producto) — ver estructura de componentes en sección 11.

## 8. Autenticación y roles (RBAC)

- Sesión: cookie `session` (JWT firmado con `jose`/HS256, 24h), `httpOnly: true`, **`secure: false`** (deliberado: el gestor corre sobre HTTP plano en LAN sin TLS), `sameSite: 'lax'`.
- `src/lib/auth/jwt.ts` — `signToken`/`verifyToken`.
- `src/lib/auth/utils.ts` — `verifyAuthOrAdmin(requireAdmin = true)`: valida el JWT **y** revalida contra la DB que el usuario sigue existiendo y activo (invalida sesiones de usuarios desactivados). Es el guard estándar en casi todas las Server Actions de negocio.
- `src/proxy.ts` — capa de RBAC en runtime: rutas públicas, rutas permitidas para `vendedor` (`/productos`, `/ventas`, `/clientes`, `/api/product-photos`), y el recorte por `DEPLOYMENT_MODE=public` (sección 2).

Roles: **`admin`** y **`vendedor`**. Navegación filtrada por rol en `src/app/(main)/layout.tsx` (array `navigation`/`adminNavigation` con campo `roles`).

**Qué puede mutar cada rol** (según `verifyAuthOrAdmin(...)` en cada `*.actions.ts`):

| Entidad | Vendedor | Admin |
|---|---|---|
| Product | Puede crear (ingresar stock) | Todo — incluye editar, borrar, pérdidas, visibilidad |
| Sale | Puede crear y listar | + anular venta (`deleteSaleAction`) |
| Customer | Puede crear/editar | + activar/desactivar/borrar |
| Provider, Device, Card, TechnicalService | Solo lectura (las necesita para operar el POS) | Todo (CRUD completo) |
| Settings (`showPrices`) | Solo lectura | Escritura |
| User | Sin acceso | Todo |

## 9. Modelo de datos (`src/lib/db/schema.ts`)

### Enums Postgres

| Enum | Valores |
|---|---|
| `role` | `admin`, `vendedor` |
| `payment_type` | `efectivo`, `transferencia`, `debito`, `credito` |
| `business_section` | `tech`, `impresiones`, `libreria` (⚠️ ver gotcha en sección 13 — `impresiones` nunca se usa en `devices`) |
| `color_mode` | `color`, `blanco_y_negro` (nullable) |
| `print_kind` | `fotocopia`, `impresion` |

### Tablas principales

| Tabla | Para qué sirve | Relaciones clave |
|---|---|---|
| `users` | Cuentas del gestor | `role`, `isActive`, `version` |
| `devices` | Ficha de "tipo de equipo" (modelo + marca + categoría + `section: tech\|libreria`) | 1→N `products` |
| `providers` | Proveedores/distribuidores | 1→N `products` |
| `products` | Lote de stock concreto de un `device` (precio, cantidad, proveedor propios) — **única entidad de catálogo sin soft-delete** | N→1 `device`, N→1 `provider`, 1→N `productImages` |
| `productImages` | Fotos en Cloudinary (PK = `publicId` de Cloudinary) | N→1 `products` |
| `customers` | Clientes, `documentNumber` único | 1→N `sales` |
| `technicalServices` | Catálogo de servicio técnico (`value` = precio de lista) | vendible vía `saleServiceItems` |
| `cards` + `cardInstallments` | Tarjetas aceptadas + recargo por cuota (`installments`, `interestPercentage`) | `cards` 1→N `cardInstallments`, 1→N `salePayments` |
| `sales` | Cabecera de venta (combina productos + impresiones + servicios en un solo registro), `saleNumber` autoincremental, `discountAmount`/`discountPercentage` generales | 1→N `saleItems`/`salePrintItems`/`saleServiceItems`/`salePayments` |
| `saleItems` | Línea de producto de stock, con `unitCost` snapshot | N→1 `sales`, N→1 `products` |
| `salePrintItems` | Línea de fotocopia/impresión — sin catálogo de precio propio, el importe se carga libre | N→1 `sales` |
| `saleServiceItems` | Línea de servicio técnico | N→1 `sales`, N→1 `technicalServices` |
| `salePayments` | Medio de pago de la venta (**regla de negocio actual: máx. 1 por venta**, aunque el modelo soporta N) | N→1 `sales`, N→1 `cards` (nullable) |
| `auditLogs` | Trazabilidad — `entityId` sin FK real, se resuelve contra 8 tablas posibles vía relaciones homónimas; el discriminador real es el string `entity` | polimórfica |
| `productLosses` | Mermas/pérdidas de stock | N→1 `products`, N→1 `users` |
| `appSettings` | Fila única (singleton) — hoy solo `showPrices` (si el catálogo público muestra precios) | — |

Todas las tablas de catálogo mutable (`users`, `devices`, `providers`, `technicalServices`, `cards`, `customers`, `products`) tienen `version integer` para **optimistic locking** — todo `UPDATE` filtra por `version` y lanza `ConcurrencyError` si no matchea.

## 10. Reglas de negocio clave

- **Descuentos, dos niveles independientes**: por ítem (0-100%, capturado en el carrito, componente compartido `DiscountControl`) y general de la venta (capturado en el modal de pago). El servidor **siempre recalcula** el precio real aplicando el % sobre el precio de catálogo vigente en DB — nunca confía en el `unitPrice` que manda el cliente (excepto en `salePrintItems`, que no tienen catálogo de precio propio). El % de descuento por ítem **no se persiste**, solo el precio ya neto resultante.
- **Stock y concurrencia**: al vender, `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty` — si 0 filas afectadas, error de conflicto de stock. Anular una venta (`deleteSaleAction`, admin-only) usa `SELECT ... FOR UPDATE` y restablece el stock antes de borrar todo en cascada.
- **Nueva Venta vs Venta Rápida** (`src/app/(main)/ventas/`, ambas usan el mismo backend `createSaleAction`): Nueva Venta tiene selector de cliente obligatorio, tabs por sección (Tech/Librería/Impresiones/Servicio técnico), y pregunta modo color en impresiones. Venta Rápida no pide cliente (consumidor final), mezcla todo el stock sin tabs, y agrega fotocopias/impresiones con un botón directo sin preguntar color (`colorMode: null`).
- **Tech / Librería / Impresiones**: es el campo `devices.section`. En la práctica solo `tech`/`libreria` se asignan a un `device` (restringido por Zod) — `impresiones` es únicamente el id de una pestaña en la UI de ventas, sin catálogo de stock propio (las impresiones se cargan directo como `salePrintItems`).
- **Visibilidad de catálogo** (`products.showOnLanding`): toggle individual por producto (ícono de ojo) y toggle masivo por sección — dropdown "Visibilidad masiva" en `/productos` (`bulkSetProductVisibilityBySectionAction`, solo `tech`/`libreria`, admin-only, auditado). El catálogo público (`fetchLandingProducts`) solo trae productos con `showOnLanding=true`; la lista de categorías del sitio público se filtra en el cliente (`catalog-client.tsx`) para no mostrar categorías sin productos visibles.
- **Tarjetas/cuotas**: el front sugiere el monto con recargo (`total * (1 + interés/100)`), pero **el servidor no valida el % de interés** — solo exige que el pago cubra el total esperado de la venta.
- **Servicio técnico**: es simplemente una línea vendible más dentro de una venta (`saleServiceItems`); no hay concepto de "orden de reparación" con estados propios.
- **Auditoría**: casi toda mutación llama a `recordAuditLog(userId, action, entity, entityId, detail, tx)` **dentro de la misma transacción** de la operación de negocio.
- **Reactivación al crear**: crear una entidad (provider/device/customer/card/technicalService/user) con un nombre/DNI/username que ya existe **inactivo** la reactiva y actualiza en vez de duplicarla (`wasInactive: true`).

### Soft delete vs hard delete por entidad

| Entidad | Soft delete (`isActive`) | Hard delete | Bloqueado si... |
|---|---|---|---|
| Device, Provider | Sí | Sí | tiene `products` asociados |
| Customer | Sí | Sí | tiene alguna `sale` |
| Card | Sí | Sí | tiene algún `salePayment` |
| TechnicalService | Sí | Sí | tiene algún `saleServiceItem` |
| User | Sí (no puede autodesactivarse) | Sí, pero exige estar **ya inactivo** + sin historial (`auditLogs`/`sales`/`productLosses`) | está activo, o tiene historial |
| **Product** | **No tiene `isActive`** | Sí | tiene `saleItems` o `productLosses` |
| Sale | No aplica | Sí ("anular", restablece stock) | — (solo admin) |

## 11. Convenciones de UI

### Hooks compartidos (`src/hooks/`) — se combinan en casi todos los paneles de `(main)`

1. **`use-entity-manager.ts`** — estado de UI de un panel CRUD: modal abierto/item en edición, item pendiente de borrado, texto de búsqueda, mensaje global con auto-dismiss.
2. **`use-entity-actions.ts`** — flujo de datos contra Server Actions: recibe `{ fetchData, createAction, updateAction, deleteAction }`, expone `syncData`/`handleEditSubmit`/`handleDelete` envueltos en `useTransition`, invalida cachés y refetchea tras cada mutación exitosa.
3. **`use-auto-sync.ts`** — sincroniza al montar (skeleton solo si no había datos cacheados) y al recuperar foco la pestaña (con throttle de 15s).

Patrón típico de un panel (referencia: `src/app/(main)/productos/products-panel.tsx`): store Zustand del feature + los 3 hooks de arriba + `columns = getXColumns({...})` (sección config-driven) → todo eso alimenta `<PanelToolbar>` + `<GlobalMessage>` + `<ResponsivePanelView columns data renderCard={renderXCard({...})}>` + `<ResponsiveModal>`/`<ConfirmModal>`.

### Componentes compartidos clave (`src/components/ui/`)

- **`PanelToolbar`** — barra superior estándar: búsqueda + slot `filters` (drawer en mobile, inline en `xl+`) + slot `sync` + slot `actions`.
- **`ResponsivePanelView<T>`** — decide el layout: `VirtualizedDataTable` en `xl+`, lista de `EntityCard` (vía `renderCard`) en mobile/tablet. Punto de entrada único de casi todos los paneles.
- **`VirtualizedDataTable`** — tabla virtualizada (`react-virtuoso`), tipo `ColumnDef<T>`.
- **`EntityCard`** / **`CardAction`** — card genérica mobile con acciones colapsadas en dropdown `⋮`.
- **`ResponsiveModal`** / **`ConfirmModal`** — modal de formulario genérico y modal de confirmación de borrado.
- **`ToggleFilter`** — checkbox tipo pill para filtros booleanos.
- **`GlobalMessage`** / **`ErrorAlert`** — banners de éxito/error.
- **`Combobox`** — select buscable con portal a `document.body`, soporta modo texto libre y "agregar nuevo".
- Otros: `Button`, `Modal` (primitivas), `Table` (primitivas), `TableSkeleton`, `SearchBar`, `PageHeader`, `ThemeToggle`.

### Patrón config-driven UI

`src/config/tables/*-columns.tsx` exporta `getXColumns({ role, onEdit, onDelete, ... })` → `ColumnDef<T>[]` para la tabla desktop. `src/config/cards/*-card.tsx` exporta `renderXCard({...})` → función `(item) => <EntityCard .../>` para `ResponsivePanelView` en mobile. El filtrado por rol (`role === 'admin'`) se resuelve dentro de estas funciones (ocultando columnas/botones/precio de costo), no en el panel.

### Sitio público (`src/app/home/`, `src/app/product/[id]/`)

`home/page.tsx` (Server Component, ISR 30s) pide en paralelo productos/categorías/`showPrices` y renderiza `<CatalogClient>`, que orquesta: `catalog/use-catalog-filters.ts` (búsqueda/categoría/precio/paginación), `catalog-sidebar.tsx` (desktop), `catalog-controls.tsx` + `mobile-filter-drawer.tsx` (mobile), `catalog-grid.tsx` → `product-card.tsx` (carrusel de imágenes, muestra solo imagen/descripción/precio — sin el nombre del modelo). La ficha (`product/[id]/page.tsx`) usa `product-info.tsx` + `product-image-view.tsx`. `ContactButtons` (`src/components/contact/`) es compartido entre ambos.

### Estilo visual

Paleta predominante **zinc** con acentos **sky** en el sitio público; semántica de estado con `emerald`/`amber`/`red`. Dark mode vía clase `.dark` (`next-themes`, `attribute='class'`). `rounded-lg` en controles, `rounded-xl`/`2xl` en cards/modales, `rounded-full` en pills/avatares. `shadow-sm` por defecto. Iconografía: siempre `lucide-react`. Animaciones: `animate-in`/`fade-in`/`slide-in-from-*` (Tailwind) para dropdowns/popovers, `framer-motion` para transiciones más complejas (drawers, carruseles con swipe). **Breakpoint `xl` es el corte tabla-vs-card** en toda la app (no `md`/`lg`). Moneda siempre con `toLocaleString('es-AR', ...)`.

## 12. Testing

**Playwright** (`playwright.config.ts`, `testDir: './tests'`, `baseURL: http://localhost:3000` — requiere el server corriendo aparte). Proyecto `setup` (login, genera `playwright/.auth/user.json`) del que dependen `chromium`/`firefox`/`webkit`.

```bash
npm run db:reset-data           # resetear datos antes de correr pruebas (no reinicia usuarios)
npx playwright test tests/nombre.spec.ts [--project=chromium] [--headed]
npx playwright test tests       # toda la carpeta
npx playwright show-report
```

⚠️ `tests/readme.md` menciona `npm run db:reset-data-hard`, que **no existe** en `package.json` — el script real es `db:reset-data`.

Specs por dominio en `tests/`: `clientes`, `concurrencia`, `equipos`, `landing`, `productos`, `proveedores`, `pruebasCompuestas`, `usuarios`, `ventas`.

## 13. Gotchas y ambigüedades conocidas

- **`business_section: 'impresiones'`** existe en el enum de Postgres pero ningún `device` puede tenerlo (Zod lo restringe a `tech`/`libreria`). Solo es el id de una pestaña en la UI de ventas — no asumas que hay dispositivos/productos de esa "sección".
- **`salePayments`** es 1-a-N en el modelo de datos, pero la regla de negocio actual fuerza **exactamente 1 pago por venta** (`z.array(...).max(1)`). No asumas soporte de pagos mixtos activo hoy.
- El **% de descuento por ítem no se persiste** — el servidor lo aplica una vez sobre el precio de catálogo vigente y solo guarda el precio ya neto resultante; no se puede reconstruir el % original desde la DB.
- **`auditLogs.entityId`** no tiene FK real (es un `uuid` libre); se resuelve contra 8 tablas posibles vía relaciones Drizzle homónimas. El discriminador real es el string `entity`, no hay `CHECK` a nivel DB.
- El **recargo por cuotas de tarjeta lo calcula y confía el cliente** — el servidor solo exige que el pago cubra el total esperado, nunca valida el `interestPercentage`.
- `.agents/rules/coding-standards.md` describe una arquitectura genérica (`domain/application/infrastructure/presentation`, todo el código en inglés, máx. 200 líneas/archivo) que **no coincide del todo con el código real**: la arquitectura real es `features/<dominio>/{domain,repository,actions,store,ui}` (sección 6), y el código real usa español ampliamente en mensajes de error, nombres de acciones de auditoría y comentarios de negocio. Ante una diferencia, priorizá el patrón que efectivamente ves en el código sobre ese archivo de reglas genéricas.
- El `README.md` todavía menciona `middleware.ts` — en este proyecto (Next 16) el archivo real es `src/proxy.ts` con función exportada `proxy()`.

## 14. Antes de escribir código nuevo

- Para un panel CRUD nuevo en `(main)`, reusá el trío `use-entity-manager` + `use-entity-actions` + `use-auto-sync` y el patrón config-driven (`config/tables/`, `config/cards/`) antes de reimplementar el ciclo de carga/mutación a mano — es el patrón que sigue **todo** panel existente.
- Si el cambio es "solo del sitio público" (catálogo/ficha de producto), tocá únicamente `src/app/home/**`, `src/app/product/[id]/**`, sus componentes exclusivos, y `public-*.actions.ts` — nunca archivos de `(main)` ni actions de negocio (sección 2).
- Antes de agregar una tabla/columna nueva, revisá si el dato ya existe en otra forma (ej. `devices.section` como discriminador en vez de tablas separadas por rubro).
