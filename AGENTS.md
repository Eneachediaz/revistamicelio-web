# AGENTS.md

Astro 6 (static) + Tailwind v4 (`@tailwindcss/vite`) + MDX + Sveltia CMS, deployed on Cloudflare Pages. Editorial site for Revista Micelio; content in Spanish, dark mode only.

## Commands

- `npm install`
- `npm run dev` — dev server on `http://localhost:4321`
- `npm run build` — produces `dist/` (Astro static output, also `pages_build_output_dir` in `wrangler.toml`)
- `npm run check` — TS + content-schema check (run before pushing to `main`)
- `npm run preview` — requires a prior `build`

There is no lint, formatter, or test command. Do not invent `npm test` / `npm run lint`. CI is not configured.

## Node version

`.nvmrc` pins `22`. Astro 6 requires ≥ 22.12. `nvm use` before installing.

## Repo layout

- `src/pages/` — file-based routes. `publicaciones/[...slug].astro` is a rest spread; slug = filename without ext (`post.id`).
- `src/content.config.ts` — single source of truth for content schemas (Zod). `publicaciones` is a `z.discriminatedUnion("tipo", …)` with seven tipos: `resena`, `ensayoAcademico`, `ensayoNarrativo`, `entrevista`, `narrativa`, `poesia`, `traduccion`.
- `src/content/{publicaciones,listas,subtemas,sesiones,pages,creditos}/` — Markdown/MDX. Folder ↔ collection must match; `public/admin/config.yml` mirrors it. As of the final migration there are 30 publicaciones, 4 listas, 16 subtemas, 6 creditos, 2 pages, 1 sesion.
- `src/styles/global.css` — Tailwind v4 `@theme` tokens + custom utilities (`versalita`, `h1-tilt`, `container-editorial`, `spore-trail`, `asterisco-titulo`). Keep all styles in this file; do not split per component.
- `src/components/` — Astro components, one file per visual primitive (`Sporangium`, `Hyphae`, `MycelialBackground`, `MycelialMark`, `Nav`, `Footer`, `PublicationCard`, `ColumnSet`+`Column`, `MediaItem`, `AtmosphericImage`, `Logo`, `SLabLogo`, `SectionDivider`).
- `src/layouts/BaseLayout.astro` — only layout. Hardcodes `lang="es"`, `color-scheme: dark`, OG/Twitter meta, RSS link.
- `src/lib/` — shared helpers. `tipos.ts` exports `TIPO_LABELS` (the seven publication `tipo` strings → display labels) and `Tipo` type; `dates.ts` exports `formatSpanishDate(d)`. Do not duplicate these in templates.
- `public/admin/` — Sveltia CMS shell + `config.yml`. Served as static, no build step.
- `functions/api/auth/[action].ts` — Cloudflare Pages Function for `signin` / `callback` / `signout`. Auto-deployed by Pages when `functions/` exists.
- `public/images/uploads/` — flat directory of media (portadas + inline illustrations). Wix images were downloaded at `w_1200,h_800,al_c,q_90` and saved with their original `b8f2fc_<id>~mv2.<ext>` filename. Reference as `/images/uploads/<file>` in markdown.
- **Imágenes responsivas**: `portada-*` y `b8f2fc_*` tienen variantes WebP en build time (`-600`, `-900`, `-1200`). Detectado en `MediaItem.astro` (portadas, `<picture>` con srcset) y `rehype-responsive-image.mjs` (imágenes inline markdown/MDX, plugin rehype registrado en `astro.config.mjs`). Sin variantes → `<img>` con `loading="lazy" decoding="async"`. Regenerar con `scripts/generate-portada-variants.mjs`.

## Content authoring rules (enforced at build time)

- All editorial content is Spanish; `lang="es"` is hardcoded in the layout.
- `publicaciones` frontmatter: `tipo` ∈ `{resena, ensayoAcademico, ensayoNarrativo, entrevista, narrativa, poesia, traduccion}`. The Zod schema enforces the word/page cap; for ensayos académicos, `citas: "MLA" | "APA"` is required. Filename (kebab-case, ASCII, no accents) becomes the slug.
- `listas` frontmatter: `categoria` ∈ `{animales-no-humanos, naturaleza-ambiente, fabulacion-especulativa, cli-fi-latinoamericano}`. CMS slug is `{{categoria}}` — filename must equal the categoria.
- `subtemas` frontmatter: `categoria` (same 4 values), `subtema` (kebab-case), `titulo`, `descripcion`, `orden`. CMS slug is `{{categoria}}--{{subtema}}` (double-dash separator) — filename must match.
- `sesiones` CMS slug is `sesion-{{slug}}` — keep the `sesion-` prefix on filenames.
- `pages` collection has `create: false` in the CMS; only `convocatoria.mdx` and `la-revista.mdx` are managed. Do not add new entries there without updating `src/pages/`.
- Images: `public/images/uploads/`, referenced as `/images/uploads/...` (per `media_folder` / `public_folder` in `public/admin/config.yml`).
- Dark mode is forced: `<meta name="color-scheme" content="dark">` in `BaseLayout.astro`. Do not add a light-mode toggle.

## Sveltia CMS / OAuth

- Admin at `/admin/` (Sveltia loaded from CDN, no build).
- Required env: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (see `.env.example`). Same values must be set as secrets in the Cloudflare Pages dashboard.
- GitHub OAuth App callback URL: `https://<host>/api/auth/callback`. The Function reads `url.origin`, so the same function serves dev (`http://localhost:4321`) and prod without changes.
- `public/admin/config.yml` wires everything: `repo: revistamicelio/revistamicelio-web`, `branch: master`, `base_url: https://revistamicelio.com/api/auth`. When forking, update this file **and** the README OAuth setup section in lockstep.

## Deployment

- Cloudflare Pages auto-detects `functions/` for the OAuth Function and uses `wrangler.toml` (`revistamicelio-web`, `pages_build_output_dir = "dist"`).
- Pages dashboard: build command `npm run build`, output `dist`, root `/`.
- Manual: `wrangler pages deploy dist --project-name revistamicelio-web` (Wrangler is not a dev dep).

## Things an agent is likely to get wrong

- The tipografía referenced in `package.json` and `src/styles/global.css` is `fraunces` + `source-serif-4` + `inter`. `global.css` importa los archivos multi-axis (`fraunces/full.css`, `source-serif-4/opsz.css`, `inter/opsz.css`) para que los ejes `opsz` y `wonk` declarados en `font-variation-settings` se apliquen realmente; el default (`index.css`) es solo eje `wght`.
- The discriminated union in `src/content.config.ts` and the form widgets in `public/admin/config.yml` must stay aligned. Adding a `tipo` or `categoria` requires editing both.
- `output: "static"` — no SSR. Do not add server endpoints under `src/pages/`.
- `trailingSlash: "ignore"` in `astro.config.mjs` — Astro defaults to append trailing slashes; this repo strips them.
- `tsconfig.json` extends `astro/tsconfigs/strict` but `astro check` is not in `scripts`. Run it manually before claiming "type-safe".
- The `i18n` block in `astro.config.mjs` configures only `es` with `prefixDefaultLocale: false`. Adding a locale requires touching `astro.config.mjs`, the layout, and every hardcoded `lang="es"`.
- `dist/` and `.astro/` are gitignored. Do not commit them.
- `robots.txt` disallows `/admin/`. The admin panel is reachable directly at `/admin/` (Sveltia CMS) but is not linked from public navigation; editors bookmark it themselves.
- The `publicaciones` `tipo` enum now has 7 values (including `entrevista`); the `wordCount` cap for `ensayoAcademico` is 8000, not 5000 — long film essays like *Sonido, insomnio e identidad en Memoria* depend on this. When adding a `tipo`, also update both `src/content.config.ts` and `public/admin/config.yml`.
- `listas` sub-list pages live in the `subtemas` collection under `src/content/subtemas/`, not under `src/content/listas/`. The filename must follow `{categoria}--{subtema}.mdx`. The listas hub page at `src/pages/listas/[categoria].astro` enumerates the `subtemas` collection directly and groups entries by `categoria`; no separate index files are needed.
- Inline image references inside markdown use the public path `/images/uploads/<filename>`, not a bare filename. Bare filenames (e.g. `![alt](b8f2fc_xxx~mv2.png)`) break the build with `ImageNotFound`.
- `TIPO_LABELS` and `formatSpanishDate` live in `src/lib/tipos.ts` and `src/lib/dates.ts` respectively. They are imported by both `src/pages/publicaciones/[...slug].astro` and `src/components/PublicationCard.astro`. Do not re-declare them inline; adding a new `tipo` only needs to update `TIPO_LABELS` in one place.
- The OG image of a publication is `data.portada` with fallback to `/logo.png` (from `ogFallback` in `src/pages/publicaciones/[...slug].astro`). BaseLayout default OG is `/images/uploads/portada-collage-violet.jpg`.
- The auto-lead + drop-cap on the first `<p>` of a publication only applies when the publication has no `resumen` (the wrapper `<div>` gets the `first-p-lead` class conditionally). On other pages (`/la-revista/`, `/convocatoria/`, `/listas/`, `/creditos/`, `/s-lab/`) the `first-p-lead` class is always added to the `.prose` container so the lead treatment still kicks in.
