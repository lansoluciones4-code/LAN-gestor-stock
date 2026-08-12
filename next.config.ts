import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Sin esto, Next a veces detecta una raíz de "monorepo" más arriba (ej. por OneDrive)
  // y anida el output standalone en vez de generarlo en .next/standalone/server.js,
  // que es donde el Dockerfile espera encontrarlo.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Las fotos se suben como base64 dentro del payload de la Server Action; el default de 1MB
    // se queda corto con fotos de celular (excede tan solo con la codificación base64).
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
