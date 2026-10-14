// Token exchange for Strava, Garmin, and Fitbit.
// The browser sends the authorization code. Client secrets stay in
// Supabase secrets and are never returned to the page.
//
// Deploy: supabase functions deploy wearable-oauth
// Secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, GARMIN_CLIENT_ID,
// GARMIN_CLIENT_SECRET, FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET
// The project already injects SUPABASE_URL, SUPABASE_ANON_KEY, and
// SUPABASE_SERVICE_ROLE_KEY.
//
// Run supabase/wearables.sql before the first successful exchange.
// Setup steps are in supabase/wearables-setup.md.

const PROVIDERS = {
  strava: { token: "https://www.strava.com/oauth/token" },
  garmin: { token: "https://diauth.garmin.com/di-oauth2-service/oauth/token" },
  fitbit: { token: "https://api.fitbit.com/oauth2/token" }
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(status, body){
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({ "Content-Type": "application/json" }, cors)
  });
}

function envName(provider, suffix){
  return provider.toUpperCase() + "_" + suffix;
}

async function signedInUser(req){
  const auth = req.headers.get("Authorization") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if(!auth || !url || !anon) return "";
  const res = await fetch(url.replace(/\/$/, "") + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: auth }
  });
  if(!res.ok) return "";
  const user = await res.json();
  return user && user.id ? String(user.id) : "";
}

async function serviceFetch(path, options){
  const url = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if(!url || !key) throw new Error("Service role is not configured");
  const opt = options || {};
  const res = await fetch(url + path, {
    method: opt.method || "GET",
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: opt.prefer || "return=representation"
    },
    body: opt.body != null ? JSON.stringify(opt.body) : undefined
  });
  const text = await res.text();
  let data = null;
  if(text){ try { data = JSON.parse(text); } catch (_e) { data = { message: text }; } }
  if(!res.ok){
    const err = new Error("Could not save the connection");
    err.detail = data;
    throw err;
  }
  return data;
}

async function exchange(provider, code, redirectUri, codeVerifier){
  const spec = PROVIDERS[provider];
  const clientId = Deno.env.get(envName(provider, "CLIENT_ID")) || "";
  const clientSecret = Deno.env.get(envName(provider, "CLIENT_SECRET")) || "";
  if(!spec || !clientId || !clientSecret){
    const err = new Error("missing-secret");
    err.code = "missing-secret";
    throw err;
  }
  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("code", code);
  form.set("grant_type", "authorization_code");
  if(redirectUri) form.set("redirect_uri", redirectUri);
  if(codeVerifier) form.set("code_verifier", codeVerifier);
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if(provider === "fitbit"){
    headers.Authorization = "Basic " + btoa(clientId + ":" + clientSecret);
  }
  const res = await fetch(spec.token, { method: "POST", headers, body: form.toString() });
  const data = await res.json().catch(() => ({}));
  if(!res.ok || !data.access_token){
    const err = new Error("The service did not return a token");
    err.code = "provider";
    throw err;
  }
  let expires = null;
  if(data.expires_at) expires = new Date(Number(data.expires_at) * 1000).toISOString();
  else if(data.expires_in) expires = new Date(Date.now() + Number(data.expires_in) * 1000).toISOString();
  return {
    access_token: String(data.access_token),
    refresh_token: String(data.refresh_token || ""),
    expires_at: expires,
    scope: String(data.scope || "")
  };
}

async function markProfile(userId, provider, status){
  const rows = await serviceFetch("/rest/v1/profiles?id=eq." + encodeURIComponent(userId) + "&select=wearables", { method: "GET" });
  const current = rows && rows[0] && rows[0].wearables && typeof rows[0].wearables === "object" ? rows[0].wearables : {};
  const prev = current[provider] && typeof current[provider] === "object" ? current[provider] : {};
  current[provider] = {
    status: status,
    at: Date.now(),
    entries: Array.isArray(prev.entries) ? prev.entries : []
  };
  await serviceFetch("/rest/v1/profiles?id=eq." + encodeURIComponent(userId), {
    method: "PATCH",
    prefer: "return=minimal",
    body: { wearables: current }
  });
}

Deno.serve(async (req) => {
  if(req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if(req.method !== "POST") return json(405, { error: "POST only" });
  const userId = await signedInUser(req);
  if(!userId) return json(401, { error: "Sign in to connect." });
  let body = {};
  try { body = await req.json(); } catch (_e) { body = {}; }
  const provider = String(body.provider || "");
  if(!PROVIDERS[provider]) return json(400, { error: "Unknown service." });
  const action = body.action === "disconnect" ? "disconnect" : "exchange";
  try {
    if(action === "disconnect"){
      await serviceFetch("/rest/v1/wearable_tokens?owner_id=eq." + encodeURIComponent(userId) + "&provider=eq." + encodeURIComponent(provider), {
        method: "DELETE",
        prefer: "return=minimal"
      });
      await markProfile(userId, provider, "interest");
      return json(200, { provider, status: "cleared" });
    }
    const code = String(body.code || "");
    if(!code) return json(400, { error: "Missing authorization code." });
    const token = await exchange(provider, code, String(body.redirectUri || ""), String(body.codeVerifier || ""));
    await serviceFetch("/rest/v1/wearable_tokens?on_conflict=owner_id,provider", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: {
        owner_id: userId,
        provider,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at,
        scope: token.scope,
        updated_at: new Date().toISOString()
      }
    });
    await markProfile(userId, provider, "connected");
    return json(200, { provider, status: "connected" });
  } catch (err) {
    if(err && err.code === "missing-secret"){
      return json(501, { error: "Set the client id and client secret for this service, then deploy this function." });
    }
    return json(502, { error: "The connection could not be finished." });
  }
});
