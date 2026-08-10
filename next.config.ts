import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Sin esto, Next a veces detecta una raíz de "monorepo" más arriba (ej. por OneDrive)
  // y anida el output standalone en vez de generarlo en .next/standalone/server.js,
  // que es donde el Dockerfile espera encontrarlo.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
