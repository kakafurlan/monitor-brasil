/* Monitor Brasil — carga direta do Banco Central no navegador (rede de segurança).
 * Se o coletor ainda não rodou — ou deixou alguma série de fora — o navegador busca as séries SGS direto na API do
 * Banco Central (CORS liberado) usando o catálogo gerado por scripts/make-catalog.mjs. O resultado fica em cache
 * no localStorage por 6 h. Fontes que não aceitam acesso do navegador (FMI, blockchain.com) continuam só no coletor. */
(() => {
  "use strict";
  const MB = window.MB, CAT = window.MB_SGS || {};
  const BASE = "https://api.bcb.gov.br/dados/serie", KEY = "mb-boot-v1";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const num = (s) => { const v = parseFloat(String(s ?? "").replace(",", ".")); return isFinite(v) ? v : null; };
  const brToIso = (s) => { const [d, m, y] = s.split("/"); return `${y}-${m}-${d}`; };
  const isoToBr = (s) => `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
  Object.keys(CAT).forEach((k) => { MB.SGS_CODES[k] = CAT[k][0]; });
  MB.boot = { state: "idle", n: 0, total: 0, at: null, err: null };

  async function getJson(url, tries = 3, timeoutMs = 45000) {
    let err;
    for (let i = 0; i < tries; i++) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), timeoutMs);
      try { const r = await fetch(url, { signal: ctl.signal }); clearTimeout(to); if (r.status === 404) return []; if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
      catch (e) { clearTimeout(to); err = e; await sleep(1200 * (i + 1)); }
    }
    throw err;
  }
  const take = (arr, out) => { if (Array.isArray(arr)) for (const x of arr) { const v = num(x.valor); if (v != null && x.data) out.push([brToIso(x.data), v]); } };
  async function rows(code, daily, fromIso, today) {
    const out = [];
    if (!daily) take(await getJson(`${BASE}/bcdata.sgs.${code}/dados?formato=json`), out);
    else {
      const wins = []; let a = new Date(fromIso + "T12:00:00Z"); const end = new Date(today + "T12:00:00Z");
      while (a <= end) { // a API limita séries diárias a 10 anos por consulta
        const b = new Date(Math.min(Date.UTC(a.getUTCFullYear() + 9, a.getUTCMonth(), a.getUTCDate()), end.getTime()));
        wins.push([a.toISOString().slice(0, 10), b.toISOString().slice(0, 10)]); a = new Date(b.getTime() + 864e5);
      }
      const parts = await Promise.all(wins.map(([x, y]) => getJson(`${BASE}/bcdata.sgs.${code}/dados?formato=json&dataInicial=${isoToBr(x)}&dataFinal=${isoToBr(y)}`, 3, 150000)));
      parts.forEach((p) => take(p, out));
    }
    return out.filter((r) => r[0] <= today).sort((x, y) => (x[0] < y[0] ? -1 : 1)); // descarta datas futuras pré-preenchidas
  }
  /** versão provisória do PTAX: série mensal (média do período, SGS 3698) — chega em segundos; a exata (diária) vem depois */
  async function loadPtaxApprox(today) {
    const r = await rows(3698, false, null, today); if (!r.length) throw new Error("vazia");
    const s = { a: r.map(([d, v]) => [d.slice(0, 7), v]), approx: true }; s.last = s.a.at(-1)[0]; return s;
  }
  async function loadOne(key, today) {
    const [code, , , , freq, opt = {}] = CAT[key];
    if (freq === "m") { const r = await rows(code, false, null, today); if (!r.length) throw new Error("vazia"); const s = { a: r.map(([d, v]) => [d.slice(0, 7), v]) }; s.last = s.a.at(-1)[0]; return s; }
    const hist = await rows(code, true, opt.start ? brToIso(opt.start) : "1999-01-01", today); if (!hist.length) throw new Error("vazia");
    let s;
    if (opt.step) { const pts = []; let last = null; for (const [d, v] of hist) { if (v !== last) pts.push([d, v]); last = v; } s = { a: pts, d: hist.slice(-5) }; }
    else { const me = new Map(); for (const [d, v] of hist) me.set(d.slice(0, 7), v); s = { a: [...me.entries()], d: hist.slice(-(opt.keepDays || 400)) }; }
    s.last = (s.d?.at(-1) || s.a.at(-1))[0]; return s;
  }
  function apply(ser, today) {
    if (!MB.D.sgs?.series) MB.D.sgs = { updated: new Date().toISOString(), today, series: {}, fromBrowser: true };
    Object.assign(MB.D.sgs.series, ser);
    MB.D.manifest = MB.D.manifest || {}; MB.D.manifest.series = MB.D.manifest.series || {};
    for (const k of Object.keys(ser)) MB.D.manifest.series[k] ||= { code: CAT[k][0], name: { pt: CAT[k][1], en: CAT[k][2] }, unit: CAT[k][3], freq: CAT[k][4] };
  }

  /** busca no Banco Central as séries que faltam no snapshot.
   *  Fase 1 (bloqueia a primeira tela, ~10–25 s): todas as séries mensais + PTAX provisório.
   *  Fase 2 (em segundo plano): séries diárias exatas (Selic meta, reservas, PTAX fim de mês) — a API do BC é lenta nelas. */
  MB.bootstrapIfNeeded = async () => {
    const have = (k) => { const s = MB.D.sgs?.series?.[k]; return (s?.a?.length || 0) >= 6 && !s.partial && !s.approx; };
    let need = Object.keys(CAT).filter((k) => !have(k));
    if (!need.length) return false;
    const today = MB.todayIso(); MB.boot = { state: "running", n: 0, total: need.length, at: null, err: null, fails: 0 };
    let cached = {}; try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c && c.today === today && Date.now() - c.t < 6 * 3600e3) cached = c.series || {}; } catch {}
    const store = (extra) => { try { cached = { ...cached, ...extra }; localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), today, series: cached })); } catch {} };
    const fromCache = Object.fromEntries(need.filter((k) => cached[k] && !cached[k].approx).map((k) => [k, cached[k]]));
    if (Object.keys(fromCache).length) { apply(fromCache, today); need = need.filter((k) => !fromCache[k]); MB.boot.n = MB.boot.total - need.length; }
    const slow = need.filter((k) => CAT[k][4] === "d"), fast = need.filter((k) => CAT[k][4] !== "d");
    const jobs = fast.map((k) => [k, () => loadOne(k, today)]);
    if (slow.includes("ptax")) jobs.push(["ptax", () => loadPtaxApprox(today)]);
    const got = {}; let idx = 0;
    const worker = async () => { while (idx < jobs.length) { const [k, fn] = jobs[idx++]; try { got[k] = await fn(); } catch (e) { MB.boot.fails++; console.warn("[boot] falhou", k, e.message); } MB.boot.n++; MB.emit("boot"); } };
    await Promise.all(Array.from({ length: 6 }, worker));
    apply(got, today); store(got);
    const okN = Object.keys(got).length + Object.keys(fromCache).length;
    MB.boot = { ...MB.boot, state: slow.length && okN ? "slow" : okN ? "done" : "error", at: Date.now(), err: okN ? null : "sem resposta do Banco Central" };
    MB.booted = okN > 0; MB.bump(); MB.emit("boot");
    if (slow.length && okN) {
      MB.bootSlow = (async () => {
        for (const k of ["selicMeta", "reservas", "ptax"]) {
          if (!slow.includes(k)) continue;
          try { const s = await loadOne(k, today); apply({ [k]: s }, today); store({ [k]: s }); MB.bump(); } catch (e) { MB.boot.fails++; console.warn("[boot] falhou (diária)", k, e.message); }
        }
        MB.boot = { ...MB.boot, state: "done", at: Date.now() }; MB.emit("boot");
      })();
    }
    return okN > 0;
  };
})();
