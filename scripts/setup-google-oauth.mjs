import { google } from "googleapis";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnvFile(p) {
  if (!fs.existsSync(p)) return {};
  const result = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const env = { ...loadEnvFile(envPath), ...process.env };

const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const PORT = 3939;
const REDIRECT_URI = `http://localhost:${PORT}/oauth-callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\nMissing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local.");
  console.error("Copy .env.local.example to .env.local and paste the values from your OAuth client in Cloud Console.\n");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/analytics.readonly",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("\n=== Omniflow Reporting: Google OAuth setup ===\n");
console.log("1. Open this URL in your browser:\n");
console.log("   " + authUrl + "\n");
console.log("2. Sign in as team@omniflow.us (the account with GSC/GA4 access).");
console.log('3. Click "Allow" on the consent screen.\n');
console.log(`Listening on ${REDIRECT_URI} ...`);

function writeRefreshToken(token) {
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  let updated;
  if (/^GOOGLE_REFRESH_TOKEN=/m.test(current)) {
    updated = current.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN=${token}`);
  } else {
    const sep = current === "" || current.endsWith("\n") ? "" : "\n";
    updated = current + sep + `GOOGLE_REFRESH_TOKEN=${token}\n`;
  }
  fs.writeFileSync(envPath, updated, { mode: 0o600 });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/oauth-callback") {
    res.writeHead(404).end();
    return;
  }

  const error = url.searchParams.get("error");
  if (error) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end(`OAuth error: ${error}`);
    console.error(`\nGoogle returned error: ${error}`);
    server.close();
    process.exit(1);
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end("Missing code parameter");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      const msg = "No refresh token returned. Revoke the app at https://myaccount.google.com/permissions and rerun this script.";
      res.writeHead(500, { "Content-Type": "text/plain" }).end(msg);
      console.error("\n" + msg);
      server.close();
      process.exit(1);
    }

    writeRefreshToken(tokens.refresh_token);

    res
      .writeHead(200, { "Content-Type": "text/html" })
      .end(
        '<html><body style="font-family:system-ui;padding:3rem;max-width:36rem;margin:auto">' +
          '<h1 style="color:#059669">Authorized</h1>' +
          "<p>Refresh token saved to <code>.env.local</code>. You can close this tab.</p>" +
          "</body></html>"
      );
    console.log("\nSuccess. Refresh token written to .env.local.");
    server.close();
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.writeHead(500, { "Content-Type": "text/plain" }).end(`Token exchange failed: ${msg}`);
    console.error("\nToken exchange failed:", msg);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT);
