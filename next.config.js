/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Vercel Blob CDN — permanent storage for DALL-E images
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // DALL-E 3 temporary URLs (fallback when Blob not configured)
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
    ],
  },
};

module.exports = nextConfig;
