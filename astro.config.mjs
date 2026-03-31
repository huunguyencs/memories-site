// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://example.github.io',
  base: '/memories-site',
  vite: {
    plugins: [tailwindcss()],
  },
});
