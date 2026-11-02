#!/usr/bin/env node
/**
 * COLETOR DO MONITOR BRASIL
 * -------------------------
 * Baixa as fontes oficiais e grava JSONs compactos em /data. Roda no GitHub Actions
 * (a cada 2 horas) ou na sua máquina:  node scripts/collect.mjs
 *
 * Opções:  --only=sgs,pix   só essas tarefas      --full  refaz o histórico do Pix (24 meses)
 *
 * Regras de ouro (todas aprendidas no teste ao vivo de 02/11/2026):
 *  • Pix/Olinda: o parâmetro de mês devolve "esse mês e todos os seguintes" → sempre filtramos por AnoMes.
 *  • SGS diário só aceita janela de 10 anos → buscamos em blocos de 9.
 *  • SGS traz datas futuras (Selic meta, salário mínimo) → cortamos em "hoje" (horário de Brasília).
 *  • blockchain.com exige Accept-Language: en.  Binance REST não é usado (bloqueia IPs dos EUA).
 *  • Se uma fonte falha, mantemos o dado anterior daquela fonte e registramos o erro no manifesto.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SGS, PROVIDERS } from "./sources.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(HERE, "../data");
const ARGS = process.argv.slice(2);
const FULL = ARGS.includes("--full");
const ONLY = (ARGS.find((a) => a.startsWith("--only=")) || "").slice(7).split(",").filter(Boolean);
const want = (t) => !ONLY.length || ONLY.includes(t);
/* O Pix do site mostra só totais (desde o lançamento e por ano) e a comparação mundial — vêm de `pix:mpv` e do BIS.
 * As aberturas detalhadas (perfil, estado, município, chaves, fraude, setor) só rodam com --extras. */
const WITH_EXTRAS = ARGS.includes("--extras");
const EXTRA_TASKS = new Set(["pix:spi", "pix:uf", "pix:dict", "pix:fraud", "pix:keys", "pix:cnae"]);

const BASE = {
  sgs: process.env.BASE_SGS || "https://api.bcb.gov.br/dados/serie",
  olinda: process.env.BASE_OLINDA || "https://olinda.bcb.gov.br/olinda/servico",
  ibge: process.env.BASE_IBGE || "https://servicodados.ibge.gov.br/api/v3/agregados",
  wb: process.env.BASE_WB || "https://api.worldbank.org/v2",
  imf: process.env.BASE_IMF || "https://www.imf.org/external/datamapper/api/v1",
  bis: process.env.BASE_BIS || "https://stats.bis.org/api/v2",
  ipea: process.env.BASE_IPEA || "https://www.ipeadata.gov.br/api/odata4",
  btc: process.env.BASE_BTC || "https://api.blockchain.info",
};
const PIX = `${BASE.olinda}/Pix_DadosAbertos/versao/v1/odata`;
const MPV = `${BASE.olinda}/MPV_DadosAbertos/versao/v1/odata`;
const TJ = `${BASE.olinda}/taxaJuros/versao/v2/odata`;
const FOC = `${BASE.olinda}/Expectativas/versao/v1/odata`;
const enc = encodeURIComponent;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
const brt = () => new Date(Date.now() - 3 * 3600e3);                       // "agora" em Brasília
const TODAY = brt().toISOString().slice(0, 10);
const NOW_YM = TODAY.slice(0, 7);
const addMonths = (ym, n) => { let y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return `${y}-${pad(m + 1)}`; };
const lastDay = (ym) => `${ym}-${pad(new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate())}`;
const num = (v) => { const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n : null; };

async function http(url, { tries = 4, timeout = 120000, headers = {} } = {}) {
  let err;
  for (let i = 0; i < tries; i++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeout);
    try {
      const r = await fetch(url, { signal: ac.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; MonitorBrasil/2.0; +https://areabitcoin.com.br)", Accept: "application/json", "Accept-Language": "en", ...headers } });
      clearTimeout(t);
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e) { clearTimeout(t); err = e; await sleep(1500 * (i + 1)); }
  }
  throw new Error(`${url.slice(0, 110)} → ${err?.message || err}`);
}
async function readJson(name, fallback = null) { try { return JSON.parse(await fs.readFile(path.join(DATA, name), "utf8")); } catch { return fallback; } }
async function writeJson(name, obj) { await fs.mkdir(DATA, { recursive: true }); await fs.writeFile(path.join(DATA, name), JSON.stringify(obj)); }

/* ---------- registro de status ---------- */
const prevManifest = (await readJson("manifest.json", {})) || {};
const status = { ...(prevManifest.status || {}) };
async function task(id, fn) {
  if (!want(id.split(":")[0])) return null;
  if (EXTRA_TASKS.has(id) && !WITH_EXTRAS) return null;
  const t0 = Date.now();
  try {
    console.log(`▶ ${id}`);
    const res = await fn();
    status[id] = { ok: true, at: new Date().toISOString(), ms: Date.now() - t0, rows: res?.rows ?? null, lastObs: res?.lastObs ?? null };
    console.log(`  ✓ ${id} (${((Date.now() - t0) / 1000).toFixed(1)}s)${res?.lastObs ? " último: " + res.lastObs : ""}`);
    return res;
  } catch (e) {
    status[id] = { ...(status[id] || {}), ok: false, failedAt: new Date().toISOString(), error: String(e.message || e).slice(0, 240) };
    console.warn(`  ✗ ${id}: ${e.message || e}`);
    return null;
  }
}

/* =====================================================================
 * 1) BANCO CENTRAL — SGS
 * ===================================================================== */
const brToIso = (s) => { const [d, m, y] = s.split("/"); return `${y}-${m}-${d}`; };
const isoToBr = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
async function sgsRows(code, daily, fromIso) {
  const out = [];
  const take = (arr) => { if (Array.isArray(arr)) for (const x of arr) { const v = num(x.valor); if (v != null && x.data) out.push([brToIso(x.data), v]); } };
  if (!daily) { take(await http(`${BASE.sgs}/bcdata.sgs.${code}/dados?formato=json`)); }
  else {
    let a = new Date(fromIso + "T12:00:00Z"); const end = new Date(TODAY + "T12:00:00Z");
    while (a <= end) {
      const b = new Date(Math.min(Date.UTC(a.getUTCFullYear() + 9, a.getUTCMonth(), a.getUTCDate()), end.getTime()));
      take(await http(`${BASE.sgs}/bcdata.sgs.${code}/dados?formato=json&dataInicial=${isoToBr(a.toISOString().slice(0, 10))}&dataFinal=${isoToBr(b.toISOString().slice(0, 10))}`, { timeout: 150000 }));
      a = new Date(b.getTime() + 864e5); await sleep(300);
    }
  }
  return out.filter((r) => r[0] <= TODAY).sort((x, y) => (x[0] < y[0] ? -1 : 1));
}
const ptaxDaily = { map: null };   // preenchido na tarefa sgs (usado pelo Bitcoin)

const sgsOut = (await task("sgs", async () => {
  const prev = (await readJson("sgs.json", { series: {} })).series || {};
  const series = {};
  let n = 0, newest = "";
  for (const [key, [code, , , , freq, opt = {}]] of Object.entries(SGS)) {
    try {
      if (freq === "m") {
        const rows = await sgsRows(code, false);
        if (!rows.length) throw new Error("vazia");
        series[key] = { a: rows.map(([d, v]) => [d.slice(0, 7), v]) };
      } else {
        // diária: mantém cache completo só do PTAX (para converter o bitcoin) e deriva o resto
        const cacheName = `_cache-${key}.json`;
        let hist = (await readJson(cacheName, null)) || [];
        const from = hist.length ? hist[hist.length - 1][0] : (opt.start ? brToIso(opt.start) : "1999-01-01");
        const fresh = await sgsRows(code, true, hist.length ? addDays(from, -15) : from);
        const m = new Map(hist); for (const [d, v] of fresh) m.set(d, v);
        hist = [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
        if (key === "ptax") ptaxDaily.map = hist;
        await writeJson(cacheName, hist);   // cache de todas as séries diárias: as próximas coletas só buscam os dias novos (a API do BC é lenta)
        const monthEnd = new Map(); for (const [d, v] of hist) monthEnd.set(d.slice(0, 7), v);
        if (opt.step) {   // só os pontos em que o valor muda
          const pts = []; let last = null; for (const [d, v] of hist) { if (v !== last) pts.push([d, v]); last = v; }
          series[key] = { a: pts, d: hist.slice(-5) };
        } else {
          series[key] = { a: [...monthEnd.entries()], d: hist.slice(-(opt.keepDays || 400)) };
        }
      }
      const s = series[key]; const last = (s.d?.at(-1) || s.a.at(-1))[0]; s.last = last; if (last > newest) newest = last; n += s.a.length; delete status[`sgs:${key}`];
    } catch (e) {
      console.warn(`    SGS ${code} (${key}) falhou: ${e.message}`);
      if (prev[key]) series[key] = prev[key]; status[`sgs:${key}`] = { ok: false, error: String(e.message).slice(0, 160), failedAt: new Date().toISOString() };
    }
    await sleep(120);
  }
  if (Object.keys(series).length < 10) throw new Error("poucas séries (" + Object.keys(series).length + ")");
  await writeJson("sgs.json", { updated: new Date().toISOString(), today: TODAY, series });
  return { rows: n, lastObs: newest };
})) ;
function addDays(iso, n) { return new Date(new Date(iso + "T12:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10); }
if (!ptaxDaily.map) ptaxDaily.map = await readJson("_cache-ptax.json", []);

/* =====================================================================
 * 2) PIX — Olinda
 * ===================================================================== */
const add = (o, k, q, v) => { const e = o[k] || (o[k] = [0, 0]); e[0] += q; e[1] += v; };
async function pixSpiMonth(ym) {
  const body = await http(`${PIX}/EstatisticasTransacoesPix(Database=@Database)?@Database='${ym}'&$filter=${enc("AnoMes eq " + ym)}&$top=200000&$format=json`, { timeout: 240000 });
  const rows = (body?.value || []).filter((x) => String(x.AnoMes) === ym);
  if (!rows.length) return null;
  const a = { q: 0, v: 0, nat: {}, ini: {}, fin: {}, pfpj: {}, age: {}, flow: {} };
  for (const x of rows) {
    const q = +x.QUANTIDADE || 0, v = +x.VALOR || 0; a.q += q; a.v += v;
    add(a.nat, x.NATUREZA, q, v); add(a.ini, x.FORMAINICIACAO, q, v); add(a.fin, x.FINALIDADE, q, v);
    add(a.pfpj, `${x.PAG_PFPJ}>${x.REC_PFPJ}`, q, v); add(a.age, x.PAG_IDADE, q, v); add(a.flow, `${x.PAG_REGIAO}>${x.REC_REGIAO}`, q, v);
  }
  return a;
}
async function pixMunMonth(ym) {
  const body = await http(`${PIX}/TransacoesPixPorMunicipio(DataBase=@DataBase)?@DataBase='${ym}'&$filter=${enc("AnoMes eq " + ym)}&$top=10000&$format=json`, { timeout: 180000 });
  const rows = (body?.value || []).filter((x) => String(x.AnoMes) === ym);
  if (!rows.length) return null;
  const uf = {}; const mun = [];
  for (const x of rows) {
    const k = x.Estado_Ibge; const u = uf[k] || (uf[k] = { ibge: k, estado: x.Estado, regiao: x.Sigla_Regiao, q: 0, v: 0, qpf: 0, vpf: 0, pagPF: 0, pagPJ: 0, nmun: 0 });
    const q = (+x.QT_PagadorPF || 0) + (+x.QT_PagadorPJ || 0), v = (+x.VL_PagadorPF || 0) + (+x.VL_PagadorPJ || 0);
    u.q += q; u.v += v; u.qpf += +x.QT_PagadorPF || 0; u.vpf += +x.VL_PagadorPF || 0; u.pagPF += +x.QT_PES_PagadorPF || 0; u.pagPJ += +x.QT_PES_PagadorPJ || 0; u.nmun++;
    mun.push([x.Municipio_Ibge, x.Municipio, k, q, v]);
  }
  mun.sort((a, b) => b[3] - a[3]);
  return { list: Object.values(uf), top: mun.slice(0, 30) };
}
async function latestPixMonth() {   // último mês com dados por município (o Pix sai 1–2 dias após o fim do mês)
  for (let back = 0; back <= 3; back++) {
    const ym = addMonths(NOW_YM, -back).replace("-", "");
    const r = await http(`${PIX}/TransacoesPixPorMunicipio(DataBase=@DataBase)?@DataBase='${ym}'&$filter=${enc("AnoMes eq " + ym)}&$top=1&$format=json`).catch(() => null);
    if (r?.value?.length) return ym;
  }
  return null;
}
const pixPrev = { spi: {}, uf: null, mpv: [], mpvQ: [], dict: [], fraud: [], keys: null, cnae: null, ...((await readJson("pix.json", null)) || {}) };   // "{}" (arquivo-modelo) também funciona
const pixOut = { ...pixPrev, updated: pixPrev.updated };

await task("pix:mpv", async () => {   // total do Pix x TED x boleto x cheque (mensal) e cartões (trimestral)
  const m = await http(`${MPV}/MeiosdePagamentosMensalDA(AnoMes=@AnoMes)?@AnoMes='202011'&$format=json`, { timeout: 90000 });
  const rows = (m?.value || []).map((x) => ({ m: `${x.AnoMes.slice(0, 4)}-${x.AnoMes.slice(4)}`,
    pix: [x.quantidadePix * 1e3, x.valorPix * 1e6], ted: [x.quantidadeTED * 1e3, x.valorTED * 1e6], boleto: [x.quantidadeBoleto * 1e3, x.valorBoleto * 1e6],
    cheque: [x.quantidadeCheque * 1e3, x.valorCheque * 1e6], doc: [x.quantidadeDOC * 1e3, x.valorDOC * 1e6], tec: [x.quantidadeTEC * 1e3, x.valorTEC * 1e6] }))
    .filter((r) => r.pix[0] > 0).sort((a, b) => (a.m < b.m ? -1 : 1));
  if (!rows.length) throw new Error("MPV mensal vazio");
  pixOut.mpv = rows;
  const q = await http(`${MPV}/MeiosdePagamentosTrimestralDA(trimestre=@trimestre)?@trimestre='20201'&$format=json`, { timeout: 90000 });
  pixOut.mpvQ = (q?.value || []).map((x) => { const o = { d: x.datatrimestre }; for (const k of ["Pix", "TED", "TEC", "Cheque", "Boleto", "DOC", "CartaoCredito", "CartaoDebito", "CartaoPrePago", "TransIntrabancaria", "Convenios", "DebitoDireto", "Saques"]) o[k] = [(x["quantidade" + k] || 0) * 1e3, (x["valor" + k] || 0) * 1e6]; return o; }).sort((a, b) => (a.d < b.d ? -1 : 1));
  return { rows: rows.length, lastObs: rows.at(-1).m };
});

await task("pix:spi", async () => {   // Pix liquidado no SPI: natureza, iniciação, regiões, idades
  const last = await latestPixMonth(); if (!last) throw new Error("nenhum mês disponível");
  const lastYm = `${last.slice(0, 4)}-${last.slice(4)}`;
  const want24 = []; for (let i = 0; i < 4; i++) want24.push(addMonths(lastYm, -i));   // o site usa o mês mais recente; 4 meses bastam (cada mês leva dezenas de segundos na API)
  const need = want24.filter((m, i) => i < 2 || !pixOut.spi[m]);   // sempre refaz os 2 últimos
  const todo = FULL ? want24 : need;                                // meses que faltam + os 2 mais recentes
  for (const m of todo) { const a = await pixSpiMonth(m.replace("-", "")); if (a) pixOut.spi[m] = a; await sleep(400); }
  const keep = new Set(want24); for (const k of Object.keys(pixOut.spi)) if (!keep.has(k)) delete pixOut.spi[k];
  pixOut.spiLast = lastYm;
  return { rows: Object.keys(pixOut.spi).length, lastObs: lastYm };
});

await task("pix:uf", async () => {    // por estado/município (último mês e 12 meses antes)
  const last = pixOut.spiLast || addMonths(NOW_YM, -1); const cur = await pixMunMonth(last.replace("-", "")); if (!cur) throw new Error("sem municípios");
  const prev = await pixMunMonth(addMonths(last, -12).replace("-", "")).catch(() => null);
  pixOut.uf = { month: last, list: cur.list, top: cur.top, prev: prev ? Object.fromEntries(prev.list.map((u) => [u.ibge, [u.q, u.v]])) : null };
  return { rows: cur.list.length, lastObs: last };
});

await task("pix:dict", async () => {
  const b = await http(`${PIX}/PixUsuariosCadastradosDICT?$orderby=${enc("DataGraficosPix desc")}&$top=60&$format=json`);
  const rows = (b?.value || []).map((x) => [x.DataGraficosPix, x.qtdUsuariosCadastradosDICTTotal, x.qtdUsuariosPessoaFisica, x.qtdUsuariosPessoaJuridica]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (!rows.length) throw new Error("vazio"); pixOut.dict = rows; return { rows: rows.length, lastObs: rows.at(-1)[0] };
});

await task("pix:fraud", async () => {
  const b = await http(`${PIX}/EstatisticasFraudesPix(Database=@Database)?@Database='202301'&$format=json`);
  const rows = (b?.value || []).map((x) => ({ m: `${String(x.AnoMes).slice(0, 4)}-${String(x.AnoMes).slice(4)}`, contestados: x.QtdePixcontestados, aceitas: x.Qtdecontestacoesaceitas, aceitas100k: x.Qtdecontestacoesaceitasacada100mil, valorAceitos: x.ValorPixcontestadosaceitos, devolPct: x.PercentualdeDevolucao, usuarios: x.QtdeUsuarioscommarcacoesdefraude, chaves: x.QtdeChavesPixcommarcacoesdefraude })).sort((a, b) => (a.m < b.m ? -1 : 1));
  if (!rows.length) throw new Error("vazio"); pixOut.fraud = rows; return { rows: rows.length, lastObs: rows.at(-1).m };
});

await task("pix:keys", async () => {  // estoque de chaves por tipo (opcional: pode ser grande)
  const d = pixOut.dict?.at(-1)?.[0]; if (!d) throw new Error("sem data do DICT");
  const b = await http(`${PIX}/ChavesPix(Data=@Data)?@Data='${d}'&$filter=${enc("Data eq " + d)}&$select=TipoChave,NaturezaUsuario,qtdChaves&$top=300000&$format=json`, { timeout: 180000, tries: 2 });
  const t = {}, n = {}; let tot = 0; for (const x of b?.value || []) { t[x.TipoChave] = (t[x.TipoChave] || 0) + x.qtdChaves; n[x.NaturezaUsuario] = (n[x.NaturezaUsuario] || 0) + x.qtdChaves; tot += x.qtdChaves; }
  if (!tot) throw new Error("vazio"); pixOut.keys = { date: d, total: tot, tipo: t, natureza: n }; return { rows: tot, lastObs: d };
});

await task("pix:cnae", async () => {  // quem recebe: setor (seção CNAE) e porte
  const last = (pixOut.spiLast || addMonths(NOW_YM, -1)).replace("-", "");
  const b = await http(`${PIX}/CnaePorteRecebedor(Database=@Database)?@Database='${last}'&$filter=${enc("AnoMes eq " + last)}&$top=200000&$format=json`, { timeout: 180000, tries: 2 });
  const sec = {}, porte = {}, pf = [0, 0];
  for (const x of b?.value || []) {
    if (String(x.AnoMes) !== last) continue;
    if (/^pessoa f/i.test(x.cnssecao || "") || x.tipopessoa === "PF") { pf[0] += +x.qtlanliq || 0; pf[1] += +x.vllanliq || 0; continue; }   // pessoa física não é setor CNAE
    add(sec, x.cnssecao, +x.qtlanliq || 0, +x.vllanliq || 0); add(porte, x.porte, +x.qtlanliq || 0, +x.vllanliq || 0);
  }
  if (!Object.keys(sec).length) throw new Error("vazio"); pixOut.cnae = { month: `${last.slice(0, 4)}-${last.slice(4)}`, sec, porte, pf }; return { rows: Object.keys(sec).length, lastObs: pixOut.cnae.month };
});
if (ONLY.length === 0 || ONLY.some((o) => o.startsWith("pix"))) { pixOut.updated = new Date().toISOString(); await writeJson("pix.json", pixOut); }

/* =====================================================================
 * 3) JUROS POR BANCO — Olinda taxaJuros (semanal)
 * ===================================================================== */
await task("rates", async () => {
  const params = (await http(`${TJ}/ParametrosConsulta?$format=json`, { timeout: 120000 }))?.value || [];
  const pf = [...new Set(params.filter((p) => /f[ií]sica/i.test(p.segmento || "")).map((p) => p.segmento + "|" + p.modalidade))].map((k) => k.split("|"));
  const last = (await http(`${TJ}/TaxasJurosDiariaPorInicioPeriodo?$orderby=${enc("InicioPeriodo desc")}&$top=1&$format=json`))?.value?.[0];
  if (!last) throw new Error("sem semana");
  const mods = [];
  for (const [seg, name] of pf) {
    // atenção: nos dados o Segmento vem em CAIXA ALTA ("PESSOA FÍSICA"); nos parâmetros, "Pessoa Física"
    const b = await http(`${TJ}/TaxasJurosDiariaPorInicioPeriodo?$filter=${enc(`InicioPeriodo eq '${last.InicioPeriodo}' and Segmento eq '${seg.toUpperCase()}' and Modalidade eq '${name}'`)}&$orderby=Posicao&$top=400&$format=json`);
    const banks = (b?.value || []).filter((x) => /f[ií]sica/i.test(x.Segmento || "")).map((x) => [x.InstituicaoFinanceira, x.TaxaJurosAoMes, x.TaxaJurosAoAno, x.cnpj8]);
    if (banks.length) { const ys = banks.map((x) => x[2]).filter((v) => v != null).sort((a, c) => a - c); mods.push({ name, n: banks.length, avg: ys.reduce((s, v) => s + v, 0) / ys.length, med: ys[Math.floor(ys.length / 2)], min: ys[0], max: ys.at(-1), banks }); }
    await sleep(200);
  }
  if (!mods.length) throw new Error("nenhuma modalidade");
  await writeJson("rates.json", { updated: new Date().toISOString(), week: [last.InicioPeriodo, last.FimPeriodo], mods });
  return { rows: mods.length, lastObs: last.FimPeriodo };
});

/* =====================================================================
 * 4) FOCUS — expectativas do mercado
 * ===================================================================== */
await task("focus", async () => {
  const since = addDays(TODAY, -45);
  const inds = ["IPCA", "Selic", "Câmbio", "PIB Total", "IGP-M", "Resultado primário", "Resultado nominal", "Dívida líquida do setor público", "Taxa de desocupação"];
  const out = { inds: {}, selic: null, date: null };
  for (const ind of inds) {
    const b = await http(`${FOC}/ExpectativasMercadoAnuais?$filter=${enc(`Indicador eq '${ind}' and Data ge '${since}' and baseCalculo eq 0`)}&$orderby=${enc("Data desc")}&$top=500&$format=json`).catch(() => null);
    const rows = b?.value || []; if (!rows.length) continue;
    const dates = [...new Set(rows.map((r) => r.Data))].sort().reverse(); const d0 = dates[0]; const old = dates.find((d) => d <= addDays(d0, -26));
    const years = [...new Set(rows.filter((r) => r.Data === d0).map((r) => r.DataReferencia))].sort().slice(0, 5);
    out.inds[ind] = years.map((y) => ({ y, med: rows.find((r) => r.Data === d0 && r.DataReferencia === y)?.Mediana ?? null, old: rows.find((r) => r.Data === old && r.DataReferencia === y)?.Mediana ?? null, n: rows.find((r) => r.Data === d0 && r.DataReferencia === y)?.numeroRespondentes ?? null }));
    if (!out.date || d0 > out.date) out.date = d0; await sleep(150);
  }
  const s = await http(`${FOC}/ExpectativasMercadoSelic?$filter=${enc(`baseCalculo eq 1 and Data ge '${since}'`)}&$orderby=${enc("Data desc")}&$top=600&$format=json`).catch(() => null);
  const sr = s?.value || []; if (sr.length) { const dd = [...new Set(sr.map((r) => r.Data))].sort().reverse()[0]; out.selic = { date: dd, mtgs: sr.filter((r) => r.Data === dd).map((r) => [r.Reuniao, r.Mediana]).sort((a, b) => { const k = (x) => x[0].split("/").reverse().join("-").replace(/R(\d)$/, "R0$1"); return k(a) < k(b) ? -1 : 1; }) }; }
  if (!out.date) throw new Error("vazio");
  await writeJson("focus.json", { updated: new Date().toISOString(), ...out });
  return { rows: Object.keys(out.inds).length, lastObs: out.date };
});

/* =====================================================================
 * 5) IBGE — IPCA por grupo, subitem e área; população
 * ===================================================================== */
const ymOf = (p) => `${p.slice(0, 4)}-${p.slice(4)}`;
function ibgeParse(body) {   // → lista de {varId, cat:{id,name}, loc:{id,name,nivel}, serie}
  const out = [];
  for (const v of body || []) for (const r of v.resultados || []) {
    const cl = r.classificacoes?.[0]?.categoria || {}; const [cid, cname] = Object.entries(cl)[0] || [null, null];
    for (const s of r.series || []) out.push({ varId: v.id, cat: { id: cid, name: cname }, loc: { id: s.localidade?.id, name: s.localidade?.nome, nivel: s.localidade?.nivel?.id }, serie: s.serie || {} });
  }
  return out;
}
await task("ibge", async () => {
  const groups = { 7169: "Índice geral", 7170: "Alimentação e bebidas", 7445: "Habitação", 7486: "Artigos de residência", 7558: "Vestuário", 7625: "Transportes", 7660: "Saúde e cuidados pessoais", 7712: "Despesas pessoais", 7766: "Educação", 7786: "Comunicação" };
  const out = { groups: {}, weights: {}, subitems: [], areas: [], pop: {} };
  const g = ibgeParse(await http(`${BASE.ibge}/7060/periodos/-60/variaveis/63|2265?localidades=N1[all]&classificacao=315[${Object.keys(groups).join(",")}]`));
  for (const x of g) { const o = out.groups[x.cat.id] || (out.groups[x.cat.id] = { name: groups[x.cat.id] || x.cat.name, mm: [], a12: [] }); (x.varId == 63 ? o.mm : o.a12).push(...Object.entries(x.serie).map(([p, v]) => [ymOf(p), num(v)])); }
  for (const o of Object.values(out.groups)) { o.mm.sort(); o.a12.sort(); }
  const w = ibgeParse(await http(`${BASE.ibge}/7060/periodos/-1/variaveis/66?localidades=N1[all]&classificacao=315[${Object.keys(groups).join(",")}]`));
  for (const x of w) out.weights[x.cat.id] = num(Object.values(x.serie)[0]);
  const sub = ibgeParse(await http(`${BASE.ibge}/7060/periodos/-1/variaveis/63|2265|66?localidades=N1[all]&classificacao=315[all]`, { timeout: 180000 }));
  const bySub = {}; for (const x of sub) { const e = bySub[x.cat.id] || (bySub[x.cat.id] = { id: x.cat.id, name: String(x.cat.name || "").replace(/^\d+\./, ""), lvl: (String(x.cat.name || "").match(/^(\d+)\./) || [, ""])[1].length || null }); e[x.varId == 63 ? "mm" : x.varId == 2265 ? "a12" : "w"] = num(Object.values(x.serie)[0]); }
  out.subitems = Object.values(bySub).filter((s) => s.a12 != null && s.id !== "7169");
  const ar = ibgeParse(await http(`${BASE.ibge}/7060/periodos/-13/variaveis/63|2265?localidades=N7[all]|N6[all]&classificacao=315[7169]`));
  const byArea = {}; for (const x of ar) { const e = byArea[x.loc.id] || (byArea[x.loc.id] = { id: x.loc.id, name: x.loc.name }); const ks = Object.keys(x.serie).sort(); const key = x.varId == 63 ? "mm" : "a12"; e[key] = num(x.serie[ks.at(-1)]); if (key === "a12") { e.a12ago = num(x.serie[ks[0]]); e.ref = ymOf(ks.at(-1)); } }
  out.areas = Object.values(byArea).filter((a) => a.a12 != null);
  const pop = ibgeParse(await http(`${BASE.ibge}/6579/periodos/-2/variaveis/9324?localidades=N1[all]|N3[all]`));
  for (const x of pop) out.pop[x.loc.id] = Object.fromEntries(Object.entries(x.serie).map(([y, v]) => [y, num(v)]));
  if (!out.groups[7169]?.mm.length) throw new Error("IPCA vazio");
  await writeJson("ibge.json", { updated: new Date().toISOString(), ...out });
  return { rows: out.subitems.length, lastObs: out.groups[7169].mm.at(-1)[0] };
});

/* =====================================================================
 * 6) MUNDO — Banco Mundial, FMI, BIS
 * ===================================================================== */
async function wbAll(ind, from, to) {
  const rows = []; let page = 1, pages = 1;
  do { const b = await http(`${BASE.wb}/country/all/indicator/${ind}?format=json&per_page=20000&page=${page}&date=${from}:${to}`, { timeout: 150000 }); if (!Array.isArray(b)) break; pages = b[0]?.pages || 1; rows.push(...(b[1] || [])); page++; } while (page <= pages);
  return rows;
}
const worldOut = (await readJson("world.json", null)) || {};
await task("world:wb", async () => {
  const cs = (await http(`${BASE.wb}/country?format=json&per_page=400`))?.[1] || [];
  const names = new Map(cs.filter((c) => c.region && c.region.value !== "Aggregates").map((c) => [c.id, c.name]));
  const year = +TODAY.slice(0, 4);
  const infl = await wbAll("FP.CPI.TOTL.ZG", 1960, year);
  const inf = {}; for (const r of infl) { const k = r.countryiso3code; if (!names.has(k) || r.value == null) continue; (inf[k] || (inf[k] = {}))[r.date] = +(+r.value).toFixed(3); }
  const pops = await wbAll("SP.POP.TOTL", year - 3, year); const pop = {}; for (const r of pops.sort((a, b) => (a.date < b.date ? -1 : 1))) { const k = r.countryiso3code; if (names.has(k) && r.value != null) pop[k] = [+r.date, +r.value]; }
  worldOut.names = Object.fromEntries(names); worldOut.inflation = inf; worldOut.pop = pop;
  if (!inf.BRA) throw new Error("sem Brasil"); return { rows: Object.keys(inf).length, lastObs: String(Math.max(...Object.keys(inf.BRA).map(Number))) };
});
await task("world:imf", async () => {
  const get = async (ind) => (await http(`${BASE.imf}/${ind}`))?.values?.[ind] || {};
  const years = []; for (let y = 1990; y <= 2031; y++) years.push(y);
  const pack = (obj) => { const o = {}; for (const [iso, ys] of Object.entries(obj)) if (!worldOut.names || worldOut.names[iso]) o[iso] = years.map((y) => (ys[y] != null ? +(+ys[y]).toFixed(2) : null)); return o; };
  const debt = await get("GGXWDG_NGDP"); await sleep(400); const infl = await get("PCPIPCH");
  if (!debt.BRA) throw new Error("sem Brasil");
  worldOut.imf = { years, debt: pack(debt), infl: pack(infl) }; return { rows: Object.keys(debt).length, lastObs: String(years.at(-1)) };
});
await task("world:bis", async () => {
  const systems = ["BR7P", "IN9P", "US9P", "GB5P", "EU9P", "AU2P", "MX1P", "JP3P"];
  const j = await http(`${BASE.bis}/data/dataflow/BIS/WS_CPMI_SYSTEMS/1.0/*.*.*.*.${systems.join("+")}.*.*.*?lastNObservations=12&detail=dataonly`, { headers: { Accept: "application/vnd.sdmx.data+json;version=1.0.0" } });
  const root = j.data || j; const ds = root.dataSets[0]; const dims = root.structure.dimensions.series; const od = root.structure.dimensions.observation[0].values.map((v) => v.id);
  const sys = {};
  const dimsOf = (k) => { const d = {}; k.split(":").map(Number).forEach((i, n) => { d[dims[n].id] = dims[n].values[i]; }); return d; };
  /* Armadilha (conferida ao vivo em 02/11/2026): o BIS publica, para o mesmo sistema, séries com TYPE_OF_INFO diferente —
   * "Z" (não se aplica) é o total de transações; "N" (ciclos de compensação, no Japão) vale 1 e destruía o número real. Usamos só o "Z"
   * quando ele existe. */
  const hasZ = new Set(); for (const k of Object.keys(ds.series)) { const d = dimsOf(k); if (d.TYPE_OF_INFO?.id === "Z" && ["PA", "PB"].includes(d.INSTRUMENT_TYPE?.id) && ["N", "V"].includes(d.MEASURE?.id)) hasZ.add(d.SYSTEM.id + "|" + d.MEASURE.id); }
  for (const [k, s] of Object.entries(ds.series)) {
    const d = dimsOf(k);
    if (d.TYPE_OF_INFO?.id === "C" || !["PA", "PB"].includes(d.INSTRUMENT_TYPE?.id) || !["N", "V"].includes(d.MEASURE?.id)) continue;
    if (d.TYPE_OF_INFO?.id !== "Z" && hasZ.has(d.SYSTEM.id + "|" + d.MEASURE.id)) continue;
    const e = sys[d.SYSTEM.id] || (sys[d.SYSTEM.id] = { name: d.SYSTEM.name || d.SYSTEM.id, cty: d.REP_CTY.id, N: {}, V: {} });
    const target = e[d.MEASURE.id]; if (d.INSTRUMENT_TYPE.id === "PB" && Object.keys(target).length) continue;
    for (const [o, v] of Object.entries(s.observations)) { const val = Number(v[0]); if (Number.isFinite(val) && val > 0 && /^\d{4}$/.test(od[o])) target[od[o]] = val; }
  }
  if (!sys.BR7P?.N || !Object.keys(sys.BR7P.N).length) throw new Error("sem SPI (Pix)");
  worldOut.bis = { systems: sys, unit: { N: "milhões de transações", V: "milhões, moeda local" } };
  return { rows: Object.keys(sys).length, lastObs: String(Math.max(...Object.keys(sys.BR7P.N).map(Number))) };
});
if (!ONLY.length || ONLY.some((o) => o.startsWith("world"))) { worldOut.updated = new Date().toISOString(); await writeJson("world.json", worldOut); }

/* =====================================================================
 * 7) IPEADATA — salário mínimo desde 1940 (museu)
 * ===================================================================== */
await task("history", async () => {
  const b = await http(`${BASE.ipea}/ValoresSerie(SERCODIGO='MTE12_SALMIN12')`, { timeout: 90000 });
  const rows = (b?.value || []).filter((x) => x.VALVALOR != null && x.VALDATA.slice(0, 10) <= TODAY).map((x) => [x.VALDATA.slice(0, 7), x.VALVALOR]).sort((a, c) => (a[0] < c[0] ? -1 : 1));   // o Ipeadata já traz meses futuros
  if (rows.length < 100) throw new Error("série curta");
  await writeJson("history.json", { updated: new Date().toISOString(), salMin: rows });
  return { rows: rows.length, lastObs: rows.at(-1)[0] };
});

/* =====================================================================
 * 8) BITCOIN — histórico em US$ (blockchain.com) × PTAX = R$
 * ===================================================================== */
await task("btc", async () => {
  const b = await http(`${BASE.btc}/charts/market-price?timespan=all&format=json&sampled=false`, { headers: { "Accept-Language": "en" }, timeout: 120000 });
  const usd = new Map(); for (const p of b?.values || []) if (p.y > 0) usd.set(new Date(p.x * 1000).toISOString().slice(0, 10), p.y);
  if (usd.size < 1000) throw new Error("histórico curto");
  const px = ptaxDaily.map || []; let j = 0, rate = null; const brl = [];
  for (const [d, y] of [...usd.entries()].sort()) { while (j < px.length && px[j][0] <= d) { rate = px[j][1]; j++; } if (rate) brl.push([d, +(y * rate).toFixed(2)]); }
  const me = (arr) => { const m = new Map(); for (const [d, v] of arr) m.set(d.slice(0, 7), v); return [...m.entries()]; };
  const usdArr = [...usd.entries()].sort();
  await writeJson("btc.json", { updated: new Date().toISOString(), usdM: me(usdArr), brlM: me(brl), brlD: brl.slice(-800), usdD: usdArr.slice(-800) });
  return { rows: usd.size, lastObs: usdArr.at(-1)[0] };
});

/* =====================================================================
 * MANIFESTO (catálogo + status) — alimenta a aba "Dados"
 * ===================================================================== */
const seriesMeta = Object.fromEntries(Object.entries(SGS).map(([k, [code, pt, en, unit, freq]]) => [k, { code, name: { pt, en }, unit, freq }]));
await writeJson("manifest.json", { updated: new Date().toISOString(), today: TODAY, status, series: seriesMeta, providers: PROVIDERS });
const failed = Object.entries(status).filter(([, s]) => s.ok === false);
console.log(`\nOK. ${Object.keys(status).length} tarefas, ${failed.length} com falha.`); if (failed.length) for (const [k, s] of failed) console.log(`  ✗ ${k}: ${s.error}`);
if (!sgsOut && !(await readJson("sgs.json"))) process.exit(1);
