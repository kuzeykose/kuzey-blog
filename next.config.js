/** @type {import('next').NextConfig} */
const nextConfig = {
}

const env = {
  API_KEY: process.env.REACT_APP_API_KEY,
  APP_ID: process.env.REACT_APP_APP_ID,
  YOUTUBE_KEY: process.env.REACT_APP_YOUTUBE_KEY
};


module.exports = { ...nextConfig, env }
