/* Monitor Brasil — camada de dados: carrega os JSON do coletor, calcula séries derivadas
 * (índice de preços desde 1944, Bitcoin em R$, dólar em reais atuais, CDI acumulado…). */
(() => {
  "use strict";
  const MB = window.MB;
  MB.D = {}; MB.ver = 0;
  const memo = new Map();
  MB.memo = (k, fn) => { if (!memo.has(k)) memo.set(k, fn()); return memo.get(k); };
  MB.bump = () => { MB.ver++; memo.clear(); MB.emit("data"); };

  /* códigos usados antes de o manifesto carregar (e na atualização ao vivo) */
  MB.SGS_CODES = { ipca: 433, ipca12: 13522, inpc: 188, igpm: 189, igpdi: 190, ipca15: 7478, selicMeta: 432, selicMes: 4189, cdiMes: 4391, ptax: 1, dbggPct: 13762, dlspPct: 4513, reservas: 13621, salMin: 1619, desemprego: 24369, ibcbr: 24364 };

  const getJson = async (url, noStore) => {
    try { const r = await fetch(url, noStore ? { cache: "no-store" } : undefined); if (!r.ok) throw new Error(r.status); return await r.json(); } catch (e) { console.warn("[dados] falhou:", url, e.message); return null; }
  };
  MB.isFile = location.protocol === "file:";   // aberto com duplo clique: o navegador não deixa ler data/*.json
  MB.load = async () => {
    if (MB.isFile) { MB.D.manifest = {}; for (const f of ["sgs", "pix", "rates", "focus", "ibge", "world", "history", "btc"]) MB.D[f] = {}; MB.empty = true; MB.bump(); return; }
    const man = (await getJson("data/manifest.json?t=" + Math.floor(Date.now() / 60000), true)) || {};
    MB.D.manifest = man;
    const v = encodeURIComponent(man.updated || Date.now());
    await Promise.all(["sgs", "pix", "rates", "focus", "ibge", "world", "history", "btc"].map(async (f) => { MB.D[f] = (await getJson(`data/${f}.json?v=${v}`)) || {}; }));
    MB.empty = !MB.D.sgs?.series || !Object.keys(MB.D.sgs.series).length;
    MB.bump();
  };
  /** recarrega os JSON (o coletor roda a cada ~2 h); só atualiza se o manifesto mudou. */
  MB.reloadIfNew = async () => {
    if (MB.isFile) return false;
    const man = await getJson("data/manifest.json?t=" + Date.now(), true);
    if (man?.updated && man.updated !== MB.D.manifest?.updated) { await MB.load(); return true; }
    return false;
  };

  /* ------------------------- geometrias ------------------------- */
  const geoP = {};
  /* os contornos vêm embutidos (assets/js/geo-data.js): funciona até abrindo o arquivo com duplo clique; o fetch é só reserva */
  MB.geoData = (name) => (window.MB_GEO && window.MB_GEO[name]) || null;
  MB.ensureGeo = (name) => (geoP[name] ||= Promise.resolve(MB.geoData(name) || fetch(name === "world" ? "assets/geo/world.json" : "assets/geo/br-states.json").then((r) => r.json())).then((g) => { echarts.registerMap(name, g); MB.geo = MB.geo || {}; MB.geo[name] = g; return g; }));

  /* ------------------------- acessores ------------------------- */
  MB.ser = (k) => MB.D.sgs?.series?.[k]?.a || [];
  MB.serD = (k) => MB.D.sgs?.series?.[k]?.d || [];
  MB.lastOf = (a) => (a && a.length ? a[a.length - 1] : [null, null]);
  MB.last = (k) => MB.lastOf(MB.ser(k));
  MB.lastD = (k) => MB.lastOf(MB.serD(k));
  MB.nth = (a, n) => (a && a.length > n ? a[a.length - 1 - n] : [null, null]);
  MB.ago = (a, months) => { const l = MB.lastOf(a); if (!l[0]) return null; const k = MB.ymAdd(l[0], -months); const f = a.find((p) => p[0] === k); return f ? f[1] : null; };
  MB.meta = (k) => MB.D.manifest?.series?.[k];
  MB.name = (k) => MB.L(MB.meta(k)?.name) || k;
  MB.status = (task) => MB.D.manifest?.status?.[task];

  /* variações acumuladas */
  MB.acc12 = (arr) => { const out = []; for (let i = 11; i < arr.length; i++) { let p = 1; for (let j = i - 11; j <= i; j++) p *= 1 + arr[j][1] / 100; out.push([arr[i][0], (p - 1) * 100]); } return out; };
  MB.ytd = (arr) => { const out = []; let p = 1, y = null; for (const [ym, v] of arr) { if (ym.slice(0, 4) !== y) { y = ym.slice(0, 4); p = 1; } p *= 1 + v / 100; out.push([ym, (p - 1) * 100]); } return out; };
  MB.byYear = (arr) => { const m = new Map(); for (const [ym, v] of arr) { const y = ym.slice(0, 4); m.set(y, (m.get(y) || 1) * (1 + v / 100)); } return [...m.entries()].map(([y, p]) => [y, (p - 1) * 100]); };
  MB.ipca12 = () => MB.memo("ipca12", () => (MB.ser("ipca").length > 12 ? MB.acc12(MB.ser("ipca")) : MB.ser("ipca12")));

  /* ------------------------- moedas do Brasil ------------------------- */
  MB.MOEDAS = [
    { id: "reis", name: "Réis / Mil-réis", sym: "Rs", from: "1822-09-07", to: "1942-10-31", ratio: 1, act: null, color: "#8a839a" },
    { id: "cruzeiro1", name: "Cruzeiro", sym: "Cr$", from: "1942-11-01", to: "1967-02-12", ratio: 1, act: "Decreto-Lei 4.791/1942", color: "#9085e9" },
    { id: "cruzeironovo", name: "Cruzeiro Novo", sym: "NCr$", from: "1967-02-13", to: "1970-05-14", ratio: 1000, act: "Decreto-Lei 1/1965; Decreto 60.190/1967", color: "#6f5fd0" },
    { id: "cruzeiro2", name: "Cruzeiro", sym: "Cr$", from: "1970-05-15", to: "1986-02-27", ratio: 1, act: "Resolução CMN 144/1970", color: "#3987e5" },
    { id: "cruzado", name: "Cruzado", sym: "Cz$", from: "1986-02-28", to: "1989-01-14", ratio: 1000, act: "Decreto-Lei 2.283/1986", color: "#1fb5a8" },
    { id: "cruzadonovo", name: "Cruzado Novo", sym: "NCz$", from: "1989-01-15", to: "1990-03-15", ratio: 1000, act: "Medida Provisória 32/1989", color: "#f5a524" },
    { id: "cruzeiro3", name: "Cruzeiro", sym: "Cr$", from: "1990-03-16", to: "1993-07-31", ratio: 1, act: "Medida Provisória 168/1990", color: "#e0529c" },
    { id: "cruzeiroreal", name: "Cruzeiro Real", sym: "CR$", from: "1993-08-01", to: "1994-06-30", ratio: 1000, act: "Medida Provisória 336/1993", color: "#ff5c63" },
    { id: "real", name: "Real", sym: "R$", from: "1994-07-01", to: null, ratio: 2750, act: "Medida Provisória 542/1994", color: "#ff8a00" },
  ];
  /* F = quantas unidades da moeda da época valem R$ 1 hoje (produto das razões das moedas seguintes) */
  MB.MOEDAS.forEach((m, i, a) => { m.F = a.slice(i + 1).reduce((p, x) => p * x.ratio, 1); });
  MB.eraAtDate = (iso) => MB.MOEDAS.find((m) => iso >= m.from && (!m.to || iso <= m.to)) || MB.MOEDAS.at(-1);
  MB.eraAtYm = (ym) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(); return MB.eraAtDate(`${ym}-${String(d).padStart(2, "0")}`); };
  /** valor numa moeda antiga → reais atuais (só conversão, sem inflação) */
  MB.toReal = (v, ym) => v / MB.eraAtYm(ym).F;

  /* ------------------------- índice de preços (IGP-DI até 1979 + IPCA) ------------------------- */
  MB.idx = () => MB.memo("idx", () => {
    const map = new Map(), keys = [], ip = MB.ser("ipca"), ig = MB.ser("igpdi");
    const ipFirst = ip[0]?.[0] || "1980-01";
    let cum = 1;
    for (const [ym, v] of ig) if (ym < ipFirst) { cum *= 1 + v / 100; map.set(ym, cum); keys.push(ym); }
    for (const [ym, v] of ip) { cum *= 1 + v / 100; map.set(ym, cum); keys.push(ym); }
    return { map, keys, first: keys[0], last: keys.at(-1) };
  });
  /** nível de preços no FIM do mês ym */
  MB.P = (ym) => { const I = MB.idx(); if (!I.first || ym < I.first) return null; if (ym > I.last) return I.map.get(I.last); return I.map.get(ym) ?? null; };
  MB.Pnow = () => { const I = MB.idx(); return I.last ? I.map.get(I.last) : null; };
  /** nível de preços no INÍCIO do mês ym (= fim do mês anterior) */
  MB.Pstart = (ym) => MB.P(MB.ymAdd(ym, -1));
  /** quanto R$ 1 do início de `ym` vale hoje em poder de compra */
  MB.powerNow = (ym) => { const a = MB.Pstart(ym), b = MB.Pnow(); return a && b ? a / b : null; };
  /** fator de correção do início de `ym` até hoje */
  MB.factorNow = (ym) => { const a = MB.Pstart(ym), b = MB.Pnow(); return a && b ? b / a : null; };
  /** inflação média anual composta entre dois meses */
  MB.cagr = (f, months) => (f > 0 && months > 0 ? (Math.pow(f, 12 / months) - 1) * 100 : null);

  /* ------------------------- dólar / CDI / salário ------------------------- */
  /** PTAX de fim de mês em reais atuais (converte moedas antigas) */
  MB.ptaxM = () => MB.memo("ptaxM", () => MB.ser("ptax").map(([ym, v]) => [ym, MB.toReal(v, ym)]));
  MB.ptaxModern = () => MB.memo("ptaxModern", () => MB.ptaxM().filter((p) => p[0] >= "1994-07"));
  MB.usdBrl = () => MB.live?.usdBrl || MB.lastD("ptax")[1] || MB.last("ptax")[1];
  MB.cdiIdx = () => MB.memo("cdiIdx", () => { const m = new Map(); let c = 1; for (const [ym, v] of MB.ser("cdiMes")) { c *= 1 + v / 100; m.set(ym, c); } return m; });
  /** salário mínimo nominal em reais atuais desde 1940 (Ipeadata) — mensal */
  MB.salMinLong = () => MB.memo("salMinLong", () => {
    const a = MB.D.history?.salMin || []; if (!a.length) return [];
    /* o Ipeadata publica em reais correntes (1940 ≈ 10⁻¹²); se vier na moeda da época, converte */
    return a[0][1] > 1e-6 ? a.map(([ym, v]) => [ym, MB.toReal(v, ym)]) : a;
  });
  /** salário mínimo em poder de compra de hoje */
  MB.salMinReal = () => MB.memo("salMinReal", () => { const now = MB.Pnow(); return MB.salMinLong().map(([ym, v]) => { const p = MB.P(ym); return p && now ? [ym, (v * now) / p] : null; }).filter(Boolean); });

  /* ------------------------- Bitcoin em reais ------------------------- */
  MB.btcM = () => MB.memo("btcM@" + (MB.live?.btcBrl ? Math.round(MB.live.btcBrl / 50) : 0), () => {
    const a = (MB.D.btc?.brlM || []).slice();
    if (MB.live?.btcBrl && a.length) { const ym = MB.nowYm(); if (a.at(-1)[0] === ym) a[a.length - 1] = [ym, MB.live.btcBrl]; else if (a.at(-1)[0] < ym) a.push([ym, MB.live.btcBrl]); }
    return a;
  });
  MB.btcUsdM = () => MB.D.btc?.usdM || [];
  MB.btcNow = () => MB.live?.btcBrl || MB.lastOf(MB.D.btc?.brlD)[1] || MB.lastOf(MB.D.btc?.brlM)[1];
  MB.btcUsdNow = () => MB.live?.btcUsd || MB.lastOf(MB.D.btc?.usdD)[1];
  /** sats por R$ 1 */
  MB.sats = (brlPerBtc) => (brlPerBtc > 0 ? 1e8 / brlPerBtc : null);
  MB.mapOf = (arr) => new Map(arr);

  /* oferta de Bitcoin pelo calendário dos halvings (aprox.) */
  MB.HALVINGS = [["2012-11-28", 10.5e6], ["2016-07-09", 15.75e6], ["2020-05-11", 18.375e6], ["2024-04-20", 19.6875e6], ["2028-04-15", 20.34375e6]];
  MB.btcSupply = (ms) => {
    const pts = [[Date.UTC(2009, 0, 3), 0], ...MB.HALVINGS.map(([d, v]) => [Date.parse(d), v])];
    for (let i = 1; i < pts.length; i++) if (ms <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return va + ((vb - va) * (ms - a)) / (b - a); }
    return 20.34375e6 + ((ms - pts.at(-1)[0]) / 864e5) * 144 * 1.5625;
  };

  /* ------------------------- comparador Real × Bitcoin × dólar × CDI ------------------------- */
  /** séries (nominais, em R$) partindo de 100 no início de `startYm` */
  MB.compareFrom = (startYm, { real = false } = {}) => {
    const base = MB.ymAdd(startYm, -1), now = MB.nowYm();
    const btc = MB.mapOf(MB.btcM()), usd = MB.mapOf(MB.ptaxM()), cdi = MB.cdiIdx(), out = { btc: [], usd: [], cdi: [], ipca: [], cash: [] };
    const b0 = { btc: btc.get(base), usd: usd.get(base), cdi: cdi.get(base), p: MB.P(base) };
    for (let ym = startYm; ym <= now; ym = MB.ymAdd(ym, 1)) {
      const defl = real ? (MB.P(ym) && b0.p ? b0.p / MB.P(ym) : null) : 1;
      if (defl == null) continue;
      if (b0.btc && btc.has(ym)) out.btc.push([ym, (100 * btc.get(ym) / b0.btc) * defl]);
      if (b0.usd && usd.has(ym)) out.usd.push([ym, (100 * usd.get(ym) / b0.usd) * defl]);
      if (b0.cdi && cdi.has(ym)) out.cdi.push([ym, (100 * cdi.get(ym) / b0.cdi) * defl]);
      if (b0.p && MB.P(ym)) { out.ipca.push([ym, (100 * MB.P(ym)) / b0.p]); out.cash.push([ym, 100 * (b0.p / MB.P(ym))]); }
    }
    return out;
  };

  /* ------------------------- métricas derivadas usadas em vários lugares ------------------------- */
  /** juros do governo por segundo (estimativa): juros nominais 12m (% PIB) × PIB 12m (R$) ÷ segundos do ano */
  MB.govInterestPerSec = () => {
    const j = MB.last("juros12")[1], pib = MB.last("pib12")[1]; // % do PIB ; R$ milhões
    return j != null && pib != null ? ((j / 100) * pib * 1e6) / (365.25 * 86400) : null;
  };
  MB.pixPerSec = () => {
    const m = MB.D.pix?.mpv?.at(-1); if (!m) return null;
    const [y, mo] = m.m.split("-").map(Number);
    return { pps: m.pix[0] / (new Date(y, mo, 0).getDate() * 86400), month: m.m };
  };
  /** Pix: totais desde o lançamento e por ano, somando a série mensal do Banco Central (meios de pagamento) */
  MB.pixTotals = () => MB.memo("pixTotals", () => {
    const m = MB.D.pix?.mpv; if (!m?.length) return null;
    const by = new Map(); let n = 0, v = 0;
    for (const x of m) { const y = x.m.slice(0, 4), o = by.get(y) || { y, n: 0, v: 0, months: 0, last: x.m }; o.n += x.pix[0]; o.v += x.pix[1]; o.months++; o.last = x.m; by.set(y, o); n += x.pix[0]; v += x.pix[1]; }
    const years = [...by.values()]; years.forEach((o) => { o.partial = o.months < 12; });
    return { n, v, first: m[0].m, last: m.at(-1).m, years };
  });
  MB.population = () => { const p = MB.D.ibge?.pop?.["1"]; if (!p) return null; const y = Object.keys(p).sort().at(-1); return { year: +y, n: p[y] }; };
})();
