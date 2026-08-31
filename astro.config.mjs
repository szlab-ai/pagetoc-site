import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 通过官方 Vite 插件接入，没有 tailwind.config.mjs —— 主题 token 在
// src/styles/global.css 的 @theme 里。（@astrojs/tailwind 的 peerDependencies 只到
// astro ^5，装不上本项目的 astro ^7。）
export default defineConfig({
  site: 'https://szlab-ai.github.io',
  base: '/pagetoc-site/',
  trailingSlash: 'always',
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true },
  },
  integrations: [
    sitemap({
      // 每条 <url> 带上 en / zh-Hans 的 xhtml:link 互指，和 <head> 里的 hreflang 一致。
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', zh: 'zh-Hans' },
      },
      // 排除 noindex 的根跳转页和 404，避免给搜索引擎提交不该收录的 URL。
      filter: (page) => !/\/pagetoc-site\/$/.test(page) && !/\/404\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
