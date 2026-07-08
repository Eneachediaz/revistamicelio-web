import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/* ─────────────────────────────────────────────────────────────
   Validación de conteo de palabras como refinamiento Zod
   ───────────────────────────────────────────────────────────── */
const requiredWordCount = (max: number) =>
  z
    .number()
    .int()
    .nonnegative()
    .max(max, { message: `Excede el máximo de ${max} palabras` });

/* ─────────────────────────────────────────────────────────────
   publicaciones: base compartida + discriminator por 'tipo'
   ───────────────────────────────────────────────────────────── */
const basePublication = z.object({
  titulo: z.string(),
  autor: z.string(),
  fecha: z.coerce.date(),
  resumen: z.string().optional(),
  portada: z.string().optional(),
});

const publicaciones = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/publicaciones" }),
  schema: z.discriminatedUnion("tipo", [
    z.object({
      tipo: z.literal("resena"),
      ...basePublication.shape,
      wordCount: requiredWordCount(1000),
    }),
    z.object({
      tipo: z.literal("ensayoAcademico"),
      ...basePublication.shape,
      citas: z.enum(["MLA", "APA"]),
      wordCount: requiredWordCount(8000),
    }),
    z.object({
      tipo: z.literal("ensayoNarrativo"),
      ...basePublication.shape,
      wordCount: requiredWordCount(3500),
    }),
    z.object({
      tipo: z.literal("entrevista"),
      ...basePublication.shape,
      wordCount: requiredWordCount(5000),
    }),
    z.object({
      tipo: z.literal("narrativa"),
      ...basePublication.shape,
      wordCount: requiredWordCount(3000),
    }),
    z.object({
      tipo: z.literal("poesia"),
      ...basePublication.shape,
      paginas: z.number().int().positive().max(5, {
        message: "Poesía: máximo 5 páginas",
      }),
    }),
    z.object({
      tipo: z.literal("traduccion"),
      ...basePublication.shape,
      original: z.string().url(),
      derechos: z.string().min(3),
    }),
  ]),
});

/* ─────────────────────────────────────────────────────────────
   listas: 4 categorías bibliográficas
   ───────────────────────────────────────────────────────────── */
const listas = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/listas" }),
  schema: z.object({
    titulo: z.string(),
    categoria: z.enum([
      "animales-no-humanos",
      "naturaleza-ambiente",
      "fabulacion-especulativa",
      "cli-fi-latinoamericano",
    ]),
    autor: z.string().optional(),
    anio: z.number().int().optional(),
    tipoReferencia: z
      .enum(["obra", "articulo", "ensayo-propio", "referencia-teorica"])
      .default("obra"),
    descripcion: z.string().optional(),
    conceptos: z.array(z.string()).default([]),
    url: z.string().url().optional(),
  }),
});

/* ─────────────────────────────────────────────────────────────
   subtemas: sub-listas dentro de cada categoría (Wix sub-pages)
   ───────────────────────────────────────────────────────────── */
const subtemas = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/subtemas" }),
  schema: z.object({
    categoria: z.enum([
      "animales-no-humanos",
      "naturaleza-ambiente",
      "fabulacion-especulativa",
      "cli-fi-latinoamericano",
    ]),
    titulo: z.string(),
    subtema: z.string(),
    descripcion: z.string().optional(),
    orden: z.number().int().default(0),
  }),
});

/* ─────────────────────────────────────────────────────────────
   sesiones: s-Lab
   ───────────────────────────────────────────────────────────── */
const sesiones = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sesiones" }),
  schema: z.object({
    titulo: z.string(),
    fecha: z.coerce.date(),
    descripcion: z.string(),
    facilitador: z.string().optional(),
    participantes: z.array(z.string()).default([]),
    ejes: z.array(z.string()).default([]),
  }),
});

/* ─────────────────────────────────────────────────────────────
   pages: contenido MDX de páginas estáticas
   ───────────────────────────────────────────────────────────── */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string().optional(),
  }),
});

/* ─────────────────────────────────────────────────────────────
   creditos: bibliografía del sitio (footer)
   ───────────────────────────────────────────────────────────── */
const creditos = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/creditos" }),
  schema: z.object({
    obra: z.string(),
    autor: z.string(),
    anio: z.number().int().optional(),
    tipo: z.enum(["libro", "video", "articulo", "audio", "sitio-web"]).default("libro"),
    url: z.string().url().optional(),
    orden: z.number().int().default(0),
  }),
});

export const collections = {
  publicaciones,
  listas,
  subtemas,
  sesiones,
  pages,
  creditos,
};
