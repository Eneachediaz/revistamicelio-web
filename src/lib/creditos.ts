import type { CollectionEntry } from "astro:content";

export type Credito = CollectionEntry<"creditos">;
export type CreditoTipo = Credito["data"]["tipo"];

export const CREDITO_TIPO_LABELS: Record<CreditoTipo, string> = {
  libro:       "Libro",
  video:       "Video",
  articulo:    "Artículo",
  audio:       "Audio",
  "sitio-web": "Sitio web",
};
