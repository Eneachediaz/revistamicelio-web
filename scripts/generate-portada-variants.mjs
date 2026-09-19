#!/usr/bin/env node
/**
 * generate-portada-variants.mjs
 *
 * Genera variantes WebP responsivas (600/900/1200 px de ancho) para cada
 * imagen en public/images/uploads/ cuyo basename matchea /^(portada-|b8f2fc_)/.
 * Solo emite variantes si el ancho original excede el target (no upscalea)
 * y si la variante aún no existe (idempotente).
 *
 * Uso:
 *   node scripts/generate-portada-variants.mjs
 *
 * Salida:
 *   public/images/uploads/portada-foo-600.webp
 *   public/images/uploads/portada-foo-900.webp
 *   public/images/uploads/portada-foo-1200.webp
 *
 * Requiere: sharp (ya viene como dep transitiva de astro).
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const DIR = "public/images/uploads";
const WIDTHS = [600, 900, 1200];
const QUALITY = 78;

const files = fs
  .readdirSync(DIR)
  .filter((f) => /^(portada-|b8f2fc_)/.test(f) && !/-\d+\.webp$/.test(f));

let totalIn = 0;
let totalOut = 0;
let created = 0;
let skipped = 0;

for (const f of files) {
  const src = path.join(DIR, f);
  const meta = await sharp(src).metadata();
  const inSize = fs.statSync(src).size;
  totalIn += inSize;
  const ext = path.extname(f);
  const base = f.slice(0, -ext.length);

  for (const w of WIDTHS) {
    if (meta.width <= w) continue;
    const out = path.join(DIR, `${base}-${w}.webp`);
    if (fs.existsSync(out)) {
      skipped += 1;
      continue;
    }
    const data = await sharp(src, { failOn: "none" })
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out);
    totalOut += data.size;
    created += 1;
  }
}

console.log(`imágenes:   ${files.length}`);
console.log(`variantes:  ${created} (nuevas) · ${skipped} ya existentes`);
console.log(`in:         ${(totalIn / 1024 / 1024).toFixed(2)} MB`);
console.log(`out:        ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
console.log(`ahorro:     -${((1 - totalOut / totalIn) * 100).toFixed(1)}%`);
