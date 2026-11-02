/* Aba PAINEL — visão geral em linguagem simples: contadores ao vivo, 8 números-chave, Real × Bitcoin e inflação. */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const S = (MB.painelState = { h: 10, real: false, log: true });
  const T0 = Date.now();

  /* ------------------------- indicadores (usados também na fita) ------------------------- */
  const delta = (cur, prev, unit, good, d = 1) => {
    if (cur == null || prev == null || !isFinite(cur) || !isFinite(prev)) return {};
    const v = cur - prev; if (Math.abs(v) < Math.pow(10, -d) / 2) return {}; const cls = MB.sig(v, good);
    return { change: `${v > 0 ? "▲" : v < 0 ? "▼" : "•"} ${v > 0 ? "+" : ""}${F(v, d)} ${unit}`, changeCls: cls };
  };
  const rel = (cur, prev, good) => {
    if (!cur || !prev) return {};
    const v = (cur / prev - 1) * 100, cls = MB.sig(Math.abs(v) < 0.05 ? 0 : v, good);
    return { change: `${v > 0 ? "▲" : v < 0 ? "▼" : "•"} ${v > 0 ? "+" : ""}${F(v, 1)}%`, changeCls: cls };
  };
  const tail = (arr, n) => (arr || []).slice(-n);
  MB.powerSeries = () => MB.memo("powerSeries", () => {
    const I = MB.idx(); if (!I.first) return [];
    const b = MB.P("1994-06"); if (!b) return [];
    return I.keys.filter((ym) => ym >= "1994-07").map((ym) => [ym, (100 * b) / I.map.get(ym)]);
  });

  /* Cada KPI com `home: n` aparece na grade do Painel (na ordem n). A fita do topo usa os de `tape`. */
  MB.kpiList = () => {
    const out = [], add = (fn) => { try { const k = fn(); if (k) out.push(k); } catch (e) { console.warn("[kpi]", e); } };
    add(() => { const pw = MB.powerNow("1994-07"); if (pw == null) return null; return { id: "poder", home: 1, tape: 1, tab: "poder", label: t("R$ 100 de 1994 valem hoje", "R$ 100 of 1994 is worth today"), short: t("R$100 de 94", "R$100 of '94"), value: MB.brl(pw * 100), sub: t(`perdeu ${F((1 - pw) * 100, 1)}% do poder de compra`, `lost ${F((1 - pw) * 100, 1)}% of its purchasing power`), spark: MB.powerSeries().filter((_, i, a) => i % Math.ceil(a.length / 60) === 0), color: C.real, src: ["sgs:ipca"], tone: "bad" }; });
    add(() => { const a = MB.ipca12(), l = MB.lastOf(a); if (l[0] == null) return null;
      return { id: "ipca12", home: 2, tape: 1, tab: "inflacao", label: t("Inflação em 12 meses", "Inflation, last 12 months"), short: t("Inflação 12m", "Inflation 12m"), value: F(l[1], 2) + "%", sub: `${MB.ymLabel(l[0])} · ${t("meta oficial: 3%", "official target: 3%")}`, spark: tail(a, 36), src: ["sgs:ipca"], ...delta(l[1], MB.nth(a, 3)[1], t("p.p. em 3 meses", "p.p. in 3 months"), "down") }; });
    add(() => { const l = MB.last("salMin"); if (l[0] == null) return null; return { id: "salmin", home: 3, tape: 1, tab: "poder", label: t("Salário mínimo", "Minimum wage"), short: t("Sal. mínimo", "Min. wage"), value: MB.brl(l[1], 0), sub: MB.ymLabel(l[0]), spark: tail(MB.ser("salMin"), 60), color: C.usd, src: ["sgs:salMin"], ...rel(l[1], MB.ago(MB.ser("salMin"), 12), "up") }; });
    add(() => { const b = MB.btcNow(); if (!b) return null; return { id: "btc", home: 4, tape: 1, tab: "bitcoin", label: t("Bitcoin (em reais)", "Bitcoin (in reais)"), short: "BTC/BRL", value: MB.brl(b, 0), live: "btcBrl", liveChg: "btcChg", sub: `R$ 1 = <span data-live="sats">${F(MB.sats(b), 0)} sats</span>`, spark: tail(MB.btcM(), 36), color: C.btc, src: ["btc", "live"], change: MB.live.chg24 != null ? (MB.live.chg24 >= 0 ? "▲ " : "▼ ") + F(Math.abs(MB.live.chg24), 2) + "%" : "", changeCls: MB.sig(MB.live.chg24, "up") }; });
    add(() => { const l = MB.last("jurosCartRot"); if (l[0] == null) return null; return { id: "cartao", home: 5, tape: 1, tab: "juros", label: t("Juros do cartão (rotativo)", "Credit-card interest (revolving)"), short: t("Cartão", "Card"), value: F(l[1], 0) + "% a.a.", sub: `${MB.ymLabel(l[0])} · ${t("média das pessoas físicas", "individuals' average")}`, spark: tail(MB.ser("jurosCartRot"), 48), color: C.amber, src: ["sgs:jurosCartRot"], ...delta(l[1], MB.ago(MB.ser("jurosCartRot"), 12), t("p.p. em 12m", "p.p. in 12m"), "down", 0) }; });
    add(() => { const l = MB.last("endiv"); if (l[0] == null) return null; return { id: "endiv", home: 6, tape: 0, tab: "familias", label: t("Dívida das famílias", "Household debt"), short: t("Famílias", "Households"), value: F(l[1], 1) + "%", sub: `${t("da renda de um ano", "of a year's income")} · ${MB.ymLabel(l[0])}`, spark: tail(MB.ser("endiv"), 60), color: C.pink, src: ["sgs:endiv"], ...delta(l[1], MB.ago(MB.ser("endiv"), 12), t("p.p. em 12m", "p.p. in 12m"), "down") }; });
    add(() => { const l = MB.last("dbggPct"); if (l[0] == null) return null; return { id: "dbgg", home: 7, tape: 1, tab: "divida", label: t("Dívida do governo", "Government debt"), short: t("Dívida/PIB", "Debt/GDP"), value: F(l[1], 1) + "% do PIB", sub: `${MB.ymLabel(l[0])} · ${MB.compact(MB.last("dbggBRL")[1] * 1e6)}`, spark: tail(MB.ser("dbggPct"), 60), color: C.red, src: ["sgs:dbggPct"], ...delta(l[1], MB.ago(MB.ser("dbggPct"), 12), t("p.p. em 12m", "p.p. in 12m"), "down") }; });
    add(() => { const p = MB.pixTotals?.(); if (!p) return null; const y = p.years.map((o) => [o.y, o.n]); return { id: "pix", home: 8, tape: 1, tab: "pix", label: t("Pix desde o lançamento", "Pix since launch"), short: "Pix", value: F(p.n / 1e9, 0) + (MB.lang === "pt" ? " bi" : " B"), sub: t(`transações desde ${MB.ymLabel(p.first)} · ${MB.compact(p.v)} movimentados`, `transactions since ${MB.ymLabel(p.first)} · ${MB.compact(p.v)} moved`), spark: y, color: C.cdi, src: ["mpv"] }; });
    /* só na fita */
    add(() => { const a = MB.ser("selicMeta"), cur = MB.lastD("selicMeta")[1] ?? MB.last("selicMeta")[1]; if (cur == null) return null; return { id: "selic", home: 0, tape: 1, tab: "juros", label: t("Juro básico (Selic)", "Base rate (Selic)"), short: "Selic", value: F(cur, 2) + "% a.a.", sub: "", spark: tail(MB.ser("selicMes"), 36), src: ["sgs:selicMeta"] }; });
    add(() => { const u = MB.usdBrl(); if (!u) return null; return { id: "usd", home: 0, tape: 1, tab: "poder", label: t("Dólar", "US dollar"), short: "USD/BRL", value: MB.brl(u, 4), live: "usdBrl", sub: "", spark: [], src: ["sgs:ptax", "fx"], ...(MB.live.usdChg != null ? { change: (MB.live.usdChg >= 0 ? "▲ +" : "▼ ") + F(MB.live.usdChg, 2) + "%", changeCls: MB.sig(MB.live.usdChg, "down") } : {}) }; });
    return out;
  };

  /* ------------------------- contadores ao vivo ------------------------- */
  MB.tickFns = MB.tickFns || {};
  MB.tickFns.juros = () => { const r = MB.govInterestPerSec(); return r ? MB.brl((r * (Date.now() - T0)) / 1000, 0) : "—"; };
  MB.tickFns.pix = () => { const p = MB.pixPerSec(); return p ? F((p.pps * (Date.now() - T0)) / 1000, 0) : "—"; };
  function counters() {
    const ips = MB.govInterestPerSec(), pps = MB.pixPerSec();
    return `<div class="counters reveal">
      <div class="counter btc"><p class="c-l">BITCOIN · BTC/BRL</p><p class="c-v mono" data-live="btcBrl">${MB.brl(MB.btcNow(), 0)}</p><p class="c-s"><span class="mono" data-live="btcChg"></span> <span class="muted">24h</span> · <span class="mono" data-live="btcUsd">${MB.usd(MB.btcUsdNow(), 0)}</span></p></div>
      <div class="counter"><p class="c-l">${t("DÓLAR · USD/BRL", "DOLLAR · USD/BRL")}</p><p class="c-v mono" data-live="usdBrl">${MB.brl(MB.usdBrl(), 4)}</p><p class="c-s">${t("R$ 1 = ", "R$ 1 = ")}<span class="mono">${MB.usdBrl() ? F(1 / MB.usdBrl(), 4) : "—"}</span> US$</p></div>
      <div class="counter debt"><p class="c-l">${t("JUROS DO GOVERNO · desde que você abriu a página", "GOVERNMENT INTEREST · since you opened the page")}</p><p class="c-v mono" data-tick="juros">R$ 0</p><p class="c-s">${ips ? "≈ " + MB.brl(ips, 0) + t("/segundo · estimativa", "/second · estimate") : t("aguardando dados", "waiting for data")}</p></div>
      <div class="counter"><p class="c-l">${t("PIX · transações desde que você abriu", "PIX · transactions since you opened")}</p><p class="c-v mono" data-tick="pix">0</p><p class="c-s">${pps ? "≈ " + F(pps.pps, 0) + t("/segundo · média de ", "/second · average of ") + MB.ymLabel(pps.month) : t("aguardando dados", "waiting for data")}</p></div>
    </div>`;
  }
  function kpiGrid() {
    const L = MB.kpiList().filter((k) => k.home).sort((a, b) => a.home - b.home);
    if (!L.length) return "";
    return `<div class="kpis reveal" id="kpis">${L.map((k) => `<a class="kpi" href="#/${k.tab}" data-tab-go="${k.tab}">
      <div class="k-top"><span class="k-l">${k.label}</span><span class="k-go">→</span></div>
      <div class="k-v"${k.live ? ` data-live="${k.live}"` : ""}>${k.value}</div>
      <div class="k-ch"><span class="${k.changeCls || "flat"}"${k.liveChg ? ` data-live="${k.liveChg}"` : ""}>${k.change || "&nbsp;"}</span></div>
      <div class="k-spark">${MB.spark(k.spark, k.color || C.btc)}</div>
      <div class="k-src"><span>${k.sub || ""}</span></div></a>`).join("")}</div>`;
  }

  /* ------------------------- Real × Bitcoin (barras simples) ------------------------- */
  const HZ = [[1, "1 ano", "1 year"], [3, "3 anos", "3 years"], [5, "5 anos", "5 years"], [10, "10 anos", "10 years"], [99, "Máximo", "Max"]];
  const cmpCtrl = () => `<div class="c-ctrl" role="group" aria-label="${t("Período", "Period")}">${HZ.map(([h, a, b]) => `<button type="button" data-h="${h}" aria-pressed="${S.h === h}">${t(a, b)}</button>`).join("")}</div>`;
  const startFor = (h) => { const btc = MB.btcM(); const first = MB.ymAdd(btc[0][0], 1), want = MB.ymAdd(MB.nowYm(), -12 * h); return want > first ? want : first; };
  const yearsLabel = (start) => { const m = MB.monthsBetween(start, MB.nowYm()), y = m / 12; return y >= 1.5 ? t(`${F(y, 0)} anos`, `${F(y, 0)} years`) : t(`${m} meses`, `${m} months`); };
  const cmpCard = () => MB.card("cmp", {
    title: t("Se você tivesse guardado R$ 100…", "If you had set aside R$ 100…"),
    sub: t("…em cada lugar, no início do período. A linha tracejada é o custo de vida: para não perder poder de compra, o dinheiro precisava passar dela.", "…in each place, at the start of the period. The dashed line is the cost of living: to avoid losing purchasing power, the money had to get past it."),
    src: ["btc", "sgs:ptax", "sgs:cdiMes", "sgs:ipca", "live"], ctrl: cmpCtrl, height: 300, noTable: false,
    below: () => `<p class="note" style="margin:10px 2px 4px">${t("<b>Atenção:</b> o Bitcoin oscila muito — já houve quedas de mais de 70% no meio do caminho — e o passado não garante o futuro. Veja a aba <a href=\"#/bitcoin\">Bitcoin</a>.", "<b>Heads-up:</b> Bitcoin swings a lot — there were falls of more than 70% along the way — and the past does not guarantee the future. See the <a href=\"#/bitcoin\">Bitcoin</a> tab.")}</p>`,
    onClick(e, el) { const b = e.target.closest("[data-h]"); if (!b) return; S.h = +b.dataset.h; el.querySelector("[data-ctrl]").innerHTML = cmpCtrl(); el._render(); MB.rerender("cmp_line"); },
    build() {
      const btc = MB.btcM(); if (!btc.length) return null;
      const start = startFor(S.h), c = MB.compareFrom(start), L = (k) => c[k].at(-1)?.[1];
      const items = [
        { name: "Bitcoin", value: L("btc"), color: C.btc },
        { name: t("Dólar", "US dollar"), value: L("usd"), color: C.usd },
        { name: t("Renda fixa (CDI)", "Fixed income (CDI)"), value: L("cdi"), color: C.cdi },
        { name: t("Dinheiro parado na gaveta", "Cash left in a drawer"), value: L("cash"), color: C.ref },
      ].filter((x) => x.value != null && isFinite(x.value));
      if (!items.length) return null;
      const o = MB.hbar(items, { fmt: (v) => MB.brl(v, 0) });
      o.grid.right = 80; o.grid.top = 30;
      const ip = L("ipca");
      if (ip) o.series[0].markLine = { silent: true, symbol: "none", lineStyle: { color: C.real, type: "dashed", width: 1.6 }, label: { color: "#9cc4ff", fontSize: 11.5, formatter: t("custo de vida: ", "cost of living: ") + MB.brl(ip, 0), position: "end", rotate: 0 }, data: [{ xAxis: ip }] };
      const byName = Object.fromEntries(items.map((x) => [x.name, x.value]));
      const big = `<div class="c-big-row"><span>${t(`Em ${yearsLabel(start)}, R$ 100 viraram`, `In ${yearsLabel(start)}, R$ 100 became`)}:</span>${items.slice(0, 3).map((x) => `<span><i class="sw" style="background:${x.color}"></i>${x.name}: <b>${MB.brl(x.value, 0)}</b></span>`).join("")}<small>${t("desde", "since")} ${MB.ymLabel(start)}</small></div>`;
      return { option: o, big, table: { cols: [t("Onde o dinheiro ficou", "Where the money went"), t("R$ 100 viraram", "R$ 100 became")], rows: [...items.map((x) => [x.name, MB.brl(x.value, 0)]), ...(ip ? [[t("Custo de vida (IPCA)", "Cost of living (IPCA)"), MB.brl(ip, 0)]] : [])] } };
    },
  });
  const lineCtrl = () => `<div class="c-ctrl"><button type="button" data-real="0" aria-pressed="${!S.real}">${t("Valores nominais", "Nominal values")}</button><button type="button" data-real="1" aria-pressed="${S.real}">${t("Corrigido pela inflação", "Inflation-adjusted")}</button></div><div class="c-ctrl" style="margin-left:6px"><button type="button" data-log="1" aria-pressed="${S.log}">${t("escala log", "log scale")}</button><button type="button" data-log="0" aria-pressed="${!S.log}">${t("linear", "linear")}</button></div>`;
  const lineCard = () => MB.card("cmp_line", {
    title: t("Mês a mês", "Month by month"), sub: t("Mesmo período escolhido acima. “Corrigido” desconta o custo de vida: acima de 100 = ganhou poder de compra.", "Same period chosen above. “Adjusted” subtracts the cost of living: above 100 = gained purchasing power."),
    src: ["btc", "sgs:ptax", "sgs:cdiMes", "sgs:ipca", "live"], ctrl: lineCtrl, height: 340,
    onClick(e, el) { const b = e.target.closest("[data-real],[data-log]"); if (!b) return; if (b.dataset.real != null) S.real = b.dataset.real === "1"; if (b.dataset.log != null) S.log = b.dataset.log === "1"; el.querySelector("[data-ctrl]").innerHTML = lineCtrl(); el._render(); },
    build() {
      const btc = MB.btcM(); if (!btc.length) return null;
      const start = startFor(S.h), c = MB.compareFrom(start, { real: S.real });
      const items = [["Bitcoin", C.btc, c.btc], [t("Dólar", "US dollar"), C.usd, c.usd], ["CDI", C.cdi, c.cdi]];
      if (S.real) items.push([t("Dinheiro parado", "Cash in a drawer"), C.ref, c.cash]); else items.push([t("Custo de vida (IPCA)", "Cost of living (IPCA)"), C.real, c.ipca]);
      const o = MB.baseOption({ legend: true, log: S.log, yFmt: (v) => "R$ " + F(v, 0), tipFmt: (v) => MB.brl(v, 0) });
      if (S.log) o.yAxis.min = (v) => Math.max(1, Math.floor(v.min * 0.8));
      o.series = items.filter((x) => x[2].length).map(([n, col, d], i) => MB.sLine(n, col, MB.toPts(d), { width: i === 0 ? 2.6 : 2, dashed: i === 3 }));
      return { option: o, table: MB.monthTable(items.map((x) => x[0]), items.map((x) => x[2]), items.map(() => (v) => MB.brl(v, 0)), 60) };
    },
  });

  /* ------------------------- corrosão e inflação ------------------------- */
  const powerCard = () => MB.tsCard("p_poder", {
    title: t("Quanto valem hoje R$ 100 de julho de 1994", "What R$ 100 from July 1994 is worth today"), sub: t("Poder de compra, descontada a inflação (IPCA)", "Purchasing power, discounted for inflation (IPCA)"),
    src: ["sgs:ipca"], ranges: ["5a", "10a", "20a", "tudo"], yFmt: (v) => "R$ " + F(v, 0), tipFmt: (v) => MB.brl(v), yMin: 0,
    series: () => [{ name: t("R$ 100 guardados", "R$ 100 kept"), color: C.real, area: true, data: MB.powerSeries() }],
    big: (S0) => `R$ 100 → <span class="neg">${MB.brl(S0[0].data.at(-1)[1])}</span>`,
  });
  const ipcaCard = () => MB.tsCard("p_ipca", {
    title: t("Inflação nos últimos 12 meses", "Inflation over the last 12 months"), sub: t("Faixa cinza: a meta oficial (3%, com tolerância de 1,5 ponto para cima e para baixo)", "Grey band: the official target (3%, with 1.5 points of tolerance either way)"),
    src: ["sgs:ipca"], ranges: ["5a", "10a", "20a", "tudo"], defRange: "10a", range: "10a", yMin: 0, yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => [{ name: t("Inflação (IPCA) em 12 meses", "Inflation (IPCA), 12 months"), color: C.real, area: true, data: MB.ipca12() }],
    extra: (o) => { o.series[0].markArea = { silent: true, itemStyle: { color: "rgba(154,147,168,.12)" }, data: [[{ yAxis: 1.5 }, { yAxis: 4.5 }]] }; o.series[0].markLine = MB.refLine(3, t("meta 3%", "target 3%")); },
    big: (S0) => `${F(S0[0].data.at(-1)[1], 2)}% <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });

  /* Selic esperada (Boletim Focus): vive na aba Juros, em “Ver mais dados” */
  MB.shared = MB.shared || {};
  MB.shared.selicPathCard = () => MB.card("p_selic", { empty: t("Estes dados só chegam pela coleta automática (GitHub Actions) — ela roda sozinha depois de publicado.", "This data only arrives through the automatic collection (GitHub Actions) — it runs by itself once published."),
    title: t("Selic esperada pelo mercado", "Selic expected by the market"), sub: t("Mediana do Boletim Focus para a meta ao fim de cada reunião do Copom", "Focus survey median for the target after each Copom meeting"), src: ["focus", "sgs:selicMeta"], noTable: false,
    build() {
      const m = MB.D.focus?.selic?.mtgs; if (!m?.length) return null;
      const cur = MB.lastD("selicMeta")[1] ?? MB.last("selicMeta")[1];
      const o = MB.baseOption({ yFmt: (v) => F(v, 1) + "%" }); delete o.xAxis.type;
      o.xAxis = { type: "category", data: m.map((x) => x[0]), axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, axisLabel: { color: C.axis, fontSize: 10, interval: 0, rotate: 45, fontFamily: "'IBM Plex Mono', monospace" } };
      o.tooltip = { trigger: "axis", backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, valueFormatter: (v) => F(v, 2) + "% a.a." };
      o.grid.bottom = 28;
      o.series = [{ type: "line", name: "Selic", data: m.map((x) => x[1]), step: "end", showSymbol: true, symbolSize: 6, lineStyle: { color: C.cdi, width: 2.4 }, itemStyle: { color: C.cdi }, markLine: cur != null ? MB.refLine(cur, t("hoje ", "today ") + F(cur, 2) + "%", C.btc) : undefined }];
      return { option: o, big: `${t("Fim de", "End of")} ${m.at(-1)[0].split("/")[1]}: <span class="mono">${F(m.at(-1)[1], 2)}%</span>`, table: { cols: [t("Reunião", "Meeting"), "Selic"], rows: m.map((x) => [x[0], F(x[1], 2) + "%"]) } };
    },
  });

  const links = () => {
    const L = [["poder", t("Poder de compra", "Purchasing power"), t("Quanto vale o seu dinheiro de ontem, hoje", "What yesterday's money is worth today")], ["inflacao", t("Inflação", "Inflation"), t("O que mais subiu de preço", "What rose most in price")], ["juros", t("Juros e crédito", "Rates & credit"), t("O que cobram no cartão e no cheque especial", "What cards and overdrafts charge")], ["familias", t("Famílias", "Households"), t("Quanto da renda vai para dívidas", "How much income goes to debt")], ["divida", t("Dívida pública", "Public debt"), t("Quanto o governo deve — e quanto isso pesa", "What the government owes — and how heavy it is")], ["pix", "Pix", t("O pagamento que mudou o país", "The payment that changed the country")], ["bitcoin", "Bitcoin", t("Simule a proteção, sem promessa", "Simulate the protection, no promises")], ["museu", t("Museu do Real", "Real Museum"), t("A história do dinheiro brasileiro, e o confisco de 1990", "The story of Brazilian money, and the 1990 savings freeze")]];
    return `<div class="tiles-link reveal">${L.map(([id, a, b]) => `<button type="button" class="goto" data-tab-go="${id}"><b>${a} →</b><span>${b}</span></button>`).join("")}</div>`;
  };

  MB.tabs.painel = {
    render(panel) {
      panel.innerHTML = `${counters()}${kpiGrid()}
        ${MB.sec("01", t("Real × Bitcoin", "Real vs Bitcoin"), t("Se você tivesse guardado R$ 100 lá atrás, onde o dinheiro teria rendido mais? Escolha o período.", "If you had set aside R$ 100 back then, where would the money have done best? Pick the period."), `${cmpCard()}${MB.more("cmp_line", t("Ver a evolução mês a mês", "See month-by-month evolution"), () => lineCard(), { hint: t("gráfico de linhas", "line chart") })}`)}
        ${MB.sec("02", t("O que a inflação fez com o seu dinheiro", "What inflation did to your money"), t("Dois retratos do mesmo problema: o quanto o Real perdeu desde 1994 e quanto os preços sobem hoje.", "Two pictures of the same problem: how much the Real has lost since 1994 and how fast prices rise today."), `<div class="grid2">${powerCard()}${ipcaCard()}</div>`)}
        ${MB.sec("03", t("Explore", "Explore"), "", links())}`;
    },
  };
})();
