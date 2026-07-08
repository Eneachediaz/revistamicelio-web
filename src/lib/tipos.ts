import type { CollectionEntry } from "astro:content";

export type Publicacion = CollectionEntry<"publicaciones">;
export type PublicacionData = Publicacion["data"];

export type Tipo = PublicacionData["tipo"];

export const TIPO_LABELS: Record<Tipo, string> = {
  resena:           "Reseña",
  ensayoAcademico:  "Ensayo académico",
  ensayoNarrativo:  "Ensayo narrativo",
  entrevista:       "Entrevista",
  narrativa:        "Narrativa",
  poesia:           "Poesía",
  traduccion:       "Traducción",
};
