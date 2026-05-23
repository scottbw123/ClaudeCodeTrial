import { google } from "googleapis";
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
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.error("\nMissing Google credentials in .env.local. Run `npm run setup:google` first.\n");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

async function listGscSites() {
  const webmasters = google.webmasters({ version: "v3", auth: oauth2Client });
  const { data } = await webmasters.sites.list();
  return data.siteEntry ?? [];
}

async function listGa4Properties() {
  const admin = google.analyticsadmin({ version: "v1beta", auth: oauth2Client });
  const { data } = await admin.accountSummaries.list({ pageSize: 200 });
  const out = [];
  for (const acct of data.accountSummaries ?? []) {
    for (const prop of acct.propertySummaries ?? []) {
      out.push({
        accountDisplayName: acct.displayName,
        accountId: acct.account,
        propertyDisplayName: prop.displayName,
        property: prop.property,
        propertyType: prop.propertyType,
      });
    }
  }
  return out;
}

console.log("\n=== Google Search Console sites ===\n");
try {
  const sites = await listGscSites();
  if (sites.length === 0) {
    console.log("  (none — service identity has no GSC access)");
  } else {
    for (const s of sites) {
      console.log(`  ${s.siteUrl}   [${s.permissionLevel}]`);
    }
    console.log(`\n  ${sites.length} site(s)`);
  }
} catch (err) {
  console.error("  GSC error:", err.message ?? err);
}

console.log("\n=== Google Analytics 4 properties ===\n");
try {
  const props = await listGa4Properties();
  if (props.length === 0) {
    console.log("  (none — identity has no GA4 access, or only Universal Analytics)");
  } else {
    let currentAcct = null;
    for (const p of props) {
      if (p.accountDisplayName !== currentAcct) {
        currentAcct = p.accountDisplayName;
        console.log(`  ${currentAcct}`);
      }
      const propertyId = (p.property ?? "").replace(/^properties\//, "");
      console.log(`    - ${p.propertyDisplayName}  (id: ${propertyId})`);
    }
    console.log(`\n  ${props.length} GA4 property/properties`);
  }
} catch (err) {
  console.error("  GA4 error:", err.message ?? err);
}

console.log("");
