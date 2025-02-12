let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  // Environment variables configuration
  env: {
    NEXT_PUBLIC_ASTRONOMY_API_KEY: process.env.NEXT_PUBLIC_ASTRONOMY_API_KEY,
    ASTRONOMY_API_SECRET: process.env.ASTRONOMY_API_SECRET,
    NEXT_PUBLIC_ORIGIN_URL: process.env.NEXT_PUBLIC_ORIGIN_URL || 'http://localhost:3000',
  },
  // Optional: Add runtime configuration
  publicRuntimeConfig: {
    astronomyApiUrl: 'https://api.astronomyapi.com/api/v2',
  },
  // Optional: Add server-only runtime configuration
  serverRuntimeConfig: {
    // Add any server-only config here
  },
}

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

mergeConfig(nextConfig, userConfig)

export default nextConfig