# Roadmap "CAMBIOS FRAN STOCK" — orden de ataque

## Contexto

El cliente (Fran) mandó un PDF con 7 bloques de pedidos (permisos, ítems de venta nuevos, bugs, dashboard, filtros del catálogo público, devoluciones, anchos de tabla). Se investigó cada uno con 3 agentes de exploración en paralelo para medir complejidad real y dependencias antes de secuenciar. Este documento es el **roadmap acordado** — se ataca **un paso a la vez**; cada paso, al llegar su turno, recibe su propia ronda corta de plan/preguntas si aparece algo puntual no cubierto acá.

Reordenamos el PDF original por riesgo/dependencias, no por su numeración.

## Roadmap

### Paso 1 — Quick wins sin ambigüedad (COMPLETADO)
- **Bug WhatsApp**: número corregido en `src/lib/contact/contact.config.ts` (`phoneNumber`, ahora `2804777200`).
- **Anchos de columna en tabla de Stock** (`/productos`, `src/config/tables/product-columns.tsx`): "Equipo y Detalle" ampliado, "Stock"/"Precio Público"/"Costo"/"Proveedor" achicados, "Acciones" sin ancho fijo (absorbe el sobrante). Afinado con varias rondas de feedback visual del usuario hasta quedar simétrico y con buen espaciado.

### Paso 2 — Permisos del rol "vendedor" (COMPLETADO)
- `createProductAction` (`src/features/product/actions/product.actions.ts`) ahora admin-only — vendedor ya no puede ingresar stock.
- Botón "Ingresar Stock" oculto para vendedor en `products-panel.tsx`.
- "Gestionar Fotos" habilitado para vendedor (puede ver/agregar fotos) pero **no borrar** — `delete-product-photo.ts` ahora exige admin explícitamente, y el botón de borrar se oculta en la UI para vendedor (`ProductPhotosManager`, prop `canDelete`).

### Paso 3 — Bug: preview de imágenes cortado / sin ampliar (COMPLETADO)
- `object-cover` → `object-contain` en el sitio público (`src/app/home/components/product-card.tsx`, `src/app/product/components/product-image-view.tsx`) — la foto se ve entera, sin recortar (con letterbox si no es cuadrada).
- Lightbox con zoom: se instaló `yet-another-react-lightbox` (única librería de UI de terceros del proyecto), wrapper propio en `src/components/ui/image-lightbox.tsx`, botón de "ampliar" agregado en ambas pantallas, sincronizado con el índice del carrusel chico.
- Follow-ups: botón de ampliar visible siempre en mobile (antes solo con `:hover`, invisible en touch); `carousel={{ finite: true }}` para que no "loopee" cuando el producto tiene una sola foto.

### Paso 3.5 — Desligar el entorno local de la Supabase real (COMPLETADO, lo hizo el usuario)
- Incidente: al probar los pasos anteriores, se publicó accidentalmente el stock de prueba local al catálogo real (Supabase producción) vía "Publicar cambios al sitio web".
- El usuario sacó `SUPABASE_DB_URL` de su `.env` local (no versionado — no afecta el `.env` del cliente en el deploy real de la tienda, archivo separado en otra máquina). El botón ahora falla con un error explícito en vez de tocar Supabase. Reversible cuando se quiera publicar de verdad.
- Pendiente fuera del alcance del código: el usuario evalúa si puede restaurar el catálogo real pisado (backup/point-in-time recovery de Supabase).

### Paso 4 — Dashboard, parte 1: filtro "del día" + limpieza de tarjetas (COMPLETADO)
- `src/app/(main)/page.tsx`: nuevo helper `todayStr()`; `startDate`/`endDate` arrancan en "hoy"; el `useEffect` de montaje ya no depende de `isLoaded` (Zustand) — siempre pide stats de "hoy" al entrar al dashboard. Corrige un bug real: antes, si ya habías visitado el dashboard en la sesión, re-entrar no volvía a pedir datos y quedaba mostrando el último filtro usado.
- Las 2 KPI cards "Stock Bajo" y "Unidades Físicas" se sacaron de la grilla superior. A pedido del usuario, **no se eliminaron del todo**: junto con "Bruto Ventas"/"Ganancia Real"/"Valor en Stock", quedaron vaciadas de contenido (se conserva el ícono/header de cada tarjeta, sin label ni valor) — son 5 cascarones listos para reemplazar en un futuro paso (probablemente ligado al desglose por rubro del Paso 6). Las tarjetas de texto de abajo ("Actividad Reciente"/"Alerta de Stock") quedaron intactas, con sus datos.
- El aviso "Última sincronización" (+ error de publicación) se reposicionó: ahora va arriba del botón "Publicar cambios al sitio web", en su propia línea sin cortarse — antes estaba al lado y rompía el layout en pantallas angostas.

### Paso 5 — Ítems de venta nuevos: Hora de Ciber, Anillados/Plastificados, Trámites Online (COMPLETADO)
- **Migración**: enum `print_kind` +3 valores (`ciber`, `anillado_plastificado`, `tramite`); columnas nuevas `title`/`quantity` (nullable) en `sale_print_items`.
- **Config central** `src/lib/print-kinds.ts` (label, ícono y campo extra por kind — `none`/`colorMode`/`hours`/`title`), reemplaza ternarias sueltas que había en 4 archivos.
- **Venta Rápida** (`quick-sale-view.tsx`): fila de 5 botones con scroll horizontal (`QuickAddButton`, generalizado); Ciber pide horas+monto, Trámites pide "Operación" (nombre)+monto, Anillados/Plastificados solo monto. Ancho fijo 190px por botón, simétrico, con wrap a 2 líneas si hace falta.
- **Nueva Venta** (`sale-builder-view.tsx`): 7 tabs con scroll horizontal (`flex-1 min-w-[130px]` — se reparten parejo si entran todos, scrollean si no); mismo set de campos por kind que en Venta Rápida. Se corrigió en el camino un bug real: el id del tab "Impresiones" es plural (`'impresiones'`) pero el `kind` de la DB es singular (`'impresion'`) — se agregó un mapeo explícito (`TAB_TO_PRINT_KIND`) para no guardar un kind inválido.
- **Recibo/factura** (`sales-print-view.tsx`): cada línea nueva sale identificada (horas de Ciber, nombre del trámite, etc.), no solo genérica — columna renombrada de "Modo" a "Concepto".
- **Reglas de negocio confirmadas**: ninguno de los 3 lleva stock contable; la cantidad de horas de Ciber es puramente informativa (sin cálculo automático de tarifa, el monto se carga a mano); Trámites es nombre + monto únicamente (sin descripción); no se tocó ni se desactivó nada del catálogo viejo de Servicio Técnico.
- **Incidente crítico resuelto en el camino**: la migración quedó registrada como "aplicada" en `drizzle.__drizzle_migrations` sin haber ejecutado realmente los `ALTER TABLE`/`ALTER TYPE` contra la base local — esto rompió **todas** las ventas (no solo las de los kinds nuevos), con el error `column sales_printItems.title does not exist`. Se diagnosticó inspeccionando la tabla real con `psql` y se corrigió aplicando manualmente las sentencias DDL faltantes (de forma idempotente, `IF NOT EXISTS`) directo contra la base. No se determinó la causa raíz exacta de la desincronización.

## Cómo seguimos

Pasos 1 a 7 (y 7.1, 10, 11, 12) completados y probados por el usuario. Sigue el **Paso 8** (catálogo público: ordenar por precio). Los pasos siguientes se abordan de a uno, con una ronda de plan corta puntual si aparece algo no cubierto acá.

### Paso 6 — Dashboard, parte 2: rediseño completo de la grilla de KPIs (COMPLETADO)
El pedido original de "desglose por rubro" del PDF creció, en la ronda de plan de este paso, a un rediseño completo de la grilla superior del dashboard — los 5 cascarones vacíos del Paso 4 se eliminaron por completo (no sobrevivió ninguno tal cual estaba).

- **`src/features/stats/actions/stats.actions.ts`**: la query de `fetchDashboardStats` ahora también pide `items.product.device` (para leer `section`), `printItems` y `serviceItems`. Nuevos campos devueltos: `techRevenue`, `libreriaRevenue` (incluye `anillado_plastificado`), `impresionesRevenue` (`fotocopia`+`impresion`), `ciberRevenue`, `tramitesRevenue`, `servicioTecnicoRevenue` — todos suma de `subtotal` por línea. `netProfit`/`salesCount`/los 4 `*Revenue` de medios de pago no cambiaron de cálculo, solo de posición en la UI.
- **`src/app/(main)/page.tsx`**: la grilla de KPIs (4 columnas) tiene 12 tarjetas en 3 filas fijas:
  - Fila 1: Tech, Librería, Impresiones, Servicio Técnico
  - Fila 2: Ciber, Trámites Online, Órdenes Procesadas, Ganancias
  - Fila 3: Transferencia, Crédito, Efectivo, Débito (antes apilados de a 2 por celda, ahora cada uno ocupa una tarjeta completa)
  - Las 6 tarjetas de rubro se generan desde un array de config (`BUSINESS_KPIS`) con íconos `Cpu`/`BookOpen`/`Printer`/`Wrench`/`Monitor`/`FileText`. "Ganancias" conserva el estilo destacado que tenía "NETO"; "Órdenes Procesadas" conserva su estilo previo.
- **Ajustes visuales finales** (a pedido del usuario, tras verlo funcionando): altura de las 12 tarjetas reducida (`p-5`→`p-4`, `mb-4`→`mb-3`); íconos de las 6 tarjetas de rubro coloreados individualmente (Tech azul, Librería verde, Impresiones amarillo, Servicio Técnico blanco, Ciber rojo, Trámites gris resaltado — vía campo `iconColor` en `BUSINESS_KPIS`); marco de "Órdenes Procesadas" en amarillo y luego cambiado a azul oscuro (marco + ícono); marco de "Ganancias" cambiado de indigo a verde y luego intensificado ("que brille más": `border-2`, `shadow-lg`, `ring-4`).
- Verificado con `tsc --noEmit`, `eslint`, `npm run build` y probado en vivo por el usuario en Docker — sin observaciones pendientes.

### Paso 7 — Devolución de mercadería (COMPLETADO)
**Confirmado por el usuario tras investigación de código**: ajuste independiente por producto elegido directo del catálogo (no vinculado a una venta histórica — se descartó buscar en el historial de ventas porque hoy no filtra por producto ni tiene UI de detalle de línea, y no hay precedente de reposición parcial de stock). Monto de carga 100% manual. Solo alta + listado (sin editar/borrar). Admin-only.

- **`src/lib/db/schema.ts`**: tabla nueva `product_returns` (`productId`, `userId`, `quantity`, `reason`, `amount numeric(10,2)`, `createdAt`) — mismo esqueleto que `product_losses` más `amount`. Relaciones agregadas a `productsRelations`/`usersRelations`.
- **Feature nueva `src/features/product-return/`** (domain/repository/actions/store), clonando el patrón de `provider`/`customer`: `createReturn()` sube stock (`stock + quantity`, sin guard de suficiencia porque sumar nunca viola `>= 0`) y no tiene equivalente de `updateAction`/`deleteAction`.
- **Panel `/devoluciones`** (`src/app/(main)/devoluciones/`): entrada nueva en `adminNavigation` de `layout.tsx`.
- **Revisión del selector de producto (Paso 7.1, a pedido del usuario tras ver el resultado)**: el `Combobox` de búsqueda inicial se reemplazó por `src/features/product-return/ui/components/return-form-modal.tsx`, un modal de 2 estados — sin producto elegido muestra una lista cliqueable de productos (mismo estilo que las filas de Venta Rápida: nombre, stock, precio; click simple, sin filtrar stock 0) y al clickear uno pasa a mostrar Cantidad/Motivo/Monto ya precargados (`quantity: 1`, `amount: salePrice`) pero editables, con botón "Cambiar producto" para volver a la lista. `returns-panel.tsx` quedó simplificado (ya no arma el form inline).
- **Auditoría**: `action: 'DEVOLUCIÓN'`, `entity: 'PRODUCT'` — sumado al `actionMapping` de `/logs` y a los mapas de color de `audit-columns.tsx`/`audit-card.tsx`.
- **Dashboard**: `totalReturnValue` (suma de `amount` en el rango de fechas) ahora resta de `netProfit` en `fetchDashboardStats`, junto a `totalLossCost` — impacta la tarjeta "Ganancias" del Paso 6, sin tarjeta KPI propia por ahora.
- **Incidente de migración (mismo patrón que el del Paso 5, causa raíz encontrada esta vez)**: el contenedor `migrator` corrió con una imagen de Docker cacheada vieja y reportó "aplicada" sin ejecutar el DDL real. Al reconstruir la imagen (`docker compose build --no-cache migrator`) y reintentar, la migración 0018 (la del Paso 5) volvió a fallar porque su arreglo manual de aquella vez nunca quedó registrado en `drizzle.__drizzle_migrations` — y el migrator de Drizzle solo compara contra el timestamp de la ÚLTIMA fila de esa tabla (no valida un hash por archivo individualmente), así que en cada corrida vuelve a intentar aplicar TODO lo posterior a ese timestamp, incluida una migración ya aplicada a mano. Causa raíz confirmada: cualquier fix manual contra la base (vía `psql` directo) que no pase por `drizzle-kit` deja a `__drizzle_migrations` desincronizada para siempre, rompiendo toda corrida futura de `db:migrate`. Solución aplicada: se calculó el hash sha256 exacto del archivo `0018_handy_blockbuster.sql` (mismo algoritmo que usa `drizzle-orm` internamente, calculado dentro del contenedor para evitar diferencias de fin de línea) y se insertó manualmente la fila faltante en `drizzle.__drizzle_migrations` con ese hash y el `created_at` del journal — recién ahí `db:migrate` pudo saltear la 0018 y aplicar limpiamente la 0019 (`product_returns`). **Lección para el futuro**: cualquier DDL aplicado a mano contra la base (fuera de `drizzle-kit`) tiene que además insertarse en `drizzle.__drizzle_migrations`, o toda migración futura quedará bloqueada de la misma forma.
- Verificado con `tsc --noEmit`, `eslint`, `npm run build`, `psql \d product_returns` (columnas/índices/FKs confirmados), contenedor `app` reconstruido y sano.

### Paso 10 — Dashboard: grilla "Ventas Tech" junto a "Vendedores con Mayor Rendimiento" (COMPLETADO)
Hecho fuera de orden, a pedido explícito del usuario, antes de retomar el Paso 8. Al cliente le encanta la tabla "Vendedores con Mayor Rendimiento" y pidió una segunda grilla al lado: **"Ventas Tech"** — una fila por cada producto Tech vendido en el período filtrado (no agregada, a diferencia de Vendedores), columnas **Producto — Vendedor — Monto** (Producto muestra categoría, marca y modelo), orden cronológico descendente (más reciente arriba), sin límite de filas.

- **`src/features/stats/actions/stats.actions.ts`**: nuevo array `techSales` construido dentro del mismo loop que ya calcula `techRevenue`/`libreriaRevenue` (Paso 6) — por cada línea de venta con `device.section !== 'libreria'`, push `{ productLabel: categoría · marca · modelo, vendorUsername, amount, createdAt }`. Se ordena por `createdAt` desc antes de devolverlo.
- **`src/app/(main)/page.tsx`**: la tarjeta "Vendedores con Mayor Rendimiento" pasa de `lg:col-span-12` a `lg:col-span-6`, con una nueva tarjeta hermana "Ventas Tech" (ícono `Cpu`, mismo estilo visual) al lado.
- **Pedido explícito de UX**: que ambas tarjetas midan siempre lo mismo entre sí y que cada una scrollee dentro de su propio espacio sin mover el dashboard entero. El patrón viejo (`max-h-[400px] overflow-y-auto` sobre contenido de altura variable) no garantizaba eso — se cambió a altura fija compartida (`h-[480px] flex flex-col` en el contenedor externo de ambas tarjetas, `flex-1 overflow-y-auto` en el cuerpo de la tabla en vez de `max-h-[400px]`), así siempre miden igual sin importar cuántas filas tenga cada una.
- Verificado con `tsc --noEmit`, `eslint`, `npm run build` y contenedor `app` reconstruido y sano.

### Paso 11 — Bug crítico: filtro de fecha del dashboard/auditoría desfasado por huso horario (COMPLETADO)
El usuario reportó que el dashboard filtrado a "hoy" mostraba ventas de otro vendedor que **no eran de hoy**. Diagnóstico confirmado con el entorno real de Docker: el contenedor `app` (Node) y el contenedor `db` (Postgres) corren en **UTC**, pero el filtro de fecha (`fetchDashboardStats`, `src/features/stats/actions/stats.actions.ts`) armaba los límites con `new Date(startDate + 'T00:00:00')` — un string ISO sin sufijo de zona horaria se interpreta como hora **local del proceso que lo ejecuta** (el server, en UTC), no como hora de Argentina (ART, UTC-3, sin horario de verano desde 2009). El rango real que se terminaba filtrando era "sábado 21:00 ART → domingo 20:59:59 ART" en vez de "domingo 00:00 a 23:59 ART" — cualquier venta hecha la noche anterior entre las 21:00 y medianoche ART se colaba como si fuera de "hoy". Mismo bug en `src/features/audit/repository/audit-log.repository.ts` (filtro de fecha de `/logs`).

- **Fix**: nuevo helper `argDateRangeBounds(startDate?, endDate?)` en `src/lib/utils.ts`, que arma los límites con offset `-03:00` explícito (`new Date(`${startDate}T00:00:00-03:00`)`) — correcto sin importar en qué huso esté el contenedor. Reemplazado el cálculo inline en `stats.actions.ts` y `audit-log.repository.ts`.
- **No** se tocó el filtro de fecha del historial de ventas (`sales-list-view.tsx`) — ese corre en el navegador del cliente, que ya está en hora ART, así que no tenía el bug (aplicar el mismo fix ahí habría introducido un desfase nuevo).
- Verificado con `tsc --noEmit`, `eslint`, `npm run build`, contenedor `app` reconstruido y sano, y aritmética de fechas confirmada a mano (`new Date('2026-08-23T00:00:00-03:00').toISOString()` → `03:00:00Z`, exactamente medianoche ART).

### Paso 12 — Permiso puntual de Devoluciones para un vendedor específico (COMPLETADO)
El cliente quiere que UN vendedor puntual pueda registrar devoluciones sin volverlo admin. Se agregó un checkmark en la tabla de `/usuarios` (visible solo en filas `role: 'vendedor'`) que habilita/deshabilita el acceso individualmente.

- **`src/lib/db/schema.ts`**: columna nueva `users.canManageReturns boolean default(false)`.
- **Flujo de permisos** (investigado antes de tocar nada): el rol se decide en 3 capas — `src/proxy.ts` (middleware, decodifica el JWT), navegación del sidebar (`src/app/(main)/layout.tsx`, contra `useAuthStore.user`) y `verifyAuthOrAdmin()` en cada Server Action (revalida fresco contra la DB). Como el middleware corre en el edge y no puede pegarle a Postgres, el nuevo flag viaja **dentro del JWT** (`userSessionSchema`), igual que ya pasa con `role`. Esto implica el mismo "precedente de staleness" que ya existe hoy para `role`: si se cambia el permiso de un usuario logueado, no lo ve hasta volver a loguearse — comportamiento ya aceptado en este sistema, no algo nuevo.
- **Backend**: `verifyAuthForReturns()` nueva en `src/lib/auth/utils.ts` (admin, o vendedor con `canManageReturns`) — reemplaza `verifyAuthOrAdmin(true)` en `fetchProductReturns`/`createProductReturnAction`. `toggleUserReturnsAccessAction` nueva en `user.actions.ts` (admin-only, mismo patrón que `toggleUserActiveAction`). `proxy.ts` deja pasar `/devoluciones` a un vendedor si `user.canManageReturns === true`.
- **Frontend**: nav de "Devoluciones" visible para vendedor solo si `canManageReturns` (caso especial en el filtro de `navLinks`, documentado con comentario). Botón checkmark (`CircleCheck`/`Circle`) en `user-columns.tsx`/`user-card.tsx`, solo en filas de vendedor.
- Verificado con `tsc --noEmit`, `eslint`, `npm run build`, `psql \d users` (columna confirmada), contenedor `app` reconstruido y sano.

### Paso 8 — Catálogo público: ordenar por precio ← SIGUIENTE
`src/app/home/components/catalog/use-catalog-filters.ts` — hoy `sortedProducts` solo ordena "con stock primero". Agregar estado `sortBy` (precio asc/desc) + selector nuevo en `catalog-controls.tsx`/`catalog-sidebar.tsx` (desktop) y `mobile-filter-drawer.tsx`. Sin migración, sin backend — `salePrice` ya es `number` en `ProductDef`. Definir al implementar si precio es criterio primario o desempate de "con stock primero".

### Paso 9 (al final) — Catálogo público: "más vistos"
**Confirmado por el usuario: se deja para el final**, con su propia ronda de diseño cuando llegue el turno. No existe ningún tracking de vistas hoy (sin columna, sin tabla, sin lógica). Puntos que van a necesitar decisión en ese momento: qué cuenta como "vista" (ficha vs. card del listado), deduplicación (sesión/IP, ventana de tiempo), modelo de datos (columna simple vs. tabla con timestamp), problema de ISR/caching en `product/[id]/page.tsx` y `home/page.tsx` (revalidate=30 puede no reflejar cada visita), y — el más delicado — que `publicarStock()` hace DELETE+INSERT completo de `products` hacia Supabase en cada publicación, lo que podría resetear un contador de vistas si se modela como columna de esa misma tabla.
