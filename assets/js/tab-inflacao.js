/* Aba INFLAÇÃO — IPCA e demais índices, metas, grupos/itens/regiões (IBGE), expectativas (Focus) e o mundo (Banco Mundial). */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.inflState = { area: null, countries: ["BRA", "ARG", "CHL", "MEX", "USA"], cIdx: "ipca", calc: { idx: "ipca", from: null, to: null } });
  /* metas de inflação (CMN): centro e tolerância (± p.p.) */
  const META = { 2006: [4.5, 2], 2007: [4.5, 2], 2008: [4.5, 2], 2009: [4.5, 2], 2010: [4.5, 2], 2011: [4.5, 2], 2012: [4.5, 2], 2013: [4.5, 2], 2014: [4.5, 2], 2015: [4.5, 2], 2016: [4.5, 2], 2017: [4.5, 1.5], 2018: [4.5, 1.5], 2019: [4.25, 1.5], 2020: [4, 1.5], 2021: [3.75, 1.5], 2022: [3.5, 1.5], 2023: [3.25, 1.5] };
  const meta = (y) => META[y] || (y >= 2024 ? [3, 1.5] : null);
  const AREA_XY = { PA: [-48.49, -1.46], CE: [-38.52, -3.73], PE: [-34.88, -8.05], BA: [-38.51, -12.97], MG: [-43.94, -19.92], ES: [-40.34, -20.32], RJ: [-43.17, -22.91], SP: [-46.63, -23.55], PR: [-49.27, -25.43], RS: [-51.23, -30.03], AC: [-67.81, -9.97], MA: [-44.3, -2.53], SE: [-37.07, -10.91], MS: [-54.62, -20.47], GO: [-49.25, -16.68], DF: [-47.88, -15.79] };
  const CTRY_PT = { BRA: "Brasil", ARG: "Argentina", CHL: "Chile", COL: "Colômbia", MEX: "México", URY: "Uruguai", PER: "Peru", USA: "Estados Unidos", DEU: "Alemanha", GBR: "Reino Unido", JPN: "Japão", CHN: "China", IND: "Índia", TUR: "Turquia", ZAF: "África do Sul" };
  const ctryName = (iso) => (MB.lang === "pt" ? CTRY_PT[iso] : null) || MB.D.world?.names?.[iso] || iso;
  const CCOL = [C.btc, C.real, C.usd, C.cdi, C.pink, C.amber, "#c4bdff", "#7bd88f"];
  const IDX = { ipca: "IPCA", inpc: "INPC", igpm: "IGP-M", igpdi: "IGP-DI", ipca15: "IPCA-15" };

  /* ------------------------- 01 · IPCA hoje ------------------------- */
  function tiles() {
    const a = MB.ser("ipca"), l = MB.lastOf(a), y = MB.ytd(a).at(-1), a12 = MB.lastOf(MB.ipca12());
    if (!l[0]) return "";
    return `<div class="tiles4 tiles3 reveal">
      ${MB.tile(t("Inflação no mês", "Inflation in the month"), F(l[1], 2) + "%", MB.ymLabel(l[0]))}
      ${MB.tile(t("Inflação em 12 meses", "Inflation, 12 months"), F(a12[1], 2) + "%", t("meta oficial: 3%, com tolerância de 1,5 ponto", "official target: 3%, with 1.5 points of tolerance"), { best: true })}
      ${MB.tile(t("Acumulada no ano", "Year to date"), F(y?.[1], 2) + "%", String(l[0]).slice(0, 4))}</div>`;
  }
  const monthlyCard = () => MB.tsCard("inf_mm", {
    title: t("IPCA — variação mensal", "IPCA — monthly change"), sub: t("Cada barra é um mês; barras para baixo são deflação", "Each bar is a month; downward bars are deflation"), src: ["sgs:ipca"], ranges: ["2a", "5a", "10a"], defRange: "5a", range: "5a", yFmt: (v) => F(v, 1) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => [{ name: "IPCA", color: C.real, negColor: C.usd, type: "bar", data: MB.ser("ipca") }],
    big: (S0) => `${F(S0[0].data.at(-1)[1], 2)}% <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });
  const ipca12Card = () => MB.tsCard("inf_12", {
    title: t("IPCA acumulado em 12 meses", "IPCA, 12-month change"), sub: t("Faixa cinza: intervalo da meta (centro ± tolerância, conforme o ano)", "Grey band: target range (center ± tolerance for each year)"), src: ["sgs:ipca"], ranges: ["5a", "10a", "20a", "tudo"], defRange: "10a", range: "10a", yMin: 0, yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => [{ name: "IPCA 12m", color: C.real, area: true, data: MB.ipca12() }],
    extra: (o, S0) => {
      const d = S0[0].data, yrs = [...new Set(d.map((p) => +p[0].slice(0, 4)))].filter((y) => meta(y)); if (!yrs.length) return;
      o.series[0].markArea = { silent: true, itemStyle: { color: "rgba(154,147,168,.12)" }, data: yrs.map((y) => { const [c, tol] = meta(y); return [{ xAxis: Date.UTC(y, 0, 1), yAxis: c - tol }, { xAxis: Date.UTC(y, 11, 31), yAxis: c + tol }]; }) };
    },
    big: (S0) => `${F(S0[0].data.at(-1)[1], 2)}% <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });
  const yearlyCard = () => MB.card("inf_year", {
    title: t("Inflação ano a ano e a meta", "Inflation year by year vs target"), sub: t("IPCA de cada ano-calendário; linhas = limites da meta (desde 2006)", "IPCA for each calendar year; lines = target limits (since 2006)"), src: ["sgs:ipca"], ranges: ["10a", "20a", "tudo"], defRange: "20a", range: "20a", height: 340,
    build(range) {
      const by = MB.byYear(MB.ser("ipca")).filter((x) => +x[0] >= 1995); if (!by.length) return null;
      const yrs = MB.RANGE_YEARS[range], from = yrs ? new Date().getFullYear() - yrs : 1995, d = by.filter((x) => +x[0] > from - 1);
      const o = MB.baseOption({ yFmt: (v) => F(v, 0) + "%" }); o.legend.show = false;
      o.xAxis = { type: "category", data: d.map((x) => x[0]), axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, axisLabel: { color: C.axis, fontSize: 11, interval: d.length > 20 ? 1 : 0, fontFamily: "'IBM Plex Mono', monospace" } };
      o.tooltip = { trigger: "axis", confine: true, backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, valueFormatter: (v) => (v == null ? "—" : F(v, 2) + "%") };
      const col = (x) => { const m = meta(+x[0]); if (!m) return C.real; return x[1] > m[0] + m[1] ? C.btc : x[1] < m[0] - m[1] ? C.usd : C.real; };
      o.series = [
        { type: "bar", name: "IPCA", barMaxWidth: 22, data: d.map((x) => ({ value: x[1], itemStyle: { color: col(x), borderRadius: [3, 3, 0, 0] } })), label: { show: d.length <= 16, position: "top", color: C.text, fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", formatter: (p) => F(p.value, 1) } },
        { type: "line", name: t("Teto da meta", "Target ceiling"), data: d.map((x) => (meta(+x[0]) ? meta(+x[0])[0] + meta(+x[0])[1] : null)), step: "middle", showSymbol: false, lineStyle: { color: C.ref, type: "dashed", width: 1.4 } },
        { type: "line", name: t("Piso da meta", "Target floor"), data: d.map((x) => (meta(+x[0]) ? meta(+x[0])[0] - meta(+x[0])[1] : null)), step: "middle", showSymbol: false, lineStyle: { color: C.ref, type: "dashed", width: 1.4 } },
      ];
      const ly = d.at(-1), partial = MB.last("ipca")[0].slice(5, 7) !== "12";
      return { option: o, big: MB.mini(`${t("Barras laranja: acima do teto · verdes: abaixo do piso", "Orange bars: above ceiling · teal: below floor")}${partial ? ` <small class="muted">· ${ly[0]} ${t("parcial até", "partial through")} ${MB.ymLabel(MB.last("ipca")[0])}</small>` : ""}`), table: { cols: [t("Ano", "Year"), "IPCA", t("Meta", "Target")], rows: d.slice().reverse().map((x) => [x[0], F(x[1], 2) + "%", meta(+x[0]) ? `${F(meta(+x[0])[0], 2)}% ±${F(meta(+x[0])[1], 1)}` : "—"]) } };
    },
  });

  /* ------------------------- 02 · índices e núcleos ------------------------- */
  const idxCompareCard = () => MB.tsCard("inf_idx", {
    title: t("Cinco réguas de inflação (12 meses)", "Five inflation yardsticks (12-month)"), sub: t("IPCA e INPC (consumidor), IGP-M e IGP-DI (atacado/aluguéis/contratos), IPCA-15 (prévia)", "IPCA and INPC (consumer), IGP-M and IGP-DI (wholesale/rents/contracts), IPCA-15 (preview)"), src: ["sgs:ipca", "sgs:inpc", "sgs:igpm", "sgs:igpdi", "sgs:ipca15"], ranges: ["5a", "10a", "20a"], defRange: "10a", range: "10a", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => [["ipca", "IPCA", C.real], ["inpc", "INPC", C.usd], ["igpm", "IGP-M", C.btc], ["igpdi", "IGP-DI", C.pink], ["ipca15", "IPCA-15", C.cdi]].map(([k, n, col]) => ({ name: n, color: col, data: MB.ser(k).length > 12 ? MB.acc12(MB.ser(k)) : [], dashed: k === "ipca15", width: k === "ipca" ? 2.6 : 1.8 })),
  });
  const coreCard = () => MB.tsCard("inf_core", {
    title: t("Núcleos e componentes do IPCA (12 meses)", "IPCA core and components (12-month)"), sub: t("Livres × monitorados (administrados) e dois núcleos que filtram preços voláteis", "Market-set vs administered prices, and two cores filtering out volatile prices"), src: ["sgs:ipcaLivres", "sgs:ipcaAdm", "sgs:coreMA", "sgs:coreDP", "sgs:ipca"], ranges: ["5a", "10a", "20a"], defRange: "10a", range: "10a", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => [["ipca", "IPCA", C.real], ["ipcaLivres", t("Livres", "Market-set"), C.usd], ["ipcaAdm", t("Monitorados", "Administered"), C.btc], ["coreMA", t("Núcleo: médias aparadas", "Core: trimmed mean"), C.cdi], ["coreDP", t("Núcleo: dupla ponderação", "Core: double weight"), C.pink]].map(([k, n, col]) => ({ name: n, color: col, data: MB.ser(k).length > 12 ? MB.acc12(MB.ser(k)) : [], width: k === "ipca" ? 2.6 : 1.8 })),
  });

  /* ------------------------- 03 · calculadora de inflação acumulada ------------------------- */
  const calcHTML = () => {
    const c = st.calc, last = MB.idx().last || MB.nowYm(), from = c.from || MB.ymAdd(last, -59), to = c.to || last;
    return `<div class="card"><h3 class="c-title">${t("Inflação acumulada entre duas datas", "Cumulative inflation between two dates")}</h3><p class="c-sub">${t("Inclui os dois meses escolhidos. Escolha o índice: consumidor (IPCA/INPC) ou contratos e aluguéis (IGP).", "Both chosen months are included. Pick the index: consumer (IPCA/INPC) or contracts and rents (IGP).")}</p>
      <div class="calc" id="icalc" style="margin-top:14px"><div class="calc-in">
        <label>${t("Índice", "Index")}<select id="icIdx">${Object.entries(IDX).filter(([k]) => k !== "ipca15").map(([k, n]) => `<option value="${k}"${c.idx === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>
        <label>${t("De (mês)", "From (month)")}<input id="icFrom" type="month" value="${from}" min="1980-01" max="${last}"></label>
        <label>${t("Até (mês)", "To (month)")}<input id="icTo" type="month" value="${to}" min="1980-01" max="${last}"></label>
        <label>${t("Valor (R$)", "Amount (R$)")}<div class="in-prefix"><span>R$</span><input id="icAmt" inputmode="decimal" value="1.000,00"></div></label></div>
        <div class="calc-out" id="icOut"></div></div></div>`;
  };
  function calcUpdate(root) {
    const idx = root.querySelector("#icIdx").value, from = root.querySelector("#icFrom").value, to = root.querySelector("#icTo").value, amt = MB.parseNum(root.querySelector("#icAmt").value) || 0;
    st.calc = { idx, from, to }; const out = root.querySelector("#icOut"), arr = MB.ser(idx).filter((p) => p[0] >= from && p[0] <= to);
    if (!from || !to || from > to || !arr.length) { out.innerHTML = `<div class="out-big"><div class="l">${t("Escolha um intervalo válido.", "Choose a valid range.")}</div></div>`; return; }
    const f = arr.reduce((p, [, v]) => p * (1 + v / 100), 1), n = arr.length;
    out.innerHTML = `<div class="out-big"><div class="l">${IDX[idx]} ${MB.ymLabel(from)} → ${MB.ymLabel(to)}</div><div class="v">${F((f - 1) * 100, 2)}%</div><div class="s">${t(`${MB.brl(amt, 2)} passam a ${MB.brl(amt * f, 2)} só para manter o poder de compra`, `${MB.brl(amt, 2)} becomes ${MB.brl(amt * f, 2)} just to keep purchasing power`)}</div></div>
      <div class="out-row"><div><div class="l">${t("Meses", "Months")}</div><div class="v">${n}</div></div><div><div class="l">${t("Média ao ano", "Average per year")}</div><div class="v">${F(MB.cagr(f, n), 2)}%</div></div><div><div class="l">${t("Média ao mês", "Average per month")}</div><div class="v">${F((Math.pow(f, 1 / n) - 1) * 100, 2)}%</div></div></div>`;
  }

  /* ------------------------- 04 · IBGE: grupos, itens, regiões ------------------------- */
  function weightsOf(ib) { const w = ib.weights || {}, ids = Object.keys(ib.groups || {}).filter((id) => id !== "7169"); const tot = ids.reduce((s, id) => s + (w[id] || 0), 0) || 1; return { w, ids, tot }; }
  const treemapCard = () => MB.card("inf_tree", {
    title: t("Onde o IPCA pesa: grupos da cesta", "Where the IPCA weighs: basket groups"), sub: t("Área = peso na cesta; cor = variação em 12 meses (mais quente = mais cara)", "Area = basket weight; colour = 12-month change (warmer = pricier)"), src: ["ibge"], height: 380,
    build() {
      const ib = MB.D.ibge; if (!ib?.groups) return null; const { w, ids } = weightsOf(ib);
      const vals = ids.map((id) => MB.lastOf(ib.groups[id].a12)[1]).filter((v) => v != null); if (!vals.length) return null;
      const mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn || 1;
      const data = ids.map((id) => { const g = ib.groups[id], a = MB.lastOf(g.a12)[1], m = MB.lastOf(g.mm)[1]; return { name: g.name, value: Math.max(0.3, w[id] || 1), a12: a, mm: m, w: w[id], itemStyle: { color: MB.ramp((a - mn) / span, ["#2a2350", "#5446a3", "#9085e9", "#c25f00", "#ff8a00"]), borderColor: "#07060a", borderWidth: 2, gapWidth: 2 } }; });
      const o = { backgroundColor: "transparent", tooltip: { backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, formatter: (p) => `<b>${MB.esc(p.name)}</b><br>${t("Peso", "Weight")}: ${F(p.data.w, 2)}%<br>12m: <b>${F(p.data.a12, 2)}%</b><br>${t("No mês", "In the month")}: ${F(p.data.mm, 2)}%` },
        series: [{ type: "treemap", roam: false, nodeClick: false, breadcrumb: { show: false }, left: 0, right: 0, top: 0, bottom: 0, data, label: { show: true, color: "#fff", fontSize: 13, fontFamily: "Lexend, Inter", fontWeight: 600, formatter: (p) => `${p.name}\n{b|${F(p.data.a12, 1)}%}`, rich: { b: { fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 26 } } }, itemStyle: { borderRadius: 6 } }] };
      return { option: o, big: `${t("Índice geral em 12m", "Overall index, 12m")}: <span class="mono">${F(MB.lastOf(ib.groups["7169"]?.a12)[1], 2)}%</span>`, table: { cols: [t("Grupo", "Group"), t("Peso %", "Weight %"), "12m %", t("Mês %", "Month %")], rows: data.map((d) => [d.name, F(d.w, 2), F(d.a12, 2), F(d.mm, 2)]) } };
    },
  });
  const groupsLineCard = () => MB.tsCard("inf_groups", {
    title: t("Grupos do IPCA: acumulado em 12 meses", "IPCA groups: 12-month change"), sub: t("Últimos 5 anos, por grupo de despesa", "Last 5 years, by spending group"), src: ["ibge"], ranges: [], height: 340, yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%", legend: true,
    series: () => { const ib = MB.D.ibge; if (!ib?.groups) return []; return Object.entries(ib.groups).filter(([id]) => id !== "7169").map(([id, g], i) => ({ name: g.name, color: CCOL[i % CCOL.length], data: g.a12 || [], dashed: i >= CCOL.length })); },
  });
  function risers() {
    const ib = MB.D.ibge; if (!ib?.subitems?.length) return "";
    const hasLvl = ib.subitems.some((x) => x.lvl), L = ib.subitems.filter((x) => x.a12 != null && (x.w || 0) >= 0.1 && (!hasLvl || x.lvl === 4)), top = L.slice().sort((a, b) => b.a12 - a.a12).slice(0, 12), bot = L.slice().sort((a, b) => a.a12 - b.a12).slice(0, 12);
    const list = (arr, cls) => { const mx = Math.max(...arr.map((x) => Math.abs(x.a12))) || 1; return `<ul class="rank">${arr.map((x) => `<li><span>${MB.esc(x.name)}<div class="bar" style="width:${(Math.abs(x.a12) / mx) * 100}%;background:${cls === "up" ? C.btc : C.usd}"></div></span><span class="val">${F(x.a12, 1)}%</span></li>`).join("")}</ul>`; };
    return `<div class="grid2"><article class="card"><h3 class="c-title">${t("Itens que mais subiram em 12 meses", "Items that rose most in 12 months")}</h3><p class="c-sub">${t("Itens do IPCA com peso relevante na cesta (≥ 0,1%)", "IPCA items with a meaningful basket weight (≥ 0.1%)")}</p>${list(top, "up")}<div class="c-foot">${MB.chips(["ibge"])}</div></article>
      <article class="card"><h3 class="c-title">${t("Itens que mais caíram em 12 meses", "Items that fell most in 12 months")}</h3><p class="c-sub">${t("Mesma base de itens", "Same item base")}</p>${list(bot, "down")}<div class="c-foot">${MB.chips(["ibge"])}</div></article></div>`;
  }
  const areaOf = (a) => (a.name.match(/-\s*([A-Z]{2})\s*$/) || [])[1];
  const areaMap = () => MB.card("inf_map", {
    title: t("Inflação por região metropolitana", "Inflation by metropolitan area"), sub: t("IPCA em 12 meses nas 16 áreas pesquisadas pelo IBGE — clique em uma bolha", "12-month IPCA in the 16 areas surveyed by IBGE — click a bubble"), src: ["ibge"], height: 520, noTable: false,
    build() {
      const ib = MB.D.ibge; if (!ib?.areas?.length) return null; if (!MB.geo?.br) return { loading: true };
      const A = ib.areas.map((a) => ({ ...a, uf: areaOf(a) })).filter((a) => AREA_XY[a.uf] && a.a12 != null); if (!A.length) return null;
      const mn = Math.min(...A.map((a) => a.a12)), mx = Math.max(...A.map((a) => a.a12)), span = mx - mn || 1;
      const o = { backgroundColor: "transparent", tooltip: { backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, formatter: (p) => (p.data?.area ? `<b>${MB.esc(p.data.area.name)}</b><br>IPCA 12m: <b>${F(p.data.area.a12, 2)}%</b><br>${t("No mês", "Month")}: ${F(p.data.area.mm, 2)}%` : "") },
        geo: { map: "br", roam: false, aspectScale: 1, itemStyle: { areaColor: "#15121c", borderColor: "#2c2540", borderWidth: 0.8 }, emphasis: { disabled: true }, select: { disabled: true }, silent: true, layoutCenter: ["50%", "52%"], layoutSize: "108%" },
        series: [{ type: "scatter", coordinateSystem: "geo", symbolSize: (v) => 16 + ((v[2] - mn) / span) * 30, data: A.map((a) => ({ name: a.name, value: [...AREA_XY[a.uf], a.a12], area: a, itemStyle: { color: MB.ramp((a.a12 - mn) / span, ["#5446a3", "#9085e9", "#c25f00", "#ff8a00", "#ffc266"]), opacity: st.area && st.area !== a.id ? 0.45 : 0.92, borderColor: st.area === a.id ? "#fff" : "#07060a", borderWidth: st.area === a.id ? 2 : 1 } })), label: { show: true, formatter: (p) => F(p.data.area.a12, 1), color: "#07060a", fontWeight: 700, fontSize: 11 }, emphasis: { scale: 1.15 } }] };
      return { option: o, big: MB.mini(`${t("Maior", "Highest")}: ${MB.esc(A.slice().sort((a, b) => b.a12 - a.a12)[0].name)} ${F(mx, 2)}% · ${t("menor", "lowest")}: ${MB.esc(A.slice().sort((a, b) => a.a12 - b.a12)[0].name)} ${F(mn, 2)}%`), table: { cols: [t("Área", "Area"), "12m %", t("Mês %", "Month %")], rows: A.slice().sort((a, b) => b.a12 - a.a12).map((a) => [a.name, F(a.a12, 2), F(a.mm, 2)]) } };
    },
    after(chart, el) { chart.off("click"); chart.on("click", (p) => { if (p.data?.area) { st.area = p.data.area.id; MB.rerender("inf_map"); const side = document.getElementById("infAreaSide"); if (side) side.innerHTML = areaSide(); } }); },
  });
  function areaSide() {
    const ib = MB.D.ibge; if (!ib?.areas?.length) return "";
    const A = ib.areas.slice().sort((a, b) => b.a12 - a.a12), sel = A.find((a) => a.id === st.area) || A[0], mx = Math.max(...A.map((a) => a.a12)) || 1;
    return `<div class="state-card"><span class="uf">${areaOf(sel) || ""}</span><h3>${MB.esc(sel.name)}</h3><div class="st-grid"><div><div class="l">IPCA 12m</div><div class="v">${F(sel.a12, 2)}%</div></div><div><div class="l">${t("No mês", "Month")}</div><div class="v">${F(sel.mm, 2)}%</div></div><div><div class="l">${t("12m um ano antes", "12m a year earlier")}</div><div class="v">${sel.a12ago != null ? F(sel.a12ago, 2) + "%" : "—"}</div></div><div><div class="l">${t("Referência", "Reference")}</div><div class="v">${MB.ymLabel(sel.ref)}</div></div></div></div>
      <p class="side-h">${t("Ranking das áreas · 12 meses", "Area ranking · 12 months")}</p><ul class="rank">${A.map((a) => `<li data-area="${a.id}" class="${a.id === sel.id ? "on" : ""}"><span>${MB.esc(a.name)}<div class="bar" style="width:${(a.a12 / mx) * 100}%"></div></span><span class="val">${F(a.a12, 2)}%</span></li>`).join("")}</ul>`;
  }

  /* ------------------------- 05 · expectativas ------------------------- */
  const focusCard = () => MB.card("inf_focus", { empty: t("Estes dados só chegam pela coleta automática (GitHub Actions) — ela roda sozinha depois de publicado.", "This data only arrives through the automatic collection (GitHub Actions) — it runs by itself once published."),
    title: t("Expectativa de IPCA para os próximos anos (Focus)", "Expected IPCA for the coming years (Focus)"), sub: t("Mediana das projeções hoje × 4 semanas atrás; linha = centro da meta", "Median forecasts today vs 4 weeks ago; line = target centre"), src: ["focus"], height: 320,
    build() {
      const f = MB.D.focus?.inds?.IPCA; if (!f?.length) return null;
      const o = MB.baseOption({ yFmt: (v) => F(v, 1) + "%" }); o.legend = { show: true, top: 0, left: 0, icon: "roundRect", itemWidth: 12, itemHeight: 8, textStyle: { color: C.text, fontSize: 12 } };
      o.xAxis = { type: "category", data: f.map((x) => x.y), axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 12 } };
      o.tooltip = { trigger: "axis", backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, valueFormatter: (v) => (v == null ? "—" : F(v, 2) + "%") };
      o.yAxis.scale = false; o.yAxis.min = 0;
      o.series = [{ type: "bar", name: t("4 semanas atrás", "4 weeks ago"), data: f.map((x) => x.old), itemStyle: { color: "#3d3378", borderRadius: [3, 3, 0, 0] }, barMaxWidth: 28 }, { type: "bar", name: t("Hoje", "Today"), data: f.map((x) => x.med), itemStyle: { color: C.btc, borderRadius: [3, 3, 0, 0] }, barMaxWidth: 28, label: { show: true, position: "top", color: "#fff", fontSize: 12, formatter: (p) => F(p.value, 2) + "%" }, markLine: MB.refLine(3, t("meta 3%", "target 3%")) }];
      return { option: o, table: { cols: [t("Ano", "Year"), t("Hoje", "Today"), t("4 sem. atrás", "4 wks ago"), t("Nº de respondentes", "Respondents")], rows: f.map((x) => [x.y, F(x.med, 2) + "%", x.old != null ? F(x.old, 2) + "%" : "—", x.n ?? "—"]) } };
    },
  });

  /* ------------------------- 06 · o mundo ------------------------- */
  const worldCtrl = () => `<div class="chips" style="margin-top:8px">${Object.keys(CTRY_PT).filter((iso) => MB.D.world?.inflation?.[iso]).map((iso) => `<button type="button" class="chip${st.countries.includes(iso) ? "" : " idle"}" data-c="${iso}" style="cursor:pointer;background:${st.countries.includes(iso) ? "var(--surface-3)" : "transparent"}">${ctryName(iso)}</button>`).join("")}</div>`;
  const worldCard = () => MB.card("inf_world", {
    title: t("Brasil × outros países: inflação anual", "Brazil vs other countries: annual inflation"), sub: t("Variação anual dos preços ao consumidor (Banco Mundial). Escolha os países.", "Annual consumer-price change (World Bank). Choose countries."), src: ["wb"], ranges: ["20a", "30a", "tudo"], defRange: "30a", range: "30a", height: 360, ctrl: "", below: worldCtrl,
    onClick(e, el) { const b = e.target.closest("[data-c]"); if (!b) return; const iso = b.dataset.c, i = st.countries.indexOf(iso); if (i >= 0) { if (st.countries.length > 1) st.countries.splice(i, 1); } else if (st.countries.length < 7) st.countries.push(iso); else MB.toast(t("Máximo de 7 países.", "Up to 7 countries.")); el.querySelector("[data-below]").innerHTML = worldCtrl(); el._render(); },
    build(range) {
      const inf = MB.D.world?.inflation; if (!inf) return null; const yrs = MB.RANGE_YEARS[range], from = yrs ? new Date().getFullYear() - yrs : 1960;
      const o = MB.baseOption({ legend: true, yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 1) + "%" });
      o.xAxis = { type: "category", data: [], axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, axisLabel: { color: C.axis, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" } };
      const years = []; for (let y = Math.max(1960, from); y <= new Date().getFullYear(); y++) years.push(y);
      const ser = st.countries.map((iso, i) => ({ iso, name: ctryName(iso), col: iso === "BRA" ? C.btc : CCOL[(i + 1) % CCOL.length], data: years.map((y) => inf[iso]?.[y] ?? null) })).filter((s) => s.data.some((v) => v != null));
      const lastY = years.filter((y) => ser.some((s) => s.data[years.indexOf(y)] != null)).at(-1);
      o.xAxis.data = years.filter((y) => y <= lastY);
      o.tooltip = { trigger: "axis", confine: true, backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, valueFormatter: (v) => (v == null ? "—" : F(v, 1) + "%") };
      o.series = ser.map((s) => ({ type: "line", name: s.name, data: s.data.slice(0, o.xAxis.data.length), showSymbol: false, connectNulls: false, lineStyle: { width: s.iso === "BRA" ? 3 : 1.8, color: s.col }, itemStyle: { color: s.col }, emphasis: { focus: "series" } }));
      return { option: o, table: { cols: [t("Ano", "Year"), ...ser.map((s) => s.name)], rows: o.xAxis.data.slice().reverse().map((y) => [y, ...ser.map((s) => (s.data[years.indexOf(y)] != null ? F(s.data[years.indexOf(y)], 1) + "%" : "—"))]) } };
    },
  });

  MB.tabs.inflacao = {
    render(panel) {
      panel.innerHTML = `${tiles()}
        ${MB.sec("01", t("A inflação hoje", "Inflation today"), t("O IPCA, calculado pelo IBGE, é o índice oficial de inflação: mede quanto os preços subiram.", "The IPCA, calculated by IBGE, is the official inflation index: it measures how much prices rose."), `<div class="grid2">${ipca12Card()}${yearlyCard()}</div>`)}
        ${MB.sec("02", t("Calculadora de inflação", "Inflation calculator"), t("Quanto os preços subiram entre dois meses quaisquer.", "How much prices rose between any two months."), calcHTML())}
        ${MB.sec("03", t("O que pesa no seu bolso", "What weighs on your pocket"), t("A cesta do IPCA por tipo de gasto e os itens que mais subiram — e mais caíram — em um ano.", "The IPCA basket by type of spending and the items that rose — and fell — most in a year."), `${treemapCard()}${risers()}`)}
        ${MB.more("inf_more_a", t("Ver mais dados: mês a mês, outros índices e grupos", "See more data: monthly, other indices and groups"), () => `<p class="more-h">${t("Mês a mês", "Month by month")}</p>${monthlyCard()}<p class="more-h">${t("Cinco réguas para o mesmo fenômeno", "Five yardsticks for the same phenomenon")}</p><div class="grid2">${idxCompareCard()}${coreCard()}</div><p class="more-h">${t("Grupos de despesa", "Spending groups")}</p>${groupsLineCard()}`, { hint: t("gráficos mensais e índices", "monthly charts and indices") })}
        ${MB.more("inf_more_b", t("Ver mais dados: regiões, expectativas e o mundo", "See more data: regions, expectations and the world"), () => `<p class="more-h">${t("Inflação por região metropolitana", "Inflation by metropolitan area")}</p><div class="map-wrap"><div>${areaMap()}</div><article class="card" id="infAreaSide">${areaSide()}</article></div><p class="more-h">${t("O que o mercado espera (Boletim Focus)", "What the market expects (Focus survey)")}</p>${focusCard()}<p class="more-h">${t("O Brasil no mundo", "Brazil in the world")}</p>${worldCard()}`, { hint: t("mapa, Focus e comparação internacional", "map, Focus and international comparison"), after: (body) => { body.querySelector("#infAreaSide")?.addEventListener("click", (e) => { const li = e.target.closest("[data-area]"); if (li) { st.area = li.dataset.area; body.querySelector("#infAreaSide").innerHTML = areaSide(); MB.rerender("inf_map"); } }); MB.ensureGeo("br").then(() => MB.rerender("inf_map")); } })}`;
    },
    after(panel) {
      const ic = panel.querySelector("#icalc"); if (ic) { ic.addEventListener("input", () => calcUpdate(ic)); calcUpdate(ic); }
    },
  };
})();
