#!/usr/bin/env node
/**
 * generate-portada-variants.mjs
 *
 * Genera variantes WebP responsivas (600/900/1200 px de ancho) para cada
 * portada en public/images/uploads/. Solo procesa archivos cuyo basename
 * matchea /^portada-/ y solo emite variantes si el ancho original excede
 * el target (no upscalea).
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
  .filter((f) => /^portada-/.test(f) && !/-\d+\.webp$/.test(f));

let totalIn = 0;
let totalOut = 0;
let created = 0;

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
    const data = await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out);
    totalOut += data.size;
    created += 1;
  }
}

console.log(`portadas:   ${files.length}`);
console.log(`variantes:  ${created}`);
console.log(`in:         ${(totalIn / 1024 / 1024).toFixed(2)} MB`);
console.log(`out:        ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
console.log(`ahorro:     -${((1 - totalOut / totalIn) * 100).toFixed(1)}%`);
