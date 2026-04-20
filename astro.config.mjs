import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://elysee.com.cy',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    ssr: { noExternal: ['gsap', 'ogl', 'lenis'] }
  },
  experimental: { clientPrerender: true }
});
