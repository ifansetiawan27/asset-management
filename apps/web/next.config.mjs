import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Root monorepo (dua tingkat di atas apps/web). Disematkan agar Turbopack tidak
// salah memilih lockfile di luar proyek saat menyimpulkan root workspace.
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Demo Mode berjalan 100% di browser, jadi diekspor sebagai situs statis
  // (out/) agar bisa di-host di Netlify tanpa plugin/serverless.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: { root: projectRoot },
};

export default nextConfig;
