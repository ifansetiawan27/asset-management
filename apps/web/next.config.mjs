/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Demo Mode berjalan 100% di browser, jadi diekspor sebagai situs statis
  // (out/) agar bisa di-host di Netlify tanpa plugin/serverless.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
