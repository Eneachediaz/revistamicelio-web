// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
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
    rehypePlugins: [rehypeResponsiveImage],
  },
  integrations: [
    mdx({
      rehypePlugins: [rehypeResponsiveImage],
    }),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
