/* Aba PIX — o total desde o lançamento, o total de cada ano, como o Brasil paga e o Pix no mundo (BIS).
 * Versão enxuta: sem mês a mês, sem região, sem setor — só o que se entende de relance. */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.pixState = { y: "q", pay: "q", world: "tot" });
  const P = () => MB.D.pix || {};
  const BI = () => (MB.lang === "pt" ? " bi" : " B");
  const TRI = () => (MB.lang === "pt" ? " tri" : " T");
  const segLens = (attr, active) => MB.segHTML(attr, [["q", t("Quantidade", "Count")], ["v", t("Valor em R$", "Value in R$")]], active);

  /* ------------------------- o grande número ------------------------- */
  function hall() {
    const p = MB.pixTotals(); if (!p) return "";
    const pps = MB.pixPerSec();
    return `<div class="hall reveal"><p class="kicker">${t("Pix · desde o lançamento", "Pix · since launch")}</p>
      <div class="big" id="pixBig" data-to="${p.n}">${F(p.n / 1e9, 0)}${t(" bilhões", " billion")}</div>
      <p>${t(`de transações feitas por brasileiros desde ${MB.ymLabel(p.first)}, movimentando <b>${MB.compact(p.v)}</b>. ${pps ? `No último mês fechado, foram cerca de <b>${F(pps.pps, 0)} Pix por segundo</b>.` : ""}`, `transactions by Brazilians since ${MB.ymLabel(p.first)}, moving <b>${MB.compact(p.v)}</b>. ${pps ? `In the last closed month that was about <b>${F(pps.pps, 0)} Pix per second</b>.` : ""}`)}</p></div>`;
  }
  function tiles() {
    const p = MB.pixTotals(); if (!p) return "";
    const cur = p.years.at(-1), ytd = cur.partial ? t(`até ${MB.MES.pt[+p.last.slice(5, 7) - 1]}`, `through ${MB.MES.en[+p.last.slice(5, 7) - 1]}`) : t("ano completo", "full year");
    const m = P().mpv.at(-1), days = new Date(+m.m.slice(0, 4), +m.m.slice(5, 7), 0).getDate();
    return `<div class="tiles4 tiles3 reveal">
      ${MB.tile(t(`Em ${cur.y}`, `In ${cur.y}`), F(cur.n / 1e9, 1) + BI(), `${ytd} · ${MB.compact(cur.v)}`, { best: true })}
      ${MB.tile(t("Por dia", "Per day"), F(m.pix[0] / days / 1e6, 0) + t(" milhões", " million"), t(`média de ${MB.ymLabel(m.m)}`, `${MB.ymLabel(m.m)} average`))}
      ${MB.tile(t("Cada Pix, em média", "Each Pix, on average"), MB.brl(p.v / p.n, 0), t("valor total ÷ número de transações", "total value ÷ number of transactions"))}</div>`;
  }

  /* ------------------------- ano a ano ------------------------- */
  const yearCard = () => MB.card("pix_year", {
    title: t("Quanto o Pix movimentou em cada ano", "What Pix moved in each year"), sub: t("2020 tem só novembro e dezembro; o ano atual ainda está em andamento (barras roxas).", "2020 has only November and December; the current year is still in progress (purple bars)."), src: ["mpv"], height: 340, ctrl: () => segLens("yl", st.y),
    onClick(e, el) { const b = e.target.closest("[data-yl]"); if (!b) return; st.y = b.dataset.yl; el.querySelector("[data-ctrl]").innerHTML = segLens("yl", st.y); el._render(); },
    build() {
      const p = MB.pixTotals(); if (!p) return null;
      const q = st.y === "q", val = (o) => (q ? o.n / 1e9 : o.v / 1e12), fmt = (v) => (q ? F(v, 1) + BI() : "R$ " + F(v, 1) + TRI());
      const lab = (o) => (o.partial ? `${o.y}\n${o.y === p.first.slice(0, 4) ? t("nov–dez", "Nov–Dec") : t("até ", "to ") + MB.MES[MB.lang][+o.last.slice(5, 7) - 1]}` : o.y);
      const o = MB.baseOption({ yFmt: (v) => F(v, 0) }); o.legend.show = false; o.yAxis.scale = false; o.yAxis.min = 0; o.grid.top = 28; o.grid.bottom = 18;
      o.xAxis = { type: "category", data: p.years.map(lab), axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 12, lineHeight: 16, interval: 0 } };
      o.yAxis.axisLabel.formatter = (v) => F(v, 0);
      o.tooltip = { trigger: "axis", confine: true, axisPointer: { type: "shadow" }, backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, formatter: (ps) => { const y = p.years[ps[0].dataIndex]; return `<b>${y.y}</b>${y.partial ? " · " + (y.months === 1 ? t("1 mês", "1 month") : t(`${y.months} meses`, `${y.months} months`)) : ""}<br>${F(y.n / 1e9, 2)}${BI()} ${t("transações", "transactions")}<br>${MB.compact(y.v)} ${t("movimentados", "moved")}`; } };
      o.series = [{ type: "bar", barMaxWidth: 64, data: p.years.map((y) => ({ value: val(y), itemStyle: { color: y.partial ? "#6f5fd0" : C.btc, borderRadius: [5, 5, 0, 0] } })), label: { show: true, position: "top", color: C.text, fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", formatter: (x) => fmt(x.value) } }];
      return { option: o, big: `${t("Soma de todos os anos", "Sum of all years")}: <span class="mono">${F(p.n / 1e9, 1)}${BI()}</span> ${t("transações", "transactions")} · <span class="mono">${MB.compact(p.v)}</span>`, table: { cols: [t("Ano", "Year"), t("Transações", "Transactions"), t("Valor (R$)", "Value (R$)"), t("Meses", "Months")], rows: p.years.map((y) => [y.y, F(y.n, 0), MB.compact(y.v), y.months]) } };
    },
  });

  /* ------------------------- como o Brasil paga ------------------------- */
  const INST = () => [["Pix", "Pix", C.btc], ["CartaoCredito", t("Cartão de crédito", "Credit card"), "#7b61ff"], ["CartaoDebito", t("Cartão de débito", "Debit card"), C.real], ["CartaoPrePago", t("Cartão pré-pago", "Prepaid card"), "#5a6a8a"], ["Boleto", t("Boleto", "Boleto"), C.amber], ["TED", t("TED / DOC", "Wire transfer (TED/DOC)"), C.usd], ["TransIntrabancaria", t("Transferência no mesmo banco", "Same-bank transfer"), C.pink], ["Cheque", t("Cheque", "Cheque"), C.ref], ["DebitoDireto", t("Débito automático", "Direct debit"), "#c4bdff"], ["Convenios", t("Contas de consumo (convênios)", "Utility bills"), "#7bd88f"]];
  const payCard = () => MB.card("pix_pay", {
    title: t("Como os brasileiros pagam", "How Brazilians pay"), sub: t("Participação de cada forma de pagamento nos últimos quatro trimestres divulgados", "Share of each payment method over the last four quarters published"), src: ["mpv"], height: 380, ctrl: () => segLens("pl", st.pay),
    onClick(e, el) { const b = e.target.closest("[data-pl]"); if (!b) return; st.pay = b.dataset.pl; el.querySelector("[data-ctrl]").innerHTML = segLens("pl", st.pay); el._render(); },
    build() {
      const Q = P().mpvQ; if (!Q?.length) return null;
      const idx = st.pay === "q" ? 0 : 1, rows = Q.slice(-4), get = (r, k) => (k === "TED" ? (r.TED?.[idx] || 0) + (r.DOC?.[idx] || 0) + (r.TEC?.[idx] || 0) : r[k]?.[idx] || 0);
      const sums = INST().map(([k, n, col]) => ({ name: n, color: col, raw: rows.reduce((s, r) => s + get(r, k), 0) })), tot = sums.reduce((s, x) => s + x.raw, 0); if (!tot) return null;
      const items = sums.map((x) => ({ ...x, value: (x.raw / tot) * 100 })).filter((x) => x.value > 0.05);
      const q0 = rows[0].d, q1 = rows.at(-1).d, ql = (d) => `${MB.lang === "pt" ? "T" : "Q"}${Math.ceil(+String(d).slice(5, 7) / 3)}/${String(d).slice(0, 4)}`;
      const pix = items.find((x) => x.name === "Pix");
      return { option: MB.hbar(items, { fmt: (v) => F(v, 1) + "%" }), big: pix ? t(`O Pix respondeu por <span class="mono">${F(pix.value, 0)}%</span> ${st.pay === "q" ? "dos pagamentos eletrônicos (em quantidade)" : "do dinheiro movimentado"} · ${ql(q0)} a ${ql(q1)}`, `Pix accounted for <span class="mono">${F(pix.value, 0)}%</span> ${st.pay === "q" ? "of electronic payments (by count)" : "of the money moved"} · ${ql(q0)} to ${ql(q1)}`) : "", table: { cols: [t("Forma de pagamento", "Payment method"), "%"], rows: items.slice().sort((a, b) => b.value - a.value).map((x) => [x.name, F(x.value, 1) + "%"]) } };
    },
  });

  /* ------------------------- o Pix no mundo (BIS) ------------------------- */
  const CTY = () => ({ BR: t("Brasil (Pix)", "Brazil (Pix)"), IN: t("Índia (UPI)", "India (UPI)"), GB: t("Reino Unido", "United Kingdom"), MX: t("México", "Mexico"), AU: t("Austrália", "Australia"), JP: t("Japão", "Japan"), XM: t("Zona do euro", "Euro area"), US: t("EUA", "USA"), CN: t("China", "China"), KR: t("Coreia do Sul", "South Korea"), SG: t("Singapura", "Singapore"), SA: t("Arábia Saudita", "Saudi Arabia"), TH: t("Tailândia", "Thailand") });
  const ISO = { BR: "BRA", IN: "IND", GB: "GBR", MX: "MEX", AU: "AUS", JP: "JPN", US: "USA", CN: "CHN", KR: "KOR", SG: "SGP", SA: "SAU", TH: "THA" };
  const worldCtrl = () => MB.segHTML("wl", [["tot", t("Total no ano", "Total per year")], ["pc", t("Por habitante", "Per inhabitant")]], st.world);
  const worldCard = () => MB.card("pix_world", {
    title: t("O Pix no mundo", "Pix in the world"), sub: t("Pagamentos instantâneos nos maiores sistemas do planeta, ano mais recente de cada um (BIS)", "Instant payments in the planet's largest systems, latest year of each (BIS)"), src: ["bis", "wb"], height: 380, ctrl: worldCtrl,
    onClick(e, el) { const b = e.target.closest("[data-wl]"); if (!b) return; st.world = b.dataset.wl; el.querySelector("[data-ctrl]").innerHTML = worldCtrl(); el._render(); },
    build() {
      const sys = Object.entries(MB.D.world?.bis?.systems || {}); if (!sys.length) return null;
      const pc = st.world === "pc", L = CTY();
      const best = new Map(); // um sistema por país: o de maior volume no último ano
      const short = (n) => { const p = String(n || "").match(/\(([^)]+)\)\s*$/); return (p ? p[1] : String(n || "")).replace(/ System$/, "").replace(/ Service$/, ""); };
      for (const [, s] of sys) { const y = Object.keys(s.N).sort().at(-1), n = s.N[y]; if (n != null && (!best.get(s.cty) || n > best.get(s.cty).n)) best.set(s.cty, { cty: s.cty, y, n, sys: short(s.name) }); }
      const items = [...best.values()].map((b) => { const pop = MB.D.world?.pop?.[ISO[b.cty]]?.[1]; const v = pc ? (pop ? (b.n * 1e6) / pop : null) : b.n / 1000; return v == null ? null : { name: `${b.cty === "BR" ? L.BR : `${L[b.cty] || b.cty} (${b.sys})`} · ${b.y}`, value: v, color: b.cty === "BR" ? C.btc : C.cdi }; }).filter(Boolean);
      if (items.length < 2) return null;
      return { option: MB.hbar(items, { fmt: (v) => (pc ? F(v, v < 10 ? 1 : 0) + t(" por pessoa", " per person") : F(v, v < 10 ? 1 : 0) + BI()) }), big: MB.mini(pc ? t("Transações instantâneas por habitante em um ano", "Instant transactions per inhabitant in a year") : t("Bilhões de transações instantâneas em um ano. Para o Brasil, só o que passa pelo sistema de liquidação do Banco Central (SPI).", "Billions of instant transactions in a year. For Brazil, only what goes through the central bank's settlement system (SPI).")), table: { cols: [t("País", "Country"), pc ? t("por habitante", "per inhabitant") : t("bilhões", "billions")], rows: items.slice().sort((a, b) => b.value - a.value).map((x) => [x.name, F(x.value, 1)]) } };
    },
  });

  /* ------------------------- mais dados: mês a mês ------------------------- */
  const monthCard = () => MB.tsCard("pix_month", {
    title: t("Pix mês a mês", "Pix month by month"), sub: t("Transações por mês, em bilhões (estatística de meios de pagamento do Banco Central)", "Transactions per month, in billions (central bank payment-methods statistics)"), src: ["mpv"], ranges: ["2a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + BI(), tipFmt: (v) => F(v, 2) + BI(),
    series: () => [{ name: t("Transações", "Transactions"), color: C.btc, area: true, data: (P().mpv || []).map((m) => [m.m, m.pix[0] / 1e9]) }],
  });

  MB.tabs.pix = {
    render(panel) {
      panel.innerHTML = `${hall()}${tiles()}
        ${MB.sec("01", t("Ano a ano", "Year by year"), t("Lançado em novembro de 2020, o Pix virou o meio de pagamento mais usado do país. Aqui, o que ele já movimentou.", "Launched in November 2020, Pix became the country's most-used payment method. Here is what it has already moved."), yearCard())}
        ${MB.sec("02", t("Como o Brasil paga", "How Brazil pays"), t("O Pix lado a lado com cartões, boleto e transferências.", "Pix side by side with cards, boleto and transfers."), payCard())}
        ${MB.sec("03", t("O Pix no mundo", "Pix in the world"), t("O Brasil frente aos maiores sistemas de pagamento instantâneo, segundo o Banco de Compensações Internacionais (BIS).", "Brazil against the largest instant-payment systems, according to the Bank for International Settlements (BIS)."), worldCard())}
        ${MB.more("pix_more", t("Ver mais dados", "See more data"), () => `<p class="more-h">${t("Pix mês a mês", "Pix by month")}</p>${monthCard()}`, { hint: t("série mensal do Banco Central", "central bank monthly series") })}
        <p class="disclaimer">${t("Fonte: Banco Central do Brasil (estatísticas de meios de pagamento, dados abertos) e BIS (CPMI). O total do Brasil no gráfico mundial usa a contagem do BIS, que pode diferir poucos por cento da contagem do Banco Central usada acima.", "Source: Central Bank of Brazil (payment-methods statistics, open data) and BIS (CPMI). Brazil's total in the world chart uses the BIS count, which can differ by a few percent from the central bank count used above.")}</p>`;
    },
    after(panel) {
      const big = panel.querySelector("#pixBig"); if (!big) return; const to = +big.dataset.to, f = (v) => F(v / 1e9, 0) + t(" bilhões", " billion");
      big.textContent = f(0); const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { MB.countUp(big, to, f, 2200); io.disconnect(); } }); io.observe(big);
      setTimeout(() => { if (big.textContent === f(0)) MB.countUp(big, to, f, 1600); }, 2600);
    },
  };
})();
