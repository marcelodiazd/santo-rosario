import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset URL relative, so the built site works from any
// subfolder (for example /rosario/) without rebuilding.
export default defineConfig({
  base: './',
  plugins: [react()],
});
