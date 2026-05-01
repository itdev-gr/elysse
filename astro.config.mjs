import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://elysee.com.cy',
  integrations: [mdx(), sitemap(), compress({ HTML: true, CSS: true, JavaScript: true, SVG: true, Image: false })],
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  redirects: {
    '/catalog':                     '/products',
    '/catalog/epsilon':             '/catalog/compression-fittings/epsilon',
    '/catalog/coupling-repair':     '/catalog/compression-fittings/coupling-repair',
    '/catalog/coupling-transition': '/catalog/compression-fittings/coupling-transition',
    '/catalog/adaptor-flanged':     '/catalog/hydraulic-fittings/adaptor-flanged',
    '/catalog/single-4-bolts':      '/catalog/hydraulic-fittings/single-4-bolts',
    '/catalog/saddle-clamp':        '/catalog/saddles/saddle-clamp',
    '/catalog/pvc-ball-valve':      '/catalog/valves/pvc-ball-valve',
    '/catalog/double-union-glued':  '/catalog/valves/double-union-glued',
    '/products/epsilon':            '/catalog/compression-fittings/epsilon'
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    ssr: { noExternal: ['gsap', 'ogl', 'lenis'] }
  },
  experimental: { clientPrerender: true }
});
