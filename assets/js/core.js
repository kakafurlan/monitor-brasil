/* Monitor Brasil — núcleo: idioma, formatação, cards de gráfico, componentes de UI.
 * Todos os módulos se penduram em window.MB. Sem dependências além do ECharts. */
(() => {
  "use strict";
  const MB = (window.MB = { version: "3.0", tabs: {} });

  /* ------------------------- eventos ------------------------- */
  const ev = {};
  MB.on = (e, f) => ((ev[e] ||= []).push(f), f);
  MB.emit = (e, ...a) => (ev[e] || []).forEach((f) => { try { f(...a); } catch (err) { console.error("[evento " + e + "]", err); } });

  /* ------------------------- idioma ------------------------- */
  const qLang = new URLSearchParams(location.search).get("lang");
  MB.lang = qLang === "en" || qLang === "pt" ? qLang : (() => {
    try { const s = localStorage.getItem("mb-lang"); if (s === "pt" || s === "en") return s; } catch {}
    return /^pt/i.test(navigator.language || "pt") ? "pt" : "en";
  })();
  MB.t = (pt, en) => (MB.lang === "pt" ? pt : en ?? pt);
  MB.L = (o) => (o == null ? "" : typeof o === "string" ? o : o[MB.lang] ?? o.pt ?? "");
  MB.loc = () => (MB.lang === "pt" ? "pt-BR" : "en-US");
  MB.setLang = (l) => {
    MB.lang = l; nfCache = {};
    try { localStorage.setItem("mb-lang", l); } catch {}
    document.documentElement.lang = l === "pt" ? "pt-BR" : "en";
    MB.emit("lang");
  };
  const MES = { pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"], en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] };
  MB.MES = MES;

  /* ------------------------- formatação ------------------------- */
  let nfCache = {};
  const nf = (d = 0) => (nfCache[MB.lang + d] ||= new Intl.NumberFormat(MB.loc(), { minimumFractionDigits: d, maximumFractionDigits: d }));
  const ok = (v) => v != null && isFinite(v);
  MB.nf = nf;
  MB.fmt = (v, d = 0) => (ok(v) ? nf(d).format(v) : "—");
  MB.brl = (v, d = 2) => (ok(v) ? "R$ " + nf(d).format(v) : "—");
  MB.usd = (v, d = 2) => (ok(v) ? "US$ " + nf(d).format(v) : "—");
  MB.pct = (v, d = 1, sign = false) => (ok(v) ? (sign && v > 0 ? "+" : "") + nf(d).format(v) + "%" : "—");
  MB.pp = (v, d = 1) => (ok(v) ? (v > 0 ? "+" : "") + nf(d).format(v) + " p.p." : "—");
  MB.compact = (v, prefix = "R$ ", d) => {
    if (!ok(v)) return "—";
    if (v === 0) return prefix + "0";
    const a = Math.abs(v), pt = MB.lang === "pt";
    const U = pt ? [" quatri", " tri", " bi", " mi", " mil"] : ["Q", "T", "B", "M", "K"];
    const sc = a >= 1e15 ? [1e15, U[0]] : a >= 1e12 ? [1e12, U[1]] : a >= 1e9 ? [1e9, U[2]] : a >= 1e6 ? [1e6, U[3]] : a >= 1e4 ? [1e3, U[4]] : null;
    if (sc) { const x = v / sc[0]; return prefix + nf(d ?? (Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2)).format(x) + sc[1]; }
    return prefix + nf(d != null ? Math.max(d, a < 1 ? 2 : 0) : (a < 10 ? 2 : a < 1000 ? 1 : 0)).format(v);
  };
  MB.mini = (html) => `<span class="c-mini">${html}</span>`;
  /** número muito pequeno/grande em notação legível (museu). */
  MB.sci = (v) => {
    if (!ok(v) || v === 0) return "0";
    const a = Math.abs(v);
    if (a >= 1e-3 && a < 1e15) return nf(a < 1 ? 6 : a < 100 ? 2 : 0).format(v);
    const e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e);
    return nf(2).format(m) + " × 10" + String(e).replace(/-/g, "⁻").replace(/\d/g, (c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]);
  };
  MB.ymLabel = (ym) => (ym ? `${MES[MB.lang][+ym.slice(5, 7) - 1]}/${ym.slice(0, 4)}` : "—");
  MB.isoLabel = (iso) => (iso ? new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString(MB.loc(), { day: "2-digit", month: "short", year: "numeric" }) : "—");
  MB.perLabel = (p) => (!p ? "—" : p.length > 7 ? MB.isoLabel(p) : MB.ymLabel(p));
  MB.ymMs = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 15).getTime();
  MB.isoMs = (iso) => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), 12).getTime();
  MB.perMs = (p) => (p.length > 7 ? MB.isoMs(p) : MB.ymMs(p));
  MB.ymAdd = (ym, n) => { let y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return `${y}-${String(m + 1).padStart(2, "0")}`; };
  MB.nowYm = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
  MB.todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  MB.monthsBetween = (a, b) => (+b.slice(0, 4) - +a.slice(0, 4)) * 12 + (+b.slice(5, 7) - +a.slice(5, 7));
  MB.msLabel = (ms, daily) => { const d = new Date(ms); return (daily ? d.getDate() + " " : "") + MES[MB.lang][d.getMonth()] + "/" + d.getFullYear(); };
  MB.age = (ms) => { const s = Math.max(0, Math.round((Date.now() - ms) / 1000)); return s < 90 ? `${s}s` : s < 5400 ? `${Math.round(s / 60)} min` : s < 129600 ? `${Math.round(s / 3600)} h` : `${Math.round(s / 86400)} ${MB.t("dias", "days")}`; };

  /* ------------------------- DOM ------------------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  MB.$ = $; MB.$$ = $$; MB.esc = esc;
  MB.toast = (msg) => { const el = $("#toast"); if (!el) return; el.textContent = msg; el.classList.add("on"); clearTimeout(MB._toast); MB._toast = setTimeout(() => el.classList.remove("on"), 2600); };
  MB.sig = (v, good = "down") => (!ok(v) || v === 0 ? "flat" : (v > 0) === (good === "up") ? "up" : "down"); // cor semântica

  /* ------------------------- cores ------------------------- */
  MB.C = {
    btc: "#ff8a00", real: "#3987e5", usd: "#1fb5a8", cdi: "#9085e9", pink: "#e0529c", amber: "#f5a524", ref: "#9a93a8", red: "#cc080c", white: "#ffffff",
    up: "#2fd27a", down: "#ff5c63",
    grid: "#1c1826", axis: "#8a839a", text: "#c6c0d2", tipBg: "#15121c", tipBorder: "#2c2540", pointer: "#4a3e6b",
    ramp: ["#1d1838", "#2a2350", "#3d3378", "#5446a3", "#6f5fd0", "#9085e9", "#c4bdff"],
    heat: ["#15121c", "#3b1d0a", "#7a3b05", "#c25f00", "#ff8a00", "#ffc266"],
  };
  const C = MB.C;
  const MONO = "'IBM Plex Mono', ui-monospace, monospace";

  /* ------------------------- ECharts: base ------------------------- */
  MB.tooltip = (valFmt, daily) => ({
    trigger: "axis", confine: true, axisPointer: { type: "line", lineStyle: { color: C.pointer, width: 1 } },
    backgroundColor: C.tipBg, borderColor: C.tipBorder, padding: [8, 12], textStyle: { color: C.white, fontFamily: "Inter", fontSize: 13 },
    formatter: (ps) => {
      if (!ps.length) return "";
      const head = `<div style="color:${C.text};margin-bottom:4px;font-family:${MONO};font-size:11.5px">${MB.msLabel(ps[0].value[0], daily)}</div>`;
      return head + ps.filter((p) => p.value?.[1] != null).map((p) =>
        `<div style="display:flex;gap:10px;align-items:center;justify-content:space-between;min-width:180px"><span style="display:flex;gap:6px;align-items:center;color:${C.text}"><span style="width:9px;height:9px;border-radius:2px;background:${p.color}"></span>${esc(p.seriesName)}</span><strong style="font-weight:600">${valFmt(p.value[1], p)}</strong></div>`).join("");
    },
  });
  MB.baseOption = ({ yFmt = (v) => MB.fmt(v), log = false, legend = false, daily = false, tipFmt, yMin, yMax, y2 } = {}) => {
    const o = {
      backgroundColor: "transparent", animationDuration: 900, animationEasing: "cubicOut", textStyle: { fontFamily: "Inter, system-ui, sans-serif" },
      grid: { left: 8, right: y2 ? 8 : 18, top: legend ? 38 : 14, bottom: 8, containLabel: true },
      legend: legend ? { show: true, top: 0, left: 0, icon: "roundRect", itemWidth: 12, itemHeight: 4, itemGap: 14, textStyle: { color: C.text, fontSize: 12 } } : { show: false },
      tooltip: MB.tooltip(tipFmt || yFmt, daily),
      xAxis: {
        type: "time", axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, splitLine: { show: false },
        axisLabel: { color: C.axis, fontSize: 11, hideOverlap: true, fontFamily: MONO, formatter: (v) => { const d = new Date(v); return d.getMonth() === 0 && d.getDate() <= 15 ? String(d.getFullYear()) : `${MES[MB.lang][d.getMonth()]}/${String(d.getFullYear()).slice(2)}`; } },
      },
      yAxis: {
        type: log ? "log" : "value", min: yMin, max: yMax, scale: !log && yMin === undefined, axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: C.grid, width: 1 } }, axisLabel: { color: C.axis, fontSize: 11, formatter: yFmt, fontFamily: MONO },
      },
      series: [],
    };
    if (y2) o.yAxis = [o.yAxis, { type: "value", scale: true, position: "right", axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { color: C.axis, fontSize: 11, formatter: y2, fontFamily: MONO } }];
    return o;
  };
  MB.sLine = (name, color, data, { endLabel = false, dashed = false, area = false, step = false, width = 2, yAxisIndex = 0, z, markLine, markArea } = {}) => ({
    type: "line", name, data, showSymbol: false, symbolSize: 8, connectNulls: false, sampling: "lttb", step: step ? "end" : false, yAxisIndex, z,
    lineStyle: { width, color, type: dashed ? "dashed" : "solid" }, itemStyle: { color },
    areaStyle: area ? { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + "44" }, { offset: 1, color: color + "00" }] } } : undefined,
    emphasis: { focus: "series" }, markLine, markArea,
    endLabel: endLabel ? { show: true, color: C.text, fontSize: 12, formatter: (p) => p.seriesName } : undefined, labelLayout: endLabel ? { moveOverlap: "shiftY" } : undefined,
  });
  MB.sBar = (name, color, data, { negColor, stack, yAxisIndex = 0, maxW = 14 } = {}) => ({
    type: "bar", name, barMaxWidth: maxW, stack, yAxisIndex,
    data: data.map((p) => ({ value: p, itemStyle: { color: p[1] < 0 && negColor ? negColor : color, borderRadius: p[1] >= 0 ? [3, 3, 0, 0] : [0, 0, 3, 3] } })),
  });
  MB.refLine = (y, label, color = C.ref) => ({ silent: true, symbol: "none", lineStyle: { color, type: "dashed", width: 1 }, label: { color: C.text, fontSize: 11, formatter: label, position: "insideEndTop" }, data: [{ yAxis: y }] });
  MB.RANGE_YEARS = { "1a": 1, "2a": 2, "3a": 3, "5a": 5, "10a": 10, "15a": 15, "20a": 20, "30a": 30 };
  MB.cut = (arr, range) => {
    if (!range || range === "tudo" || !arr?.length) return arr || [];
    const yrs = MB.RANGE_YEARS[range]; if (!yrs) return arr;
    const lim = MB.ymAdd(MB.nowYm(), -12 * yrs);
    return arr.filter((p) => p[0] >= lim);
  };
  MB.toPts = (arr) => arr.map(([p, v]) => [MB.perMs(p), v]);
  const RLAB = { "1a": ["1A", "1Y"], "2a": ["2A", "2Y"], "3a": ["3A", "3Y"], "5a": ["5A", "5Y"], "10a": ["10A", "10Y"], "15a": ["15A", "15Y"], "20a": ["20A", "20Y"], "30a": ["30A", "30Y"], tudo: ["Tudo", "All"] };

  /* ------------------------- fontes (chips) ------------------------- */
  const PROV = {
    pix: ["BCB · Pix", "https://dadosabertos.bcb.gov.br/dataset/pix", ["pix:spi", "pix:mpv"]],
    pixuf: ["BCB · Pix por município", "https://dadosabertos.bcb.gov.br/dataset/pix", ["pix:uf"]],
    dict: ["BCB · Chaves Pix (DICT)", "https://dadosabertos.bcb.gov.br/dataset/pix", ["pix:dict", "pix:keys"]],
    fraud: ["BCB · Pix MED / fraudes", "https://dadosabertos.bcb.gov.br/dataset/pix", ["pix:fraud"]],
    cnae: ["BCB · Pix por setor (CNAE)", "https://dadosabertos.bcb.gov.br/dataset/pix", ["pix:cnae"]],
    mpv: ["BCB · Meios de pagamento", "https://dadosabertos.bcb.gov.br/dataset/estatisticas-de-meios-de-pagamentos-e-de-infraestrutura-do-mercado-financeiro", ["pix:mpv"]],
    juros: ["BCB · Taxas por instituição", "https://www.bcb.gov.br/estatisticas/reporttxjuros", ["rates"]],
    focus: ["BCB · Boletim Focus", "https://www.bcb.gov.br/publicacoes/focus", ["focus"]],
    ibge: ["IBGE · SIDRA", "https://sidra.ibge.gov.br/tabela/7060", ["ibge"]],
    ipea: ["Ipeadata", "http://www.ipeadata.gov.br/ExibeSerie.aspx?serid=1739471028", ["history"]],
    wb: ["Banco Mundial", "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG", ["world:wb"]],
    imf: ["FMI · DataMapper", "https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO", ["world:imf"]],
    bis: ["BIS · CPMI", "https://data.bis.org/topics/CPMI", ["world:bis"]],
    btc: ["blockchain.com × PTAX", "https://www.blockchain.com/explorer/charts/market-price", ["btc"]],
    live: ["Binance · ao vivo", "https://www.binance.com/en/trade/BTC_BRL", []],
    mempool: ["mempool.space", "https://mempool.space/", []],
    fx: ["AwesomeAPI · dólar", "https://docs.awesomeapi.com.br/api-de-moedas", []],
  };
  MB.srcInfo = (k) => {
    if (k.startsWith("sgs:")) {
      const key = k.slice(4), m = MB.D?.manifest?.series?.[key], s = MB.D?.sgs?.series?.[key];
      const code = m?.code ?? MB.SGS_CODES?.[key];
      if (!code) return null;
      return { label: `BCB · SGS ${code}`, href: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/12?formato=json`, last: s?.last, task: "sgs" };
    }
    const p = PROV[k]; if (!p) return null;
    return { label: k === "live" ? MB.t("Binance · ao vivo", "Binance · live") : p[0], href: p[1], tasks: p[2] };
  };
  MB.chipState = (info) => {
    const st = MB.D?.manifest?.status || {};
    const ts = info.task ? [info.task] : info.tasks || [];
    if (!ts.length) return MB.live?.src?.[info.key] ? "" : "idle";
    const arr = ts.map((t) => st[t]).filter(Boolean);
    if (!arr.length) return "idle";
    return arr.every((s) => s.ok) ? "" : arr.some((s) => s.ok) ? "warn" : "err";
  };
  MB.chips = (keys) => `<div class="chips">${(keys || []).map((k) => {
    const s = MB.srcInfo(k); if (!s) return ""; s.key = k;
    const cls = MB.chipState(s);
    const tip = (s.last ? `${MB.t("último dado", "latest")}: ${MB.perLabel(s.last)} · ` : "") + MB.t("abrir fonte", "open source");
    return `<a class="chip ${cls}" href="${s.href}" target="_blank" rel="noopener" title="${esc(tip)}">${esc(s.label)} ↗</a>`;
  }).join("")}</div>`;

  /* ------------------------- cards de gráfico ------------------------- */
  MB.defs = {}; MB.charts = {};
  MB.card = (id, def, cls = "") => { MB.defs[id] = def; if (def.ranges && !def.range) def.range = def.defRange || def.ranges.at(-1); return `<article class="card ${cls}" data-chart="${id}"></article>`; };
  const tableHTML = (tb) => (tb ? `<table><thead><tr>${tb.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${tb.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "");
  MB.monthTable = (cols, arrs, fmts, n = 48) => {
    const maps = arrs.map((a) => new Map(a)), keys = [...new Set(arrs.flatMap((a) => a.map((p) => p[0])))].sort().reverse().slice(0, n);
    return { cols: [MB.t("Período", "Period"), ...cols], rows: keys.map((k) => [MB.perLabel(k), ...maps.map((m, i) => (m.has(k) ? fmts[i](m.get(k)) : "—"))]) };
  };
  MB.downloadCSV = (name, tb) => {
    if (!tb) return;
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = "﻿" + [tb.cols, ...tb.rows].map((r) => r.map(q).join(";")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = name + ".csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  function mountCard(el) {
    const id = el.dataset.chart, def = MB.defs[id]; if (!def) return;
    MB.charts[id]?.dispose(); delete MB.charts[id];
    const ranges = def.ranges?.length ? def.ranges : null;
    el.innerHTML = `
      <div class="c-head">
        <div><h3 class="c-title">${MB.L(def.title)}</h3>${def.sub ? `<p class="c-sub">${MB.L(def.sub)}</p>` : ""}<div class="c-big" data-big hidden></div></div>
        ${ranges ? `<div class="c-ctrl" role="group">${ranges.map((r) => `<button type="button" data-r="${r}" aria-pressed="${r === def.range}">${MB.t(...RLAB[r])}</button>`).join("")}</div>` : ""}
        ${def.ctrl ? `<div data-ctrl>${typeof def.ctrl === "function" ? def.ctrl() : def.ctrl}</div>` : ""}
      </div>
      <div class="c-body" role="img" aria-label="${esc(MB.L(def.title))}"${def.height ? ` style="height:${def.height}px"` : ""}></div>
      ${def.below ? `<div data-below>${typeof def.below === "function" ? def.below() : def.below}</div>` : ""}
      <div class="c-table" hidden></div>
      <div class="c-foot">${MB.chips(def.src || [])}<div class="c-tools">${def.noTable ? "" : `<button type="button" data-tbl>${MB.t("Ver tabela", "Show table")}</button><button type="button" data-csv>CSV</button>`}</div></div>`;
    const body = $(".c-body", el);
    el._render = () => {
      let out; try { out = def.build(def.range, el); } catch (e) { console.error("[gráfico " + id + "]", e); out = null; }
      if (out && out.loading) { MB.charts[id]?.dispose(); delete MB.charts[id]; body.textContent = ""; body.classList.remove("c-empty"); body.classList.add("skeleton"); return; }
      body.classList.remove("skeleton");
      if (!out || !out.option || !out.option.series?.some((s) => (s.data || []).length || s.type === "map" || s.type === "graph" || s.type === "pie")) {
        MB.charts[id]?.dispose(); delete MB.charts[id];
        body.classList.add("c-empty"); body.textContent = def.empty ? MB.L(def.empty) : MB.t("Sem dados disponíveis ainda — aguardando a próxima coleta.", "No data yet — waiting for the next collection."); return;
      }
      if (body.classList.contains("c-empty")) { body.classList.remove("c-empty"); body.textContent = ""; }
      if (!MB.charts[id]) { MB.charts[id] = echarts.init(body, null, { renderer: "canvas" }); MB.charts[id].__card = el; }
      MB.charts[id].setOption(out.option, true);
      const big = $("[data-big]", el); big.innerHTML = out.big || ""; big.hidden = !out.big;
      el._table = out.table;
      const tbl = $(".c-table", el); if (!tbl.hidden) tbl.innerHTML = tableHTML(out.table);
      def.after?.(MB.charts[id], el, out);
    };
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-r]");
      if (b) { def.range = b.dataset.r; $$("[data-r]", el).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); el._render(); return; }
      if (e.target.closest("[data-tbl]")) { const tbl = $(".c-table", el), btn = e.target.closest("[data-tbl]"); tbl.hidden = !tbl.hidden; btn.textContent = tbl.hidden ? MB.t("Ver tabela", "Show table") : MB.t("Ocultar tabela", "Hide table"); if (!tbl.hidden) tbl.innerHTML = tableHTML(el._table); return; }
      if (e.target.closest("[data-csv]")) { MB.downloadCSV(id, el._table); return; }
      def.onClick?.(e, el);
    });
    el.addEventListener("input", (e) => def.onInput?.(e, el));
    el.addEventListener("change", (e) => def.onChange?.(e, el));
    el._render();
  }
  MB.mount = (root) => $$("[data-chart]", root).forEach(mountCard);
  MB.rerender = (...ids) => ids.forEach((id) => $(`[data-chart="${id}"]`)?._render?.());
  MB.disposeIn = (root) => $$("[data-chart]", root).forEach((el) => { const id = el.dataset.chart; MB.charts[id]?.dispose(); delete MB.charts[id]; });
  MB.resizeIn = (root) => $$("[data-chart]", root).forEach((el) => MB.charts[el.dataset.chart]?.resize());
  window.addEventListener("resize", () => { clearTimeout(MB._rz); MB._rz = setTimeout(() => Object.values(MB.charts).forEach((c) => c.resize()), 120); });

  /**
   * Card de séries temporais.
   * o.series(range) -> [{name,color,data:[[periodo,valor]],type?,dashed?,area?,step?,yAxisIndex?,endLabel?,stack?}]
   * o.rebase  -> reindexa todas as séries para 100 no primeiro ponto comum do recorte
   */
  MB.tsCard = (id, o, cls = "") => MB.card(id, {
    title: o.title, sub: o.sub, src: o.src, ranges: o.ranges === undefined ? ["5a", "10a", "20a", "tudo"] : o.ranges, range: o.range, height: o.height, noTable: o.noTable, ctrl: o.ctrl, below: o.below, onClick: o.onClick, onChange: o.onChange, onInput: o.onInput,
    build(range) {
      let S = (o.series(range) || []).filter((s) => s.data?.length);
      if (!S.length) return null;
      S = S.map((s) => ({ ...s, data: s.noCut ? s.data : MB.cut(s.data, range) })).filter((s) => s.data.length);
      if (!S.length) return null;
      const daily = S.some((s) => s.data[0][0].length > 7);
      if (o.rebase) {
        const start = S.map((s) => s.data[0][0]).reduce((a, b) => (a > b ? a : b));
        S = S.map((s) => { const d = s.data.filter((p) => p[0] >= start); const b = d[0]?.[1]; return { ...s, data: b ? d.map(([p, v]) => [p, (v / b) * 100]) : [] }; }).filter((s) => s.data.length);
      }
      const opt = MB.baseOption({ yFmt: o.yFmt, tipFmt: o.tipFmt, log: o.log, legend: S.length > 1 || o.legend, daily, yMin: o.yMin, yMax: o.yMax, y2: o.y2 });
      opt.series = S.map((s) => {
        const pts = MB.toPts(s.data);
        const x = s.type === "bar" ? MB.sBar(s.name, s.color, pts, { negColor: s.negColor, stack: s.stack, yAxisIndex: s.yAxisIndex || 0 }) : MB.sLine(s.name, s.color, pts, { endLabel: s.endLabel, dashed: s.dashed, area: s.area, step: s.step, yAxisIndex: s.yAxisIndex || 0, width: s.width || 2 });
        if (s.markLine) x.markLine = s.markLine; if (s.markArea) x.markArea = s.markArea;
        return x;
      });
      if (S.length > 4 && opt.legend.show) opt.legend.type = "scroll";
      if (o.extra) o.extra(opt, S, range);
      const table = daily ? { cols: [MB.t("Data", "Date"), ...S.map((s) => s.name)], rows: [...new Set(S.flatMap((s) => s.data.map((p) => p[0])))].sort().reverse().slice(0, 120).map((k) => [MB.perLabel(k), ...S.map((s) => { const f = s.data.find((p) => p[0] === k); return f ? (o.tipFmt || o.yFmt || MB.fmt)(f[1]) : "—"; })]) }
        : MB.monthTable(S.map((s) => s.name), S.map((s) => s.data), S.map(() => o.tipFmt || o.yFmt || ((v) => MB.fmt(v, 2))), 72);
      return { option: opt, big: o.big?.(S, range), table };
    },
  }, cls);

  /* ------------------------- componentes de UI ------------------------- */
  MB.sec = (num, title, intro, extra = "") => `<div class="sec reveal"><div class="sec-head"><p class="sec-num">${num}</p><h2>${title}</h2>${intro ? `<p class="intro">${intro}</p>` : ""}</div>${extra}</div>`;
  MB.spark = (arr, color = C.btc, w = 120, h = 32) => {
    const v = (arr || []).map((p) => (Array.isArray(p) ? p[1] : p)).filter(ok); if (v.length < 2) return "";
    const mn = Math.min(...v), mx = Math.max(...v), r = mx - mn || 1;
    const pts = v.map((y, i) => `${((i / (v.length - 1)) * w).toFixed(1)},${(h - 3 - ((y - mn) / r) * (h - 6)).toFixed(1)}`);
    const id = "sg" + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><polygon points="0,${h} ${pts.join(" ")} ${w},${h}" fill="url(#${id})"/><polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts.at(-1).split(",")[0]}" cy="${pts.at(-1).split(",")[1]}" r="2.4" fill="${color}"/></svg>`;
  };
  /** animação de contagem. `f` formata o número. */
  MB.countUp = (el, to, f, ms = 1300) => {
    if (!el || !ok(to)) { if (el) el.textContent = f ? f(to) : "—"; return; }
    if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = f(to); el._v = to; return; }   // aba em segundo plano: o navegador pausa a animação
    const t0 = performance.now(), from = el._v ?? 0;
    const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el._v = from + (to - from) * e; el.textContent = f(el._v); if (k < 1) requestAnimationFrame(step); else { el._v = to; el.textContent = f(to); } };
    requestAnimationFrame(step);
  };
  MB.flash = (el, up) => { if (!el) return; el.classList.remove("flash-up", "flash-down"); void el.offsetWidth; el.classList.add(up ? "flash-up" : "flash-down"); setTimeout(() => el.classList.remove("flash-up", "flash-down"), 600); };
  MB.reveal = (root = document) => {
    const els = $$(".reveal:not(.in)", root);
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));
    setTimeout(() => els.forEach((e) => e.classList.add("in")), 2500); // rede de segurança
  };
  /** tabela genérica pequena */
  MB.table = (cols, rows, cls = "src-table") => `<table class="${cls}"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  MB.tile = (label, value, sub = "", opts = {}) => `<div class="tile${opts.best ? " best" : ""}"><div class="t-l">${opts.sw ? `<span class="sw${opts.dash ? " dash" : ""}" style="background:${opts.sw}"></span>` : ""}${label}</div><div class="t-v"${opts.id ? ` data-live="${opts.id}"` : ""}>${value}</div>${sub ? `<div class="t-s">${sub}</div>` : ""}</div>`;
  MB.parseNum = (s) => {
    if (typeof s === "number") return s;
    const x = String(s || "").replace(/[^\d,.\-]/g, ""); if (!x) return NaN;
    const lastC = x.lastIndexOf(","), lastD = x.lastIndexOf("."); let n = x;
    if (lastC >= 0 && lastD >= 0) n = lastC > lastD ? x.replace(/\./g, "").replace(",", ".") : x.replace(/,/g, "");
    else if (lastC >= 0 || lastD >= 0) {
      const sep = lastC >= 0 ? "," : ".", cnt = x.split(sep).length - 1, tail = x.length - 1 - x.lastIndexOf(sep), milhar = MB.lang === "pt" ? "." : ",";
      /* vários separadores iguais, ou um só seguido de exatamente 3 dígitos na grafia de milhar da língua (120.000) → milhar */
      if (cnt > 1 || (sep === milhar && tail === 3 && !/^-?0[.,]/.test(x))) n = x.split(sep).join(""); else n = sep === "," ? x.replace(",", ".") : x;
    }
    return parseFloat(n);
  };

  /** barras horizontais ordenadas (maior em cima) */
  MB.hbar = (items, { fmt = (v) => MB.fmt(v, 1), color = C.btc, neg = C.down, sorted = true, labelW = 0 } = {}) => {
    const d = sorted ? items.slice().sort((a, b) => a.value - b.value) : items.slice().reverse();
    const o = MB.baseOption({}); o.legend = { show: false };
    o.grid = { left: 14, right: 64, top: 6, bottom: 6, containLabel: true };
    o.xAxis = { type: "value", axisLabel: { show: false }, splitLine: { show: false }, axisLine: { show: false } };
    o.yAxis = { type: "category", data: d.map((x) => x.name), axisTick: { show: false }, axisLine: { lineStyle: { color: C.grid } }, axisLabel: { color: C.text, fontSize: 12, width: labelW || undefined, overflow: labelW ? "truncate" : undefined } };
    o.tooltip = { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, valueFormatter: fmt };
    o.series = [{ type: "bar", barMaxWidth: 18, data: d.map((x) => ({ value: x.value, name: x.name, itemStyle: { color: x.color || (x.value < 0 ? neg : color), borderRadius: x.value < 0 ? [3, 0, 0, 3] : [0, 3, 3, 0] } })), label: { show: true, position: "right", color: C.text, fontSize: 11.5, fontFamily: MONO, formatter: (p) => fmt(p.value) } }];
    return o;
  };
  /** grupo de botões segmentados: opts = [[valor, rótulo]] */
  MB.segHTML = (attr, opts, active, extra = "") => `<div class="c-ctrl" role="group" ${extra}>${opts.map(([v, l]) => `<button type="button" data-${attr}="${v}" aria-pressed="${String(v) === String(active)}">${l}</button>`).join("")}</div>`;
  /** cor interpolada em uma rampa (0..1) */
  MB.ramp = (x, stops = C.heat) => { const n = stops.length - 1, i = Math.max(0, Math.min(n - 1, Math.floor(x * n))); return x <= 0 ? stops[0] : x >= 1 ? stops[n] : stops[i + 1] && MB.mix(stops[i], stops[i + 1], x * n - i); };
  MB.mix = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
  /**
   * Bloco recolhível “Ver mais dados”. O conteúdo só é desenhado na primeira abertura:
   * gráficos precisam de largura real para nascer certos, e assim a página inicial fica leve.
   * bodyFn() devolve o HTML; o.after(corpo) liga eventos depois de montado.
   */
  MB.moreFns = {};
  MB.more = (id, label, bodyFn, o = {}) => {
    MB.moreFns[id] = { bodyFn, after: o.after };
    return `<details class="more reveal" data-more="${id}"><summary><span class="more-ic" aria-hidden="true"></span><span class="more-t">${label}</span>${o.hint ? `<span class="more-s">${o.hint}</span>` : ""}</summary><div class="more-body" data-more-body></div></details>`;
  };
  document.addEventListener("toggle", (e) => {
    const d = e.target; if (!d?.matches?.("details.more[data-more]") || !d.open) return;
    const body = d.querySelector("[data-more-body]"), f = MB.moreFns[d.dataset.more]; if (!body) return;
    if (!body.dataset.ready && f) {
      body.dataset.ready = "1";
      try { body.innerHTML = f.bodyFn(); } catch (err) { console.error("[mais " + d.dataset.more + "]", err); body.innerHTML = ""; }
      MB.mount(body); MB.reveal(body);
      try { f.after?.(body); } catch (err) { console.error("[mais " + d.dataset.more + " after]", err); }
    }
    requestAnimationFrame(() => MB.resizeIn(body));
  }, true);
  /** abre um bloco “mais dados” por id (usado por links internos) */
  MB.openMore = (id) => { const d = document.querySelector(`details.more[data-more="${id}"]`); if (d && !d.open) d.open = true; return d; };

  MB.go = (tab) => { location.hash = "#/" + tab; };
})();
