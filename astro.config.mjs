import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import compress from 'astro-compress';

export default defineConfig({
  site: 'https://elysee.com.cy',
  integrations: [mdx(), sitemap(), compress({ HTML: true, CSS: true, JavaScript: true, SVG: true, Image: false })],
  image: { service: { entrypoint: 'astro/assets/services/sharp' } },
  vite: {
    plugins: [tailwindcss()],
    ssr: { noExternal: ['gsap', 'ogl', 'lenis'] }
  },
  experimental: { clientPrerender: true }
});
