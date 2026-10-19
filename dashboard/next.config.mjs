import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Repo ildizida botning package-lock.json'i ham bor — Next.js noto'g'ri
  // papkani loyiha ildizi deb olmasligi uchun aniq ko'rsatamiz.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.discordapp.com' }],
  },
};

export default nextConfig;
