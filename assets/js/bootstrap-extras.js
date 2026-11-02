/* Monitor Brasil — carga direta no navegador das demais fontes abertas (rede de segurança, parte 2).
 *
 * Quando o coletor ainda não rodou (ou o site é aberto com duplo clique, sem servidor), o navegador busca sozinho,
 * em segundo plano, o que as fontes liberam para acesso direto (CORS): Pix (Banco Central), Bitcoin (Bitstamp),
 * Banco Mundial, BIS, IBGE e Ipeadata. O que não libera (FMI, Boletim Focus, juros por banco) continua só no coletor.
 * Espelha as regras de scripts/collect.mjs (mesmos formatos de dados). Cache de 6 h no localStorage.
 */
(() => {
  "use strict";
  const MB = window.MB, KEY = "mb-boot-x2", TTL = 6 * 3600e3;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const num = (s) => { const v = typeof s === "number" ? s : parseFloat(String(s ?? "").replace(",", ".")); return isFinite(v) ? v : null; };
  const OLINDA = "https://olinda.bcb.gov.br/olinda/servico", WB = "https://api.worldbank.org/v2", BIS = "https://stats.bis.org/api/v2", IPEA = "https://www.ipeadata.gov.br/api/odata4", IBGE = "https://servicodados.ibge.gov.br/api/v3/agregados", BTC = "https://www.bitstamp.net/api/v2/ohlc/btcusd/";
  MB.bootX = { state: "idle", done: [], failed: [], running: 0 };

  async function getJson(url, { tries = 2, timeout = 60000, headers } = {}) {
    let err;
    for (let i = 0; i < tries; i++) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeout);
      try { const r = await fetch(url, { signal: ctl.signal, headers }); clearTimeout(to); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
      catch (e) { clearTimeout(to); err = e; await sleep(1000 * (i + 1)); }
    }
    throw err;
  }
  const loadCache = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { return {}; } };
  const saveCache = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* sem espaço: segue sem cache */ } };
  let bumpT; const scheduleBump = () => { clearTimeout(bumpT); bumpT = setTimeout(() => MB.bump(), 500); };

  /* ----- Pix (Banco Central · meios de pagamento): mensal e trimestral ----- */
  async function taskPix() {
    const MPV = `${OLINDA}/MPV_DadosAbertos/versao/v1/odata`;
    const m = await getJson(`${MPV}/MeiosdePagamentosMensalDA(AnoMes=@AnoMes)?@AnoMes='202011'&$format=json`, { timeout: 90000, tries: 3 });
    const mpv = (m?.value || []).map((x) => ({ m: `${x.AnoMes.slice(0, 4)}-${x.AnoMes.slice(4)}`, pix: [x.quantidadePix * 1e3, x.valorPix * 1e6], ted: [x.quantidadeTED * 1e3, x.valorTED * 1e6], boleto: [x.quantidadeBoleto * 1e3, x.valorBoleto * 1e6], cheque: [x.quantidadeCheque * 1e3, x.valorCheque * 1e6], doc: [x.quantidadeDOC * 1e3, x.valorDOC * 1e6], tec: [x.quantidadeTEC * 1e3, x.valorTEC * 1e6] }))
      .filter((r) => r.pix[0] > 0).sort((a, b) => (a.m < b.m ? -1 : 1));
    if (!mpv.length) throw new Error("MPV mensal vazio");
    let mpvQ = []; try {
      const q = await getJson(`${OLINDA}/MPV_DadosAbertos/versao/v1/odata/MeiosdePagamentosTrimestralDA(trimestre=@trimestre)?@trimestre='20201'&$format=json`, { timeout: 90000 });
      mpvQ = (q?.value || []).map((x) => { const o = { d: x.datatrimestre }; for (const k of ["Pix", "TED", "TEC", "Cheque", "Boleto", "DOC", "CartaoCredito", "CartaoDebito", "CartaoPrePago", "TransIntrabancaria", "Convenios", "DebitoDireto", "Saques"]) o[k] = [(x["quantidade" + k] || 0) * 1e3, (x["valor" + k] || 0) * 1e6]; return o; }).sort((a, b) => (a.d < b.d ? -1 : 1));
    } catch (e) { console.warn("[boot-x] Pix trimestral:", e.message); }
    return { target: "pix", patch: { mpv, mpvQ }, st: { rows: mpv.length, lastObs: mpv.at(-1).m }, key: "pix:mpv" };
  }

  /* ----- Banco Mundial: inflação por país, nomes e população ----- */
  async function wbAll(ind, from, to) {
    const rows = []; let page = 1, pages = 1;
    do { const b = await getJson(`${WB}/country/all/indicator/${ind}?format=json&per_page=20000&page=${page}&date=${from}:${to}`, { timeout: 120000 }); if (!Array.isArray(b)) break; pages = b[0]?.pages || 1; rows.push(...(b[1] || [])); page++; } while (page <= pages);
    return rows;
  }
  async function taskWb() {
    const cs = (await getJson(`${WB}/country?format=json&per_page=400`))?.[1] || [];
    const names = new Map(cs.filter((c) => c.region && c.region.value !== "Aggregates").map((c) => [c.id, c.name]));
    const year = new Date().getFullYear();
    const inf = {}; for (const r of await wbAll("FP.CPI.TOTL.ZG", 1960, year)) { const k = r.countryiso3code; if (!names.has(k) || r.value == null) continue; (inf[k] || (inf[k] = {}))[r.date] = +(+r.value).toFixed(3); }
    const pop = {}; for (const r of (await wbAll("SP.POP.TOTL", year - 3, year)).sort((a, b) => (a.date < b.date ? -1 : 1))) { const k = r.countryiso3code; if (names.has(k) && r.value != null) pop[k] = [+r.date, +r.value]; }
    if (!inf.BRA) throw new Error("sem Brasil");
    return { target: "world", patch: { names: Object.fromEntries(names), inflation: inf, pop }, st: { rows: Object.keys(inf).length, lastObs: String(Math.max(...Object.keys(inf.BRA).map(Number))) }, key: "world:wb" };
  }

  /* ----- BIS: pagamentos instantâneos por sistema ----- */
  async function taskBis() {
    const systems = ["BR7P", "IN9P", "US9P", "GB5P", "EU9P", "AU2P", "MX1P", "JP3P"];
    const j = await getJson(`${BIS}/data/dataflow/BIS/WS_CPMI_SYSTEMS/1.0/*.*.*.*.${systems.join("+")}.*.*.*?lastNObservations=12&detail=dataonly`, { headers: { Accept: "application/vnd.sdmx.data+json;version=1.0.0" }, timeout: 90000 });
    const root = j.data || j, ds = root.dataSets[0], dims = root.structure.dimensions.series, od = root.structure.dimensions.observation[0].values.map((v) => v.id), sys = {};
    const dimsOf = (k) => { const d = {}; k.split(":").map(Number).forEach((i, n) => { d[dims[n].id] = dims[n].values[i]; }); return d; };
    /* o BIS publica séries com TYPE_OF_INFO diferente para o mesmo sistema; "Z" é o total de transações ("N" = ciclos de compensação, vale 1) */
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
    return { target: "world", patch: { bis: { systems: sys, unit: { N: "milhões de transações", V: "milhões, moeda local" } } }, st: { rows: Object.keys(sys).length, lastObs: String(Math.max(...Object.keys(sys.BR7P.N).map(Number))) }, key: "world:bis" };
  }

  /* ----- Ipeadata: salário mínimo desde 1940 ----- */
  async function taskIpea() {
    const b = await getJson(`${IPEA}/ValoresSerie(SERCODIGO='MTE12_SALMIN12')`, { timeout: 90000 });
    const today = MB.todayIso();
    const salMin = (b?.value || []).filter((x) => x.VALVALOR != null && x.VALDATA.slice(0, 10) <= today).map((x) => [x.VALDATA.slice(0, 7), x.VALVALOR]).sort((a, c) => (a[0] < c[0] ? -1 : 1)); // o Ipeadata já traz meses futuros
    if (salMin.length < 100) throw new Error("série curta");
    return { target: "history", patch: { salMin }, st: { rows: salMin.length, lastObs: salMin.at(-1)[0] }, key: "history" };
  }

  /* ----- IBGE: IPCA por grupo, item e região; população ----- */
  const ymOf = (p) => `${p.slice(0, 4)}-${p.slice(4)}`;
  function ibgeParse(body) {
    const out = [];
    for (const v of body || []) for (const r of v.resultados || []) {
      const cl = r.classificacoes?.[0]?.categoria || {}; const [cid, cname] = Object.entries(cl)[0] || [null, null];
      for (const s of r.series || []) out.push({ varId: v.id, cat: { id: cid, name: cname }, loc: { id: s.localidade?.id, name: s.localidade?.nome, nivel: s.localidade?.nivel?.id }, serie: s.serie || {} });
    }
    return out;
  }
  async function taskIbge() {
    const groups = { 7169: "Índice geral", 7170: "Alimentação e bebidas", 7445: "Habitação", 7486: "Artigos de residência", 7558: "Vestuário", 7625: "Transportes", 7660: "Saúde e cuidados pessoais", 7712: "Despesas pessoais", 7766: "Educação", 7786: "Comunicação" };
    const out = { groups: {}, weights: {}, subitems: [], areas: [], pop: {} }, ids = Object.keys(groups).join(",");
    const g = ibgeParse(await getJson(`${IBGE}/7060/periodos/-60/variaveis/63|2265?localidades=N1[all]&classificacao=315[${ids}]`, { timeout: 90000 }));
    for (const x of g) { const o = out.groups[x.cat.id] || (out.groups[x.cat.id] = { name: groups[x.cat.id] || x.cat.name, mm: [], a12: [] }); (x.varId == 63 ? o.mm : o.a12).push(...Object.entries(x.serie).map(([p, v]) => [ymOf(p), num(v)])); }
    for (const o of Object.values(out.groups)) { o.mm.sort(); o.a12.sort(); }
    for (const x of ibgeParse(await getJson(`${IBGE}/7060/periodos/-1/variaveis/66?localidades=N1[all]&classificacao=315[${ids}]`))) out.weights[x.cat.id] = num(Object.values(x.serie)[0]);
    const sub = ibgeParse(await getJson(`${IBGE}/7060/periodos/-1/variaveis/63|2265|66?localidades=N1[all]&classificacao=315[all]`, { timeout: 180000 }));
    const bySub = {}; for (const x of sub) { const e = bySub[x.cat.id] || (bySub[x.cat.id] = { id: x.cat.id, name: String(x.cat.name || "").replace(/^\d+\./, ""), lvl: (String(x.cat.name || "").match(/^(\d+)\./) || [, ""])[1].length || null }); e[x.varId == 63 ? "mm" : x.varId == 2265 ? "a12" : "w"] = num(Object.values(x.serie)[0]); }
    out.subitems = Object.values(bySub).filter((s) => s.a12 != null && s.id !== "7169");
    const ar = ibgeParse(await getJson(`${IBGE}/7060/periodos/-13/variaveis/63|2265?localidades=N7[all]|N6[all]&classificacao=315[7169]`));
    const byArea = {}; for (const x of ar) { const e = byArea[x.loc.id] || (byArea[x.loc.id] = { id: x.loc.id, name: x.loc.name }); const ks = Object.keys(x.serie).sort(), key = x.varId == 63 ? "mm" : "a12"; e[key] = num(x.serie[ks.at(-1)]); if (key === "a12") { e.a12ago = num(x.serie[ks[0]]); e.ref = ymOf(ks.at(-1)); } }
    out.areas = Object.values(byArea).filter((a) => a.a12 != null);
    for (const x of ibgeParse(await getJson(`${IBGE}/6579/periodos/-2/variaveis/9324?localidades=N1[all]|N3[all]`))) out.pop[x.loc.id] = Object.fromEntries(Object.entries(x.serie).map(([y, v]) => [y, num(v)]));
    if (!out.groups[7169]?.mm.length) throw new Error("IPCA vazio");
    return { target: "ibge", patch: out, st: { rows: out.subitems.length, lastObs: out.groups[7169].mm.at(-1)[0] }, key: "ibge" };
  }

  /* ----- Bitcoin: histórico diário em US$ (Bitstamp) → fim de mês; em R$ pelo PTAX do site ----- */
  async function taskBtc() {
    const daily = new Map(); let start = Math.floor(Date.UTC(2011, 7, 1) / 1000);
    for (let page = 0; page < 14; page++) {
      const j = await getJson(`${BTC}?step=86400&limit=1000&start=${start}`, { timeout: 60000, tries: 3 });
      const a = (j?.data?.ohlc || []).map((x) => [new Date(x.timestamp * 1000).toISOString().slice(0, 10), +x.close]).filter((x) => x[1] > 0);
      if (!a.length) break; for (const [d, v] of a) daily.set(d, v);
      const last = Math.max(...(j.data.ohlc || []).map((x) => +x.timestamp)); if (last * 1000 > Date.now() - 2 * 864e5) break;
      start = last + 86400; await sleep(250);
    }
    const usdArr = [...daily.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (usdArr.length < 1000) throw new Error("histórico curto");
    const me = new Map(); for (const [d, v] of usdArr) me.set(d.slice(0, 7), v);
    return { target: "btc", patch: { usdM: [...me.entries()], usdD: usdArr.slice(-800) }, st: { rows: usdArr.length, lastObs: usdArr.at(-1)[0] }, key: "btc" };
  }
  /* o BTC em R$ é derivado: US$ de fim de mês × PTAX de fim de mês (a mesma conta do coletor) */
  function attachBtc(btc) {
    if (btc.brlM) return btc;
    Object.defineProperty(btc, "brlM", { enumerable: true, configurable: true, get: () => MB.memo("btc-brlM", () => { const px = new Map(MB.ser("ptax")); return (btc.usdM || []).map(([ym, v]) => (px.has(ym) ? [ym, +(v * px.get(ym)).toFixed(2)] : null)).filter(Boolean); }) });
    btc.brlD = btc.brlD || []; return btc;
  }

  const TASKS = [
    ["pix:mpv", () => !MB.D.pix?.mpv?.length, taskPix],
    ["btc", () => !MB.D.btc?.usdM?.length, taskBtc],
    ["world:wb", () => !MB.D.world?.inflation, taskWb],
    ["world:bis", () => !MB.D.world?.bis, taskBis],
    ["history", () => !MB.D.history?.salMin?.length, taskIpea],
    ["ibge", () => !MB.D.ibge?.groups, taskIbge],
  ];
  function merge(r) {
    const cur = MB.D[r.target] || {}; MB.D[r.target] = { ...cur, ...r.patch, fromBrowser: true };
    if (r.target === "btc") MB.D.btc = attachBtc(MB.D.btc);
    MB.D.manifest = MB.D.manifest || {}; (MB.D.manifest.status ||= {})[r.key] = { ok: true, at: new Date().toISOString(), browser: true, ...r.st };
  }

  /** busca, em segundo plano, o que faltar no snapshot. Devolve a lista de tarefas que rodaram. */
  MB.bootstrapExtras = async () => {
    const todo = TASKS.filter(([, need]) => need()); if (!todo.length) return [];
    const cache = loadCache(), ran = [], today = MB.todayIso();
    MB.bootX = { state: "running", done: [], failed: [], running: todo.length };
    await Promise.all(todo.map(async ([key, , fn]) => {
      try {
        const c = cache[key]; let r;
        if (c && c.today === today && Date.now() - c.t < TTL) r = c.r; else { r = await fn(); cache[key] = { t: Date.now(), today, r }; saveCache(cache); }
        merge(r); ran.push(key); MB.bootX.done.push(key); scheduleBump();
      } catch (e) { MB.bootX.failed.push(key); console.warn("[boot-x] falhou", key, e.message); }
      MB.bootX.running--; MB.emit("boot");
    }));
    MB.bootX.state = "done"; MB.emit("boot");
    if (ran.length) scheduleBump();
    return ran;
  };
})();
