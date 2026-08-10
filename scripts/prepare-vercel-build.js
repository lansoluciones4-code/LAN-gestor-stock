// Se ejecuta SOLO en el build del deploy público de Vercel (ver "build:public" en
// package.json). Borra físicamente las rutas de gestión antes de compilar, para que
// ese código ni siquiera quede bundleado ni sea alcanzable desde internet — no depende
// de que el bundler haga tree-shaking, ni de que el login/proxy las bloqueen bien.
//
// Es seguro: Vercel clona el repo desde cero en cada build, así que esto nunca toca
// el working tree real ni el repositorio Git. El build local (Docker, LAN) no corre
// este script y compila la app completa.
const fs = require('fs');
const path = require('path');

const ADMIN_ROUTE_GROUPS = ['src/app/(main)', 'src/app/(auth)'];

for (const relPath of ADMIN_ROUTE_GROUPS) {
  const fullPath = path.join(process.cwd(), relPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`[prepare-vercel-build] Removido: ${relPath}`);
  } else {
    console.log(`[prepare-vercel-build] No encontrado (ya removido u otra estructura): ${relPath}`);
  }
}
