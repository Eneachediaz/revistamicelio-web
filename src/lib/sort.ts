import type { Publicacion } from "./tipos";

export const byNewest = (a: Publicacion, b: Publicacion) =>
  b.data.fecha.valueOf() - a.data.fecha.valueOf();
