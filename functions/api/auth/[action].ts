// Cloudflare Pages Function — proxy OAuth para Sveltia CMS
// Sveltia CMS abre un popup hacia {base_url}/auth?provider=github&site_id=...
// tras la autorización en GitHub redirige a {base_url}/callback?code=...&state=...
//
// Configurar como variables de entorno en el dashboard de Cloudflare Pages:
//   GITHUB_CLIENT_ID     — OAuth App Client ID
//   GITHUB_CLIENT_SECRET — OAuth App Client Secret
//   ALLOWED_DOMAINS      — (opcional) dominios permitidos separados por coma
//
// Authorization callback URL en GitHub:
//   https://<tu-dominio.pages.dev>/api/auth/callback

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAllowedDomain(domain: string, allowed: string): boolean {
  return allowed
    .split(",")
    .some((pattern) => {
      const trimmed = pattern.trim();
      const regex = new RegExp(
        `^${escapeRegExp(trimmed).replace("\\*", ".+")}$`,
      );
      return regex.test(domain);
    });
}

function outputHTML({
  provider = "unknown",
  token,
  error,
  errorCode,
}: {
  provider?: string;
  token?: string;
  error?: string;
  errorCode?: string;
}): Response {
  const state = error ? "error" : "success";
  const content = error
    ? { provider, error, errorCode }
    : { provider, token };

  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Autenticando…</title></head>
<body><script>
  (() => {
    window.addEventListener('message', ({ data, origin }) => {
      if (data === 'authorizing:${provider}') {
        window.opener?.postMessage(
          'authorization:${provider}:${state}:${JSON.stringify(content)}',
          origin
        );
      }
    });
    window.opener?.postMessage('authorizing:${provider}', '*');
  })();
<\/script></body></html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Set-Cookie":
          "csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function auth(url: URL, env: Record<string, string>): Response {
  const provider = url.searchParams.get("provider") || "github";
  const domain =
    url.searchParams.get("site_id") || url.searchParams.get("domain") || "";

  const allowedDomains = env.ALLOWED_DOMAINS;
  if (allowedDomains && domain) {
    if (!isAllowedDomain(domain, allowedDomains)) {
      return outputHTML({
        provider,
        error: "Dominio no autorizado.",
        errorCode: "UNSUPPORTED_DOMAIN",
      });
    }
  }

  const csrfToken = crypto.randomUUID().replaceAll("-", "");

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: "repo,user",
    state: csrfToken,
  });

  return new Response("", {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params.toString()}`,
      "Set-Cookie": `csrf-token=${provider}_${csrfToken}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function callback(
  url: URL,
  env: Record<string, string>,
  request: Request,
): Promise<Response> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const match = request.headers
    .get("Cookie")
    ?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/);
  const provider = match?.[1];
  const csrfToken = match?.[2];

  if (!provider) {
    return outputHTML({
      provider: "unknown",
      error: "Backend no compatible.",
      errorCode: "UNSUPPORTED_BACKEND",
    });
  }

  if (!code || !state) {
    return outputHTML({
      provider,
      error: "No se recibió código de autorización.",
      errorCode: "AUTH_CODE_REQUEST_FAILED",
    });
  }

  if (!csrfToken || state !== csrfToken) {
    return outputHTML({
      provider,
      error: "CSRF detectado. Flujo abortado.",
      errorCode: "CSRF_DETECTED",
    });
  }

  let tokenRes: Response;
  try {
    tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
        }),
      },
    );
  } catch {
    return outputHTML({
      provider,
      error: "Error de red al solicitar token.",
      errorCode: "TOKEN_REQUEST_FAILED",
    });
  }

  let data: { access_token?: string; error?: string };
  try {
    data = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
  } catch {
    return outputHTML({
      provider,
      error: "Respuesta malformada del servidor.",
      errorCode: "MALFORMED_RESPONSE",
    });
  }

  if (!data.access_token) {
    return outputHTML({
      provider,
      error: data.error || "No se obtuvo token de acceso.",
      errorCode: "NO_ACCESS_TOKEN",
    });
  }

  return outputHTML({ provider, token: data.access_token });
}

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return json({ error: "oauth_not_configured" }, 500);
  }

  try {
    if (action === "auth" || action === "signin") return auth(url, env);
    if (action === "callback") return callback(url, env, request);
    if (action === "signout") return new Response("signed_out", { status: 200 });
    return json({ error: "unknown_action", action }, 400);
  } catch (err) {
    return json({ error: "oauth_error", detail: String(err) }, 500);
  }
};

type PagesFunction = (context: {
  request: Request;
  env: { [key: string]: string };
  params: Record<string, string>;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}) => Response | Promise<Response>;
