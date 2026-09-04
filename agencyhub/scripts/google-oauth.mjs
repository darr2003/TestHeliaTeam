// Script de un solo uso para obtener el refresh token de Google Ads.
// Uso:
//   GOOGLE_ADS_CLIENT_ID=... GOOGLE_ADS_CLIENT_SECRET=... node scripts/google-oauth.mjs
//
// O agrega ambas vars al .env.local y ejecuta:
//   node --env-file=.env.local scripts/google-oauth.mjs

import http from "node:http";
import { exec } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Faltan GOOGLE_ADS_CLIENT_ID y GOOGLE_ADS_CLIENT_SECRET");
  process.exit(1);
}

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/adwords";

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Error: ${error}`);
    console.error(`❌ OAuth error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400);
    res.end("No code received");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (data.error) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Token error: ${data.error_description || data.error}`);
      console.error(`❌ Token error: ${data.error_description || data.error}`);
      server.close();
      process.exit(1);
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html>
        <body style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto">
          <h2>✅ Listo</h2>
          <p>Refresh token obtenido. Vuelve a la terminal para verlo.</p>
        </body>
      </html>
    `);

    console.log("\n✅ Refresh token obtenido:\n");
    console.log("─".repeat(80));
    console.log(data.refresh_token);
    console.log("─".repeat(80));
    console.log("\nGuárdalo en lugar seguro. Lo usarás al crear conexiones en /conexiones");
    console.log("(campo 'Refresh Token').\n");

    server.close();
    process.exit(0);
  } catch (e) {
    res.writeHead(500);
    res.end("Error: " + e.message);
    console.error(`❌ ${e.message}`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\n🌐 Abriendo navegador para autorizar...\n`);
  console.log(`Si no se abre, copia esta URL:\n${authUrl.toString()}\n`);
  exec(`open "${authUrl.toString()}"`);
});
