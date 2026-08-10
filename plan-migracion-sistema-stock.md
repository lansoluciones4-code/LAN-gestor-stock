# Plan: mover el sistema de gestión de stock a un servidor local (LAN)

## Objetivo

Separar el sistema en dos partes:

- **Gestión de stock** (altas, bajas, movimientos): corre en una PC dentro del local del cliente, solo accesible por la red interna (LAN). Nunca queda expuesta a internet.
- **Sitio web público** (lo que ven los clientes de tu cliente): sigue alojado en Vercel como hasta ahora, mostrando el stock actualizado.

La conexión entre ambas partes es **unidireccional y manual**: un botón en el sistema local envía ("empuja") los datos actualizados hacia el sitio público. El servidor local nunca recibe conexiones entrantes de internet, así que la superficie de ataque es prácticamente cero.

---

## Arquitectura en resumen

```
Tu PC (VSCode)  →  GitHub (repo privado)  →  PC del cliente (clona el repo)
                                                       │
                                                       ▼
                                          Docker Compose (Next.js + Postgres local)
                                                       │
                                          ┌────────────┴────────────┐
                                          ▼                         ▼
                                  Botón "Publicar"          Empleados en LAN
                                  → envía snapshot           (solo navegador,
                                    a Vercel                  sin instalar nada)
```

Un solo equipo corre el sistema (el "servidor"). Todas las demás PCs de la tienda son simples clientes: abren el navegador y entran a la IP local del servidor, nada más.

---

## Parte 1 — El mecanismo de sincronización (botón de publicar)

Stack actual: **Next.js + Server Actions + PostgreSQL**.

**En el sistema local**, un Server Action arma el snapshot del stock y lo envía:

```ts
// app/actions/pushToWeb.ts
'use server'
export async function pushToWeb() {
  const stock = await db.query('SELECT * FROM products');
  const res = await fetch('https://argenstock.vercel.app/api/sync-stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SYNC_SECRET}`,
    },
    body: JSON.stringify({ stock: stock.rows, syncedAt: new Date() }),
  });
  if (!res.ok) throw new Error('Sync falló');
  return { ok: true };
}
```

**En Vercel**, un endpoint valida el token y sobrescribe la tabla pública:

```ts
// app/api/sync-stock/route.ts
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.SYNC_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { stock } = await req.json();
  await db.transaction(async (tx) => {
    await tx.query('DELETE FROM products_public');
    await tx.query('INSERT INTO products_public ...', [stock]);
  });
  return Response.json({ ok: true });
}
```

**Puntos clave:**
- `SYNC_SECRET`: token largo y random, como variable de entorno en ambos lados (nunca hardcodeado, nunca subido a git).
- El resto del sitio público sigue leyendo de `products_public` exactamente igual que hoy.
- Mostrar en el panel local "última sincronización: hace X minutos" y un estado de carga en el botón.
- Guardar un log de auditoría de cada push (quién, cuándo, cuántos productos) en la base local.

---

## Parte 2 — Elegir y preparar la PC que va a ser el servidor

No hace falta un equipo especial. Checklist:

1. **Elegir el equipo**: una PC existente sin otro uso, o una mini PC dedicada (Intel NUC, Beelink, Mac mini). No necesita placa de video ni specs altas.
2. **Specs mínimas**: 8 GB RAM (16 GB ideal), SSD, procesador de los últimos 4-5 años.
3. **Sistema operativo**: Windows si preferís simplicidad para el cliente; Linux (Ubuntu Server) si vos vas a mantenerlo remoto y preferís algo más liviano.
4. **Desactivar suspensión e hibernación**: configuración de energía en "nunca suspender", para que el sistema no deje de responder por inactividad.
5. **Reinicio automático tras corte de luz**: en el BIOS/UEFI, activar "Restore on AC Power Loss" (o equivalente) para que la PC vuelva a prender sola después de un corte de luz.
6. **Instalar Docker**: Docker Desktop (Windows/Mac) o Docker Engine (Linux).
7. **IP fija**: ver Parte 5.
8. **UPS (recomendado)**: una batería pequeña evita que un corte de luz corrompa la base de datos a mitad de una escritura.

---

## Parte 3 — Conceptos básicos de Docker (si nunca lo usaste)

- **Imagen**: un molde con todo lo necesario para correr algo (Node + tu código, o Postgres).
- **Contenedor**: una imagen corriendo, como un proceso aislado.
- **Docker Compose**: un archivo que describe varios contenedores trabajando juntos (tu app + la base de datos) y los levanta con un solo comando.
- **Volumen**: una carpeta persistente en disco real, para que los datos de Postgres no se pierdan si el contenedor se reinicia.

### Estructura del proyecto

```
sistema-stock/
├── Dockerfile
├── docker-compose.yml
├── .env
└── (tu código Next.js: app/, package.json, etc.)
```

### Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: stock_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: stock_db
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"   # solo accesible desde la misma PC

  app:
    build: .
    restart: always
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://stock_admin:${DB_PASSWORD}@db:5432/stock_db
      SYNC_SECRET: ${SYNC_SECRET}
    ports:
      - "0.0.0.0:3000:3000"    # accesible desde otras PCs de la LAN

volumes:
  db_data:
```

`db` solo escucha en `127.0.0.1` (nadie de la red le pega directo a Postgres). `app` escucha en `0.0.0.0:3000`, visible en la LAN. `restart: always` hace que los contenedores vuelvan a levantar solos si la PC se reinicia.

### .env (al lado del compose, nunca subir a git)

```
DB_PASSWORD=una_contraseña_larga_y_random
SYNC_SECRET=otro_token_largo_random
```

---

## Parte 4 — Llevar el código desde tu VSCode hasta la PC del cliente

1. **Subir el proyecto a un repositorio privado de GitHub** (una vez, desde tu PC):
   ```bash
   git init
   git add .
   git commit -m "version inicial"
   gh repo create sistema-stock --private --source=. --push
   ```

2. **Instalar Git y Docker en la PC del cliente.** Podés ir en persona, o conectarte por AnyDesk/TeamViewer con su autorización.

3. **Clonar el repositorio** en esa PC:
   ```bash
   git clone https://github.com/tu-usuario/sistema-stock.git
   ```

4. **Crear el archivo `.env`** manualmente en esa PC, con las contraseñas reales (este archivo no viaja por GitHub).

---

## Parte 5 — Configurar IP fija en la PC servidor (Windows)

1. Abrir `cmd` y correr `ipconfig /all`. Anotar la puerta de enlace predeterminada, la máscara de subred y el DNS actual.
2. Elegir una IP libre, fuera del rango que reparte el router por DHCP (por ejemplo, si reparte entre `.100` y `.200`, usar algo como `192.168.1.50`).
3. Ir a Configuración → Red e Internet → Cambiar opciones del adaptador.
4. Click derecho en la conexión activa → Propiedades → Protocolo de Internet versión 4 (TCP/IPv4) → Propiedades.
5. Marcar "Usar la siguiente dirección IP" y completar: dirección IP elegida, máscara de subred (`255.255.255.0` normalmente), puerta de enlace (la anotada en el paso 1). En DNS, poner el mismo gateway u `8.8.8.8`.
6. Aceptar todo y correr `ipconfig` de nuevo para confirmar.
7. Desde otra PC de la red, hacer `ping 192.168.1.50` para confirmar que responde.

*(Alternativa más robusta: reserva DHCP en el router, que asigna siempre la misma IP a esa PC según su dirección física, sin tocar la configuración de red de Windows.)*

---

## Parte 6 — Levantar el sistema

En la carpeta del proyecto, dentro de la PC servidor:

```bash
docker compose up -d
```

Verificar:
- En la misma PC servidor: `http://localhost:3000`
- Desde otra PC/celular en la misma red: `http://192.168.1.50:3000` (la IP fija configurada)

---

## Parte 7 — Acceso para los empleados

Las demás PCs de la tienda **no necesitan instalar nada**. Solo:

1. Abrir el navegador y entrar a `http://192.168.1.50:3000` (o la IP que hayas fijado).
2. Dejar un acceso directo en el escritorio, o guardarlo como favorito, para no tener que tipearlo cada vez.

---

## Parte 8 — Seguridad

- Firewall de esa PC bloqueando conexiones entrantes salvo desde la subred local.
- Login con usuario/contraseña para cada empleado dentro del sistema, aunque sea LAN.
- No abrir puertos en el router hacia internet (nada de port-forwarding).
- Backups periódicos de la base de datos local (ya no están los backups automáticos de la nube).
- Si el cliente necesita acceso remoto alguna vez, usar VPN (por ejemplo WireGuard) en vez de exponer puertos.

---

## Parte 9 — Mantenimiento y actualizaciones futuras

Cuando hagas cambios en el código, conectate remoto (AnyDesk) a la PC del cliente y corré:

```bash
git pull
docker compose up -d --build
```

---

## Checklist final

- [ ] Repositorio privado creado en GitHub
- [ ] PC servidor elegida y con specs mínimas verificadas
- [ ] Suspensión/hibernación desactivada
- [ ] Reinicio automático tras corte de luz activado en BIOS
- [ ] Docker instalado
- [ ] Proyecto clonado en la PC servidor
- [ ] `.env` creado con contraseñas reales
- [ ] IP fija configurada y probada con `ping` desde otra PC
- [ ] `docker compose up -d` corriendo sin errores
- [ ] Accesible desde `localhost:3000` en el servidor
- [ ] Accesible desde otra PC vía IP de LAN
- [ ] Accesos directos dejados en las PCs de los empleados
- [ ] Botón de "Publicar" probado end-to-end (local → Vercel)
- [ ] Firewall configurado
- [ ] Backup de la base de datos local programado
