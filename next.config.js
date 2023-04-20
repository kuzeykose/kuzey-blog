/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactStrictMode: false,
    appDir: true,
  },
}

const env = {
  API_KEY: process.env.REACT_APP_API_KEY,
  APP_ID: process.env.REACT_APP_APP_ID,
  YOUTUBE_KEY: process.env.YOUTUBE_KEY
};


module.exports = { ...nextConfig, env }
