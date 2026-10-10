import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://academia.wbmonster.com.br',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
