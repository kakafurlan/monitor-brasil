/* Aba DÍVIDA PÚBLICA — dívida bruta e líquida, juros, resultado fiscal, reservas e o Brasil no mundo (FMI). */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.debtState = { year: new Date().getFullYear(), play: null, people: 1 });
  const TRI = () => (MB.lang === "pt" ? " tri" : " T");

  function tiles() {
    const L = (k) => MB.last(k), pop = MB.population(), bg = L("dbggBRL"), per = bg[0] && pop ? (bg[1] * 1e6) / pop.n : null;
    const row = (label, key, d, unit, sub, o) => MB.tile(label, L(key)[0] ? F(L(key)[1], d) + unit : "—", (sub ? sub + " · " : "") + (L(key)[0] ? MB.ymLabel(L(key)[0]) : ""), o);
    return `<div class="tiles4 reveal">
      ${row(t("Dívida do governo", "Government debt"), "dbggPct", 1, t("% do PIB", "% of GDP"), t("o PIB é tudo o que o país produz em um ano", "GDP is everything the country produces in a year"), { best: true })}
      ${MB.tile(t("…em reais", "…in reais"), bg[0] ? "R$ " + F(bg[1] / 1e6, 2) + TRI() : "—", bg[0] ? MB.ymLabel(bg[0]) : "")}
      ${MB.tile(t("Por habitante", "Per inhabitant"), per ? MB.brl(per, 0) : "—", pop ? t(`${F(pop.n / 1e6, 1)} mi de habitantes (IBGE ${pop.year})`, `${F(pop.n / 1e6, 1)} M inhabitants (IBGE ${pop.year})`) : "")}
      ${row(t("Juros pagos em 12 meses", "Interest paid in 12 months"), "juros12", 1, t("% do PIB", "% of GDP"), "")}</div>`;
  }
  const pctSeries = (arr) => arr.map(([k, n, col, o]) => ({ name: n, color: col, data: MB.ser(k), ...(o || {}) }));
  const debtCard = () => MB.tsCard("div_pct", {
    title: t("Dívida pública em % do PIB", "Public debt as % of GDP"), sub: t("Bruta (governo geral) e líquida (setor público consolidado)", "Gross (general government) and net (consolidated public sector)"), src: ["sgs:dbggPct", "sgs:dlspPct"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 1) + "%",
    series: () => pctSeries([["dbggPct", t("Dívida bruta", "Gross debt"), C.red, { area: true, width: 2.6 }], ["dlspPct", t("Dívida líquida", "Net debt"), C.cdi]]), big: (S0) => S0.map((s) => `<span style="color:${s.color}">${s.name}: ${F(s.data.at(-1)[1], 1)}%</span>`).join(" &nbsp; "),
  });
  const debtBrlCard = () => MB.tsCard("div_brl", {
    title: t("Dívida bruta em reais", "Gross debt in reais"), sub: t("Saldo em R$ trilhões, valores correntes", "Balance in R$ trillion, current values"), src: ["sgs:dbggBRL", "sgs:dlspBRL"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => "R$ " + F(v, 0) + TRI(), tipFmt: (v) => "R$ " + F(v, 2) + TRI(),
    series: () => [["dbggBRL", t("Dívida bruta", "Gross debt"), C.red], ["dlspBRL", t("Dívida líquida", "Net debt"), C.cdi]].map(([k, n, col]) => ({ name: n, color: col, data: MB.ser(k).map(([m, v]) => [m, v / 1e6]), area: k === "dbggBRL" })),
  });
  const flowCard = () => MB.tsCard("div_flow", {
    title: t("De onde vem a dívida: juros × resultado primário", "Where debt comes from: interest vs primary balance"), sub: t("Acumulado em 12 meses, % do PIB (positivo = necessidade de financiamento)", "12-month accumulation, % of GDP (positive = financing need)"), src: ["sgs:juros12", "sgs:primario12", "sgs:nominal12"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "% PIB",
    series: () => pctSeries([["juros12", t("Juros nominais", "Nominal interest"), C.btc, { width: 2.6 }], ["primario12", t("Resultado primário", "Primary balance"), C.real], ["nominal12", t("Resultado nominal", "Nominal balance"), C.pink, { dashed: true }]]), extra: (o) => { o.series[0].markLine = MB.refLine(0, "0"); },
  });
  const resCard = () => MB.tsCard("div_res", {
    title: t("Reservas internacionais", "International reserves"), sub: t("Conceito caixa, em US$ bilhões — o colchão do país em moeda forte", "Cash concept, in US$ billion — the country's hard-currency cushion"), src: ["sgs:reservas"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => "US$ " + F(v, 0) + (MB.lang === "pt" ? " bi" : " B"), tipFmt: (v) => "US$ " + F(v, 1) + (MB.lang === "pt" ? " bi" : " B"),
    series: () => [{ name: t("Reservas", "Reserves"), color: C.usd, area: true, data: MB.ser("reservas").map(([m, v]) => [m, v / 1000]) }], big: (S0) => `US$ ${F(S0[0].data.at(-1)[1], 0)}${MB.lang === "pt" ? " bi" : " B"}`,
  });

  /* ------------------------- escala por habitante ------------------------- */
  const scaleHTML = () => `<div class="card" id="scale"></div>`;
  function scaleUpdate(root) {
    const pop = MB.population(), bg = MB.last("dbggBRL"), pib = MB.last("pib12"), jur = MB.last("juros12"), btc = MB.btcNow(), ips = MB.govInterestPerSec();
    if (!pop || !bg[0]) { root.innerHTML = `<h3 class="c-title">${t("Dívida e juros na escala de uma família", "Debt and interest at household scale")}</h3><p class="c-sub">${t("Aguardando dados de população e dívida.", "Waiting for population and debt data.")}</p>`; return; }
    const n = st.people, debt = bg[1] * 1e6, perCap = (debt / pop.n) * n, intYr = pib[0] && jur[0] ? ((jur[1] / 100) * pib[1] * 1e6) / pop.n * n : null;
    const supply = MB.btcSupply(Date.now());
    root.innerHTML = `<h3 class="c-title">${t("Dívida e juros na escala de uma família", "Debt and interest at household scale")}</h3><p class="c-sub">${t("Divisão simples da dívida bruta do governo pela população — uma ilustração de escala, não uma cobrança individual.", "A simple split of gross government debt by population — an illustration of scale, not an individual bill.")}</p>
      <div class="calc" style="margin-top:14px"><div class="calc-in"><label>${t("Pessoas na família", "People in the family")}: <b style="color:#fff">${n}</b><input id="scPeople" type="range" min="1" max="8" value="${n}"></label>
      <p class="note">${t("População", "Population")}: ${F(pop.n)} (IBGE, ${pop.year})</p></div>
      <div class="calc-out"><div class="out-big"><div class="l">${t("Parte da sua família na dívida bruta do governo", "Your family's share of gross government debt")}</div><div class="v">${MB.brl(perCap, 0)}</div><div class="s">${btc ? t(`equivale a ${F((perCap / btc) * 1e8 / 1e6, 1)} milhões de sats (${F(perCap / btc, 3)} BTC)`, `equal to ${F((perCap / btc) * 1e8 / 1e6, 1)} million sats (${F(perCap / btc, 3)} BTC)`) : ""}</div></div>
      <div class="out-row"><div><div class="l">${t("Juros por ano (parte da família)", "Interest per year (family share)")}</div><div class="v">${intYr ? MB.brl(intYr, 0) : "—"}</div></div><div><div class="l">${t("Juros por segundo (país)", "Interest per second (country)")}</div><div class="v" data-tick="juros2">${ips ? MB.brl(ips, 0) : "—"}</div></div><div><div class="l">${t("Dívida bruta em bitcoins", "Gross debt in bitcoin")}</div><div class="v">${btc ? F(debt / btc / 1e6, 1) + (MB.lang === "pt" ? " mi BTC" : " M BTC") : "—"}</div></div></div>
      ${btc ? `<p class="note">${t(`Para comparar a escala: existem cerca de ${F(supply / 1e6, 1)} milhões de bitcoins em circulação (de um máximo de 21 milhões). A dívida bruta do governo, ao câmbio de hoje, equivaleria a ${F((debt / btc / supply) * 100, 0)}% de todos eles — uma ilustração de ordem de grandeza.`, `For scale: about ${F(supply / 1e6, 1)} million bitcoins exist (out of a 21 million maximum). At today's price, gross government debt would equal ${F((debt / btc / supply) * 100, 0)}% of all of them — an order-of-magnitude illustration.`)}</p>` : ""}</div></div>`;
    root.querySelector("#scPeople").oninput = (e) => { st.people = +e.target.value; scaleUpdate(root); };
  }

  /* ------------------------- mundo (FMI) ------------------------- */
  const imf = () => MB.D.world?.imf;
  function debtAt(year) { const I = imf(); if (!I?.debt || !I.years) return []; const i = I.years.indexOf(year); if (i < 0) return []; return Object.entries(I.debt).map(([iso, a]) => [iso, a[i]]).filter((x) => x[1] != null && isFinite(x[1])); }
  const worldCtrl = () => { const I = imf(); const y0 = I?.years?.[0] ?? 1990, y1 = I?.years?.at(-1) ?? 2031; return `<div class="seg" style="align-items:center"><button type="button" data-play aria-label="play">${st.play ? "❚❚" : "▶"}</button><span class="mono" style="padding:0 10px;min-width:92px;color:#fff" id="dwYear">${st.year}${st.year > new Date().getFullYear() ? " · " + t("proj.", "proj.") : ""}</span></div><input id="dwRange" type="range" min="${y0}" max="${y1}" value="${st.year}" style="width:min(220px,40vw)">`; };
  function dwData() {
    const rows = debtAt(st.year), nm = (iso) => (MB.lang === "pt" && MB.D.world?.ptNames?.[iso]) || MB.D.world?.names?.[iso] || iso;
    const sorted = rows.slice().sort((a, b) => b[1] - a[1]), bra = sorted.findIndex((x) => x[0] === "BRA");
    const top = sorted.slice(0, 10).map(([iso, v]) => ({ name: nm(iso), value: v, color: iso === "BRA" ? C.btc : C.cdi }));
    if (bra >= 10) top.push({ name: `#${bra + 1} ${nm("BRA")}`, value: sorted[bra][1], color: C.btc });
    return { rows, sorted, bra, top, nm };
  }
  const worldMap = () => MB.card("div_world", { empty: t("O mapa usa dados do FMI, que só chegam pela coleta automática (GitHub Actions) — ela roda sozinha depois de publicado.", "The map uses IMF data, which only arrives through the automatic collection (GitHub Actions) — it runs by itself once published."),
    title: t("Dívida pública no mundo (% do PIB)", "Public debt around the world (% of GDP)"), sub: t("Dívida bruta do governo geral — FMI (anos futuros são projeções do próprio FMI). Mova o ano ou toque em ▶.", "Gross general-government debt — IMF (future years are the IMF's own projections). Move the year or press ▶."), src: ["imf"], height: 460, ctrl: worldCtrl, noTable: false,
    onClick(e, el) { if (e.target.closest("[data-play]")) { if (st.play) { clearInterval(st.play); st.play = null; } else { const I = imf(); st.play = setInterval(() => { st.year = st.year >= I.years.at(-1) ? I.years[0] : st.year + 1; if (!el.isConnected) { clearInterval(st.play); st.play = null; return; } el.querySelector("[data-ctrl]").innerHTML = worldCtrl(); fast(el); }, 650); } el.querySelector("[data-ctrl]").innerHTML = worldCtrl(); } },
    onInput(e, el) { if (e.target.id === "dwRange") { st.year = +e.target.value; el.querySelector("#dwYear").textContent = st.year + (st.year > new Date().getFullYear() ? " · " + t("proj.", "proj.") : ""); fast(el); } },
    build() {
      if (!MB.geo?.world) return { loading: true }; const { rows, bra, sorted } = dwData(); if (!rows.length) return null;
      const o = { backgroundColor: "transparent", tooltip: { trigger: "item", backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, formatter: (p) => (p.value == null || isNaN(p.value) ? "" : `<b>${MB.esc(MB.D.world?.names?.[p.name] || p.name)}</b><br>${F(p.value, 1)}% ${t("do PIB", "of GDP")}`) },
        visualMap: { min: 0, max: 200, calculable: true, orient: "horizontal", left: 12, bottom: 4, itemWidth: 12, itemHeight: 110, text: ["200%+", "0%"], textStyle: { color: C.text }, inRange: { color: ["#1d1838", "#3d3378", "#6f5fd0", "#c25f00", "#ff8a00", "#ffd9a0"] }, outOfRange: { color: "#15121c" } },
        series: [{ type: "map", map: "world", nameProperty: "iso3", roam: true, scaleLimit: { min: 1, max: 6 }, zoom: 1.1, top: 8, bottom: 40, itemStyle: { areaColor: "#15121c", borderColor: "#2c2540", borderWidth: 0.5 }, emphasis: { label: { show: false }, itemStyle: { areaColor: "#ffb15c" } }, data: rows.map(([iso, v]) => ({ name: iso, value: v, ...(iso === "BRA" ? { itemStyle: { borderColor: "#fff", borderWidth: 1.6 } } : {}) })) }] };
      return { option: o, big: bra >= 0 ? t(`Brasil: <span class="mono">${F(sorted[bra][1], 1)}%</span> do PIB · ${bra + 1}º maior entre ${sorted.length} países em ${st.year}`, `Brazil: <span class="mono">${F(sorted[bra][1], 1)}%</span> of GDP · ${bra + 1}th highest of ${sorted.length} countries in ${st.year}`) : "", table: { cols: [t("País", "Country"), "ISO", "% PIB"], rows: sorted.map(([iso, v]) => [MB.D.world?.names?.[iso] || iso, iso, F(v, 1)]) } };
    },
  });
  function fast(el) {
    const ch = MB.charts["div_world"]; if (!ch) return; const { rows, bra, sorted } = dwData();
    ch.setOption({ series: [{ data: rows.map(([iso, v]) => ({ name: iso, value: v, ...(iso === "BRA" ? { itemStyle: { borderColor: "#fff", borderWidth: 1.6 } } : {}) })) }] });
    const big = el.querySelector("[data-big]"); if (big && bra >= 0) big.innerHTML = t(`Brasil: <span class="mono">${F(sorted[bra][1], 1)}%</span> do PIB · ${bra + 1}º maior entre ${sorted.length} países em ${st.year}`, `Brazil: <span class="mono">${F(sorted[bra][1], 1)}%</span> of GDP · ${bra + 1}th highest of ${sorted.length} countries in ${st.year}`);
    const r = document.getElementById("divRankHost"); if (r) r.innerHTML = rankInner();
    const yl = el.querySelector("#dwYear"); if (yl) yl.textContent = st.year + (st.year > new Date().getFullYear() ? " · " + t("proj.", "proj.") : "");
    const rg = el.querySelector("#dwRange"); if (rg && +rg.value !== st.year) rg.value = st.year;
  }
  function rankInner() {
    const { top } = dwData(); if (!top.length) return "";
    const mx = Math.max(...top.map((x) => x.value)) || 1;
    return `<ul class="rank">${top.map((x) => `<li${x.color === C.btc ? ' class="on"' : ""}><span>${MB.esc(x.name)}<div class="bar" style="width:${(x.value / mx) * 100}%;background:${x.color}"></div></span><span class="val">${F(x.value, 0)}%</span></li>`).join("")}</ul>`;
  }

  MB.tabs.divida = {
    render(panel) {
      panel.innerHTML = `${tiles()}
        ${MB.sec("01", t("A dívida do governo", "Government debt"), t("A dívida bruta soma tudo o que o governo geral deve. Veja em proporção do PIB e em reais.", "Gross debt adds up everything the general government owes. See it as a share of GDP and in reais."), `<div class="grid2">${debtCard()}${debtBrlCard()}</div>`)}
        ${MB.sec("02", t("Na escala de uma família", "At household scale"), "", scaleHTML())}
        ${MB.sec("03", t("O Brasil entre as economias do mundo", "Brazil among the world's economies"), t("Compare a dívida brasileira com a de outros países. O mapa usa os dados e as projeções do FMI.", "Compare Brazilian debt with other countries'. The map uses the IMF's data and projections."), `<div class="map-wrap"><div>${worldMap()}</div><article class="card"><p class="side-h">${t("Maiores dívidas no ano escolhido", "Largest debts in the chosen year")}</p><div id="divRankHost">${rankInner()}</div><div class="c-foot">${MB.chips(["imf"])}</div></article></div>`)}
        ${MB.more("div_more", t("Ver mais dados: o que faz a dívida crescer", "See more data: what makes debt grow"), () => `<p class="more-h">${t("Gastos, arrecadação e juros", "Spending, revenue and interest")}</p><div class="grid2">${flowCard()}${resCard()}</div>`, { hint: t("resultado primário, juros e reservas", "primary balance, interest and reserves") })}`;
    },
    after(panel) {
      const sc = panel.querySelector("#scale"); if (sc) scaleUpdate(sc);
      MB.ensureGeo("world").then(() => MB.rerender("div_world"));
    },
  };
  MB.tickFns = MB.tickFns || {};
  MB.tickFns.juros2 = () => { const r = MB.govInterestPerSec(); return r ? MB.brl(r, 0) : "—"; };
})();
