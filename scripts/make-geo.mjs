// Gera assets/js/geo-data.js a partir de assets/geo/*.json.
// Motivo: abrir o site com duplo clique (file://) impede o navegador de ler os .json por fetch; como script, funciona.
// Uso: node scripts/make-geo.mjs   (rode de novo se trocar os arquivos de contorno)
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = async (f) => JSON.parse(await fs.readFile(path.join(root, "assets", "geo", f), "utf8"));
const geo = { br: await read("br-states.json"), world: await read("world.json") };
await fs.writeFile(path.join(root, "assets", "js", "geo-data.js"), "/* GERADO por scripts/make-geo.mjs — não edite à mão. Contornos: Natural Earth (domínio público), simplificados. */\nwindow.MB_GEO = " + JSON.stringify(geo) + ";\n");
console.log("geo-data.js gravado:", Object.keys(geo).join(", "));
