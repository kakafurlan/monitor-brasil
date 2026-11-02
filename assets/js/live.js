/* Monitor Brasil — camada ao vivo (roda no navegador, sem servidor):
 *  · Bitcoin/R$ em tempo real (Binance WebSocket; reservas: Coinbase, CoinGecko)
 *  · Dólar (AwesomeAPI), bloco/taxas (mempool.space)
 *  · Últimos pontos das séries do Banco Central, direto da API SGS (CORS liberado)
 * O estado de cada fonte vai em MB.live.src[nome] = {ok, at, err} e aparece na aba Dados. */
(() => {
  "use strict";
  const MB = window.MB;
  const live = (MB.live = { btcBrl: null, btcUsd: null, usdBrl: null, chg24: null, height: null, fees: null, src: {} });
  const mark = (name, ok, err) => { live.src[name] = { ok, at: ok ? Date.now() : live.src[name]?.at, err: ok ? null : String(err || "erro") }; };
  const getJ = async (url, ms = 12000) => {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); } finally { clearTimeout(to); }
  };
  let lastEmit = 0;
  const emitLive = (force) => { const n = Date.now(); if (force || n - lastEmit > 800) { lastEmit = n; MB.emit("live"); } };
  const setBtc = (brl, chg, srcName) => {
    if (!(brl > 0)) return;
    const prev = live.btcBrl; live.btcBrl = brl; live.btcDir = prev ? Math.sign(brl - prev) : 0;
    if (chg != null && isFinite(chg)) live.chg24 = chg;
    if (live.usdBrl) live.btcUsd = brl / live.usdBrl;
    live.priceSrc = srcName; live.priceAt = Date.now(); mark(srcName, true);
    emitLive();
  };

  /* ---------- Bitcoin: Binance WebSocket ---------- */
  let ws, wsTry = 0, wsOk = false;
  function connectBinance() {
    try { ws = new WebSocket("wss://stream.binance.com:9443/ws/btcbrl@miniTicker"); } catch (e) { mark("binance", false, e.message); return; }
    ws.onopen = () => { wsTry = 0; };
    ws.onmessage = (m) => { try { const d = JSON.parse(m.data); const c = +d.c, o = +d.o; wsOk = true; setBtc(c, o > 0 ? ((c - o) / o) * 100 : null, "binance"); } catch {} };
    ws.onerror = () => { mark("binance", false, "WebSocket"); };
    ws.onclose = () => { wsOk = false; setTimeout(connectBinance, Math.min(60000, 2000 * 2 ** Math.min(wsTry++, 5))); };
  }
  /* reservas: só consulta se o WebSocket não estiver entregando */
  const pickPrice = (o, d = 0) => {
    if (o == null || d > 5 || typeof o !== "object") return null;
    for (const k of ["last", "last_price", "lastPrice", "price", "close"]) { const v = parseFloat(o[k]); if (v > 20000 && v < 1e7) return v; }
    for (const v of Object.values(o)) { const r = pickPrice(v, d + 1); if (r) return r; }
    return null;
  };
  async function pollBtcFallback() {
    if (wsOk && Date.now() - (live.priceAt || 0) < 20000) return;
    try { const j = await getJ("https://api.foxbit.com.br/rest/v3/markets/btcbrl/ticker/24hr"), p = pickPrice(j); if (p) { setBtc(p, null, "foxbit"); return; } throw new Error("formato inesperado"); } catch (e) { mark("foxbit", false, e.message); }
    try { const j = await getJ("https://api.coinbase.com/v2/prices/BTC-BRL/spot"); setBtc(+j.data.amount, null, "coinbase"); return; } catch (e) { mark("coinbase", false, e.message); }
    try { const j = await getJ("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl,usd&include_24hr_change=true"); setBtc(j.bitcoin.brl, j.bitcoin.brl_24h_change, "coingecko"); if (j.bitcoin.usd) live.btcUsd = j.bitcoin.usd; } catch (e) { mark("coingecko", false, e.message); }
  }

  /* ---------- dólar ---------- */
  async function pollFx() {
    try {
      const j = await getJ("https://economia.awesomeapi.com.br/json/last/USD-BRL"), b = +j.USDBRL.bid;
      if (b > 0) { live.usdBrl = b; live.usdChg = +j.USDBRL.pctChange; live.usdAt = Date.now(); if (live.btcBrl) live.btcUsd = live.btcBrl / b; mark("awesomeapi", true); emitLive(true); }
    } catch (e) { mark("awesomeapi", false, e.message); }
  }

  /* ---------- rede Bitcoin ---------- */
  async function pollMempool() {
    try {
      const [h, f, p, d] = await Promise.all([getJ("https://mempool.space/api/blocks/tip/height"), getJ("https://mempool.space/api/v1/fees/recommended"), getJ("https://mempool.space/api/v1/prices"), getJ("https://mempool.space/api/v1/difficulty-adjustment")]);
      live.height = +h; live.fees = f; live.diff = d; if (p?.USD) live.mempoolUsd = p.USD; mark("mempool", true); emitLive(true);
    } catch (e) { mark("mempool", false, e.message); }
  }

  /* ---------- Banco Central: últimos pontos ---------- */
  const SGS_LIVE = { ipca: 4, ipca15: 3, inpc: 3, igpm: 3, igpdi: 3, selicMeta: 8, selicMes: 3, cdiMes: 3, ptax: 6, dbggPct: 3, dlspPct: 3, reservas: 4, desemprego: 3, ibcbr: 3, salMin: 3 };
  const DAILY = new Set(["ptax", "selicMeta", "reservas"]);
  async function refreshSgs() {
    if (!MB.D.sgs) return;
    MB.D.sgs.series ||= {};
    const today = MB.todayIso(); let changed = false, okN = 0;
    await Promise.all(Object.entries(SGS_LIVE).map(async ([k, n]) => {
      const code = MB.D.manifest?.series?.[k]?.code ?? MB.SGS_CODES[k]; if (!code) return;
      let rows; try { rows = await getJ(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${n}?formato=json`, 15000); } catch (e) { mark("bcb-sgs", false, e.message); return; }
      if (!Array.isArray(rows)) return; okN++;
      const s = (MB.D.sgs.series[k] ||= { a: [], last: null, partial: true }); s.a ||= [];
      for (const r of rows) {
        const [dd, mm, yy] = String(r.data).split("/"), iso = `${yy}-${mm}-${dd}`, v = parseFloat(r.valor), ym = `${yy}-${mm}`;
        if (!isFinite(v) || iso > today) continue;
        if (DAILY.has(k)) {
          s.d ||= []; const li = s.d.length ? s.d[s.d.length - 1][0] : "";
          if (iso > li) { s.d.push([iso, v]); changed = true; } else if (iso === li && s.d[s.d.length - 1][1] !== v) { s.d[s.d.length - 1][1] = v; changed = true; }
          if (k === "selicMeta") { const la = s.a[s.a.length - 1]; if (!la || (iso > la[0] && la[1] !== v)) { s.a.push([iso, v]); changed = true; } }
          else { const la = s.a[s.a.length - 1]; if (la && la[0] === ym) { if (la[1] !== v) { la[1] = v; changed = true; } } else if (!la || ym > la[0]) { s.a.push([ym, v]); changed = true; } }
          if (!s.last || iso > s.last) s.last = iso;
        } else {
          const la = s.a[s.a.length - 1];
          if (la && la[0] === ym) { if (la[1] !== v) { la[1] = v; changed = true; } } else if (!la || ym > la[0]) { s.a.push([ym, v]); changed = true; }
          if (!s.last || ym > s.last) s.last = ym;
        }
      }
    }));
    if (okN) mark("bcb-sgs", true);
    if (changed) MB.bump();
    live.sgsAt = Date.now();
    MB.emit("live", true);
  }

  MB.live.start = () => {
    connectBinance(); pollFx(); pollMempool(); pollBtcFallback();
    setInterval(pollBtcFallback, 20000);
    setInterval(pollFx, 60000);
    setInterval(pollMempool, 60000);
    setTimeout(refreshSgs, 1500);
    setInterval(refreshSgs, 20 * 60000);
    setInterval(async () => { try { await MB.reloadIfNew(); } catch {} }, 10 * 60000);
  };
  MB.live.refreshSgs = refreshSgs;
})();
