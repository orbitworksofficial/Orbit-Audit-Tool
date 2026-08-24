/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Python FastAPI service does all heavy audit work. We never bundle it,
  // we only call it over HTTP using PYTHON_API_URL.
  env: {
    NEXT_PUBLIC_APP_NAME: 'OrbitScanner',
  },
};

export default nextConfig;
