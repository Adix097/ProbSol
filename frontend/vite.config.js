import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When USE_MOCK_DATA = false, requests to /api are proxied to your backend.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
});
