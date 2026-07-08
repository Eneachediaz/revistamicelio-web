/**
 * rehype-responsive-image.mjs
 *
 * Rehype plugin que transforma <img src="/images/uploads/..."> en
 * <picture><source type="image/webp" srcset="...-600.webp 600w, ...-900.webp 900w, ...-1200.webp 1200w">
 *           <img src="..." loading="lazy" decoding="async"></picture>
 *
 * Solo actúa sobre imágenes que:
 *   - viven en /images/uploads/
 *   - tienen variantes WebP generadas (portada-* o b8f2fc_*) a 600/900/1200 px
 *
 * Las imágenes sin variantes se dejan como <img> simple (con loading="lazy" y
 * decoding="async" añadidos si faltan).
 */
import { visit } from "unist-util-visit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VARIANT_WIDTHS = [600, 900, 1200];
const SRC_PREFIX = "/images/uploads/";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..");
const UPLOAD_DIR = path.join(PROJECT_ROOT, "public", "images", "uploads");

const variantPath = (filename, w) => {
  const ext = path.extname(filename);
  const base = filename.slice(0, -ext.length);
  return path.join(UPLOAD_DIR, `${base}-${w}.webp`);
};

const hasVariants = (filename) =>
  VARIANT_WIDTHS.some((w) => fs.existsSync(variantPath(filename, w)));

export default function rehypeResponsiveImage() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "img" || !parent || index == null) return;
      const src = node.properties?.src;
      if (typeof src !== "string" || !src.startsWith(SRC_PREFIX)) return;

      const filename = src.slice(SRC_PREFIX.length);
      const ext = path.extname(filename);
      const base = filename.slice(0, -ext.length);

      if (!hasVariants(filename)) {
        if (node.properties.loading == null) node.properties.loading = "lazy";
        if (node.properties.decoding == null) node.properties.decoding = "async";
        return;
      }

      const sourceSrcset = VARIANT_WIDTHS
        .filter((w) => fs.existsSync(variantPath(filename, w)))
        .map((w) => `/images/uploads/${base}-${w}.webp ${w}w`)
        .join(", ");

      if (node.properties.loading == null) node.properties.loading = "lazy";
      if (node.properties.decoding == null) node.properties.decoding = "async";

      const picture = {
        type: "element",
        tagName: "picture",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "source",
            properties: {
              type: "image/webp",
              sizes: "100vw",
              srcset: sourceSrcset,
            },
            children: [],
          },
          node,
        ],
      };

      parent.children[index] = picture;
    });
  };
}
