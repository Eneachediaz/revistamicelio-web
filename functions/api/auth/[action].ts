// Cloudflare Pages Function — proxy OAuth para Sveltia CMS
// Sveltia delega el handshake OAuth a este endpoint, que actúa de intermediario
// entre el cliente del CMS y GitHub. Mantiene el client_secret fuera del bundle JS.
//
// Configurar como variables de entorno en el dashboard de Cloudflare Pages:
//   GITHUB_CLIENT_ID     — OAuth App Client ID
//   GITHUB_CLIENT_SECRET — OAuth App Client Secret
//
// Authorization callback URL en GitHub:
//   https://<tu-dominio.pages.dev>/api/auth/callback

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return json({ error: "oauth_not_configured" }, 500);
  }

  try {
    if (action === "signin") return signin(url, env);
    if (action === "callback") return callback(url, env, request);
    if (action === "signout") return signout();
    return json({ error: "unknown_action", action }, 400);
  } catch (err) {
    return json({ error: "oauth_error", detail: String(err) }, 500);
  }
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function signin(url: URL, env: Env) {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/api/auth/callback`,
    scope: "repo,user",
    state,
    allow_signup: "false",
  });
  return Response.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
    302
  );
}

async function callback(url: URL, env: Env, request: Request) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code) return json({ error: "missing_code" }, 400);

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/auth/callback`,
      state,
    }),
  });

  if (!tokenRes.ok) {
    return json({ error: "github_token_exchange_failed" }, 502);
  }

  const data = await tokenRes.json() as { access_token?: string; error?: string };
  if (!data.access_token) {
    return json({ error: "no_access_token", github: data.error }, 502);
  }

  // Devolvemos el token encriptado como Sveltia espera.
  // Sveltia re-emite este token vía window.name para mantenerlo fuera de la URL.
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Autenticando…</title></head>
     <body><script>
       (function(){
         const token = ${JSON.stringify(data.access_token)};
         const payload = JSON.stringify({ token, provider: 'github' });
         // Hand-off seguro a la SPA de Sveltia vía window.name
         if (window.opener) {
           window.opener.postMessage({ type: 'authorization:github:success', payload }, '*');
         }
         // Respaldo: también escribimos en window.name + cerramos
         window.name = payload;
         window.close();
         setTimeout(function(){ document.body.innerHTML = '<p>Autenticación completada. Puedes cerrar esta pestaña.</p>'; }, 100);
       })();
     </script></body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", ...CORS },
    }
  );
}

function signout() {
  return new Response("signed_out", { status: 200, headers: CORS });
}

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}) => Response | Promise<Response>;
