# Revista Micelio

Portal editorial de **Revista Micelio** migrado de Wix a un stack Jamstack de código abierto y costo cero de hosting.

- **Framework:** [Astro 6](https://astro.build/) (generación estática)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) con `@tailwindcss/vite`
- **CMS:** [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (CDN, sin build local)
- **Auth GitHub:** Cloudflare Pages Function en `functions/api/auth/`
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/) (plan gratuito, ancho de banda ilimitado)
- **Tipografía:** Fraunces (display) + Source Serif 4 (cuerpo) + Inter (UI), vía `@fontsource-variable`
- **Lenguaje:** Español (es)

## Estructura de secciones

| Sección | Ruta | Colección Content |
|---|---|---|
| La revista | `/la-revista` | `pages` |
| Publicaciones | `/publicaciones` y `/publicaciones/[slug]` | `publicaciones` |
| s-Lab | `/s-lab` | `sesiones` |
| Listas | `/listas` y `/listas/[categoria]` | `listas` |
| Sub-listas | `/listas/[categoria]/[subtema]` | `subtemas` |
| Convocatoria | `/convocatoria` | `pages` |
| Bibliografía del sitio | `/creditos` | `creditos` |
| Panel editorial | `/admin` | — (Sveltia) |

## Requisitos

- **Node.js** ≥ 22.12. Ver `.nvmrc`.
- **npm** ≥ 10.

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4321)
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview
```

## Configurar el panel editorial (`/admin`)

El panel `/admin` usa **Sveltia CMS** con backend GitHub. El handshake OAuth se delega a un Cloudflare Pages Function local. Para que funcione necesitas:

1. **Crear una GitHub OAuth App**: <https://github.com/settings/developers>
   - Homepage URL: `http://localhost:4321` (en dev) y luego tu dominio en prod.
   - Authorization callback URL: `https://<tu-dominio.pages.dev>/api/auth/callback`

2. **Variables de entorno** (en `.env` local y como secrets en Cloudflare Pages):
   ```bash
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

3. **En `public/admin/config.yml`**, ajusta `repo:` a tu organización/repositorio real:
   ```yaml
   backend:
     name: github
     repo: <ORG>/revistamicelio-web   # ← CAMBIAR
     branch: master
     base_url: https://<tu-dominio.pages.dev>/api/auth
   ```

4. **En desarrollo local** Sveltia detecta automáticamente el endpoint en `localhost` y, si no hay proxy disponible, puede operar contra el repo con un Personal Access Token pegado manualmente en el panel. Para producción usa el OAuth via Function.

## Colecciones de contenido

Las colecciones están definidas en `src/content.config.ts` con **Zod** como capa de validación. Los límites de la convocatoria se enforcen al construir:

| Tipo | Límite |
|---|---|
| Reseña | 1.000 palabras |
| Ensayo académico | 8.000 palabras + formato MLA/APA |
| Ensayo narrativo | 3.500 palabras |
| Entrevista | 5.000 palabras |
| Narrativa (ficción) | 3.000 palabras |
| Poesía | 5 páginas físicas |
| Traducción | texto original URL + metadatos de derechos |

## Despliegue a Cloudflare Pages

### Opción 1 — Conectar el repositorio (recomendado)

1. Sube el código a GitHub (`revistamicelio-web`).
2. En el dashboard de Cloudflare Pages: **Create a project → Connect to Git**.
3. Configuración del build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `/`
   - **Environment variables:**
     - `GITHUB_CLIENT_ID`
     - `GITHUB_CLIENT_SECRET`
4. Cloudflare detecta el directorio `functions/` automáticamente y despliega el endpoint OAuth.

### Opción 2 — Deploy directo con Wrangler

```bash
npm i -g wrangler
wrangler pages deploy dist --project-name revistamicelio-web
```

## Paleta y línea gráfica

- **Modo único**: oscuro permanente.
- Acento principal: verde micelio bioluminiscente `#9ec47a`.
- Acento secundario: ocre / espora `#c89968` (badges de tipo).
- Tipografía: Fraunces (titulares/display, variable) + Source Serif 4 (cuerpo, variable) + Inter (interfaz, variable).
- Tokens en `src/styles/global.css` bajo la directiva `@theme` de Tailwind v4.

## Convenciones editoriales

- Todos los textos se publican bajo **Creative Commons BY-NC 4.0** salvo acuerdo distinto.
- Frontmatter obligatorio en cada `.md`/`.mdx`.
- Las imágenes se suben a `public/images/uploads/` y se referencian con ruta absoluta `/images/uploads/...`.

## Licencia del código

El código de este repositorio se publica bajo MIT. El contenido editorial (textos, traducciones, etc.) mantiene su licencia original.
