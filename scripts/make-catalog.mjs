// Gera assets/js/sgs-catalog.js a partir de scripts/sources.mjs (única fonte da verdade das séries do BC).
// O navegador usa esse catálogo para buscar as séries direto no Banco Central quando o coletor ainda não rodou.
// Uso: node scripts/make-catalog.mjs
import { SGS, PROVIDERS } from "./sources.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "js", "sgs-catalog.js");
const cat = Object.fromEntries(Object.entries(SGS).map(([k, [code, pt, en, unit, freq, opt = {}]]) => [k, [code, pt, en, unit, freq, opt]]));
await fs.writeFile(out, "/* GERADO por scripts/make-catalog.mjs — não edite à mão. */\nwindow.MB_SGS = " + JSON.stringify(cat) + ";\nwindow.MB_PROVIDERS = " + JSON.stringify(PROVIDERS) + ";\n");
console.log("catálogo gravado:", Object.keys(cat).length, "séries →", out);
