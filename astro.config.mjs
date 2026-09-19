// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import rehypeResponsiveImage from "./src/lib/rehype-responsive-image.mjs";

export default defineConfig({
  site: "https://revistamicelio.com",
  output: "static",
  trailingSlash: "ignore",
  i18n: {
    defaultLocale: "es",
    locales: ["es"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({ rehypePlugins: [rehypeResponsiveImage] }),
  },
  integrations: [
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
