import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['googleapis', 'exceljs'],
  // Alias "@/" dibuat eksplisit agar andal di semua lingkungan (termasuk path dengan spasi di Windows).
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, '@': root };
    return config;
  },
};
export default nextConfig;
