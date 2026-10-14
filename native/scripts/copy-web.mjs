import { cp, mkdir, rm, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nativeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(nativeRoot, "..");
const www = path.join(nativeRoot, "www");

async function exists(file){
  try { await access(file); return true; } catch { return false; }
}

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });

const files = ["index.html", "privacy.html", "manifest.json"];
for(const name of files){
  const from = path.join(repoRoot, name);
  if(await exists(from)) await cp(from, path.join(www, name));
}
if(await exists(path.join(www, "privacy.html"))){
  await cp(path.join(www, "privacy.html"), path.join(www, "privacypolicy.html"));
}
for(const dir of ["images", "icons"]){
  const from = path.join(repoRoot, dir);
  if(await exists(from)) await cp(from, path.join(www, dir), { recursive: true });
}
