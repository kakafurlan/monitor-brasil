/* VISÃO GERAL — a home conta uma história em três capítulos (por que importa, quanto o brasileiro perdeu, o que teria
   preservado o poder de compra), depois um panorama curto e três caminhos para aprofundar. */
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
    add(() => { const d = MB.lastD("selicMeta"), cur = d[1] ?? MB.last("selicMeta")[1]; if (cur == null) return null; return { id: "selic", home: 0, tape: 1, tab: "juros", label: t("Juro básico (Selic)", "Base rate (Selic)"), short: "Selic", value: F(cur, 2) + "% a.a.", sub: t("meta definida pelo Copom", "target set by Copom") + (d[0] ? " · " + MB.perLabel(d[0]) : ""), spark: tail(MB.ser("selicMes"), 36), color: C.cdi, src: ["sgs:selicMeta"], ...delta(cur, MB.ago(MB.ser("selicMeta"), 12), t("p.p. em 12m", "p.p. in 12m"), "down", 2) }; });
    add(() => { const u = MB.usdBrl(); if (!u) return null; return { id: "usd", home: 0, tape: 1, tab: "poder", anchor: "poder_more", label: t("Dólar", "US dollar"), short: "USD/BRL", value: MB.brl(u, 4), live: "usdBrl", sub: MB.live.usdBrl ? t("cotação ao vivo", "live quote") : t("PTAX, último fechamento", "PTAX, last close"), spark: tail(MB.ptaxM(), 36), color: C.usd, src: ["sgs:ptax", "fx"], ...(MB.live.usdChg != null ? { change: (MB.live.usdChg >= 0 ? "▲ +" : "▼ ") + F(MB.live.usdChg, 2) + "%", changeCls: MB.sig(MB.live.usdChg, "down") } : {}) }; });
    return out;
  };

  /* ------------------------- contadores (vivem nas páginas Dívida pública e Pix) ------------------------- */
  MB.tickFns = MB.tickFns || {};
  MB.tickFns.juros = () => { const r = MB.govInterestPerSec(); return r ? MB.brl((r * (Date.now() - T0)) / 1000, 0) : "—"; };
  MB.tickFns.pix = () => { const p = MB.pixPerSec(); return p ? F((p.pps * (Date.now() - T0)) / 1000, 0) : "—"; };

  /* ------------------------- utilidades ------------------------- */
  const src = (label, per, kinds) => `<p class="src-line">${label}${per ? " · " + per : ""} ${MB.kindBadges(kinds || ["monthly"])}</p>`;
  const go = (tab, anchor, label) => `<button type="button" class="link-go" data-tab-go="${tab}"${anchor ? ` data-anchor="${anchor}"` : ""}>${label} →</button>`;
  const at = (arr, ym) => { const m = MB.mapOf(arr); for (let y = ym, i = 0; i < 24; i++, y = MB.ymAdd(y, 1)) if (m.has(y)) return [y, m.get(y)]; return [null, null]; };
  const sgn = (v, d = 0) => (v > 0 ? "+" : v < 0 ? "−" : "") + F(Math.abs(v), d);
  const insight = (html) => `<p class="insight reveal">${html}</p>`;

  /* ------------------------- comparação em termos reais (home e página Bitcoin) ------------------------- */
  const HZ = [[1, "1 ano", "1 year"], [3, "3 anos", "3 years"], [5, "5 anos", "5 years"], [10, "10 anos", "10 years"], [99, "Desde 2010", "Since 2010"]];
  const RS = (MB.realState = MB.realState || {});
  const startFor = (h) => { const btc = MB.btcM(); if (!btc.length) return null; const first = MB.ymAdd(btc[0][0], 1), want = MB.ymAdd(MB.nowYm(), -12 * h); return want > first ? want : first; };
  const yearsLabel = (a, b) => { const m = MB.monthsBetween(a, b), y = m / 12; return y >= 1.5 ? t(`${F(y, 0)} anos`, `${F(y, 0)} years`) : t(`${m} meses`, `${m} months`); };
  /** riscos do Bitcoin no período: maior queda, tempo abaixo da máxima anterior, aporte único × mensal (tudo já descontada a inflação) */
  MB.btcRisk = (start) => {
    const all = MB.btcM(), base = MB.ymAdd(start, -1), price = MB.mapOf(all);
    let end = null; for (const [m] of all) if (m >= start && MB.P(m)) end = m;
    if (!end || !price.get(base)) return null;
    const b = all.filter(([m]) => m >= base && m <= end);
    let peak = b[0][1], mdd = 0, mddYm = null, run = 0, longest = 0;
    for (const [m, v] of b) { if (v >= peak) { peak = v; run = 0; } else { run++; longest = Math.max(longest, run); if (v / peak - 1 < mdd) { mdd = v / peak - 1; mddYm = m; } } }
    const pEnd = MB.P(end), vEnd = price.get(end); let units = 0, cost = 0;
    for (let m = start; m <= end; m = MB.ymAdd(m, 1)) { const pm = MB.ymAdd(m, -1), v = price.get(pm), P = MB.P(pm); if (!v || !P) continue; units += 1 / v; cost += pEnd / P; }
    const lump = (vEnd / price.get(base)) * (MB.P(base) / pEnd) - 1;
    return { mdd: mdd * 100, mddYm, longest, now: run, dca: cost ? ((units * vEnd) / cost - 1) * 100 : null, lump: lump * 100, end };
  };
  MB.shared = MB.shared || {};
  MB.shared.realCmp = (pre, { page, anchor }) => {
    const st = (RS[pre] = RS[pre] || { h: 5, log: false });
    const q = MB.hashQ(), qh = +q.get("h"); if (qh && location.hash.startsWith("#/" + page) && HZ.some((x) => x[0] === qh)) st.h = qh;
    const ctrl = () => `<div class="c-ctrl" role="group" aria-label="${t("Período", "Period")}">${HZ.map(([h, a, b]) => `<button type="button" data-h="${h}" aria-pressed="${st.h === h}">${t(a, b)}</button>`).join("")}</div>`;
    const below = () => {
      const start = startFor(st.h), r = start && MB.btcRisk(start); if (!r) return "";
      return `<div class="riskbox">
        <div><span>${t("Maior queda do Bitcoin no período", "Bitcoin's worst fall in the period")}</span><b class="neg">${sgn(r.mdd, 0)}%</b><small>${t("a partir da máxima anterior, em reais", "from the previous peak, in reais")}${r.mddYm ? ` · ${MB.ymLabel(r.mddYm)}` : ""}</small></div>
        <div><span>${t("Maior tempo abaixo da máxima anterior", "Longest time below the previous peak")}</span><b>${r.longest} ${r.longest === 1 ? t("mês", "month") : t("meses", "months")}</b><small>${r.now ? t(`hoje: ${r.now} ${r.now === 1 ? "mês" : "meses"} abaixo do recorde do período`, `now: ${r.now} ${r.now === 1 ? "month" : "months"} below the period's record`) : t("hoje: no recorde do período", "now: at the period's record")}</small></div>
        <div><span>${t("Aporte único × aportes mensais", "Lump sum × monthly purchases")}</span><b><span class="${r.lump >= 0 ? "pos" : "neg"}">${sgn(r.lump, 0)}%</span> <i class="muted">${t("único", "lump")}</i> · <span class="${r.dca >= 0 ? "pos" : "neg"}">${sgn(r.dca, 0)}%</span> <i class="muted">${t("mensal", "monthly")}</i></b><small>${t("ganho real de cada estratégia no mesmo período", "real gain of each strategy over the same period")}</small></div>
      </div>
      <p class="note warnline">${t("<b>Antes de tirar conclusões:</b> o Bitcoin é volátil e pode cair muito; o resultado muda bastante conforme o período. A conta usa preços de fim de mês e ignora taxas, spreads e impostos. Resultado passado não garante resultado futuro — isto não é recomendação de investimento.", "<b>Before drawing conclusions:</b> Bitcoin is volatile and can fall a lot; the result changes a great deal with the period. The math uses month-end prices and ignores fees, spreads and taxes. Past results do not guarantee future results — this is not investment advice.")}</p>
      <div class="ctas-row">${page === "bitcoin" ? go("bitcoin", "bitcoin-02", t("Simular aportes mensais", "Simulate monthly purchases")) + go("bitcoin", "bitcoin-03", t("Ver quedas e janelas de permanência", "See drawdowns and holding windows")) : go("bitcoin", "bitcoin-02", t("Simular aportes mensais", "Simulate monthly purchases")) + go("bitcoin", "bitcoin-03", t("Ver quedas e janelas de permanência", "See drawdowns and holding windows"))}${MB.shareBtn(`#/${page}/${anchor}?h=${st.h}`)}</div>`;
    };
    const cmp = MB.card(pre + "_real", {
      title: t("R$ 100 guardados em cada lugar, já descontada a inflação", "R$ 100 kept in each place, after inflation"),
      sub: t("Ganho ou perda de poder de compra desde o início do período. Zero = empatou com a inflação; abaixo de zero, o dinheiro passou a comprar menos.", "Gain or loss of purchasing power since the start of the period. Zero = matched inflation; below zero, the money came to buy less."),
      src: ["btc", "sgs:ptax", "sgs:cdiMes", "sgs:ipca"], ctrl, height: 250, below,
      onClick(e, el) { const bt = e.target.closest("[data-h]"); if (!bt) return; st.h = +bt.dataset.h; el.querySelector("[data-ctrl]").innerHTML = ctrl(); el._render(); const bw = el.querySelector("[data-below]"); if (bw) bw.innerHTML = below(); MB.rerender(pre + "_rline"); },
      build() {
        const start = startFor(st.h); if (!start) return null;
        const c = MB.compareFrom(start, { real: true }), L = (k) => c[k].at(-1);
        const items = [["Bitcoin", C.btc, L("btc")], [t("Dólar", "US dollar"), C.usd, L("usd")], [t("Renda fixa (CDI)", "Fixed income (CDI)"), C.cdi, L("cdi")], [t("Dinheiro parado", "Idle cash"), C.ref, L("cash")]].filter((x) => x[2]).map(([name, color, p]) => ({ name, color, value: p[1] - 100, ym: p[0] }));
        if (!items.length) return null;
        const fmt = (v) => sgn(v, Math.abs(v) < 10 ? 1 : 0) + "%";
        const o = MB.hbar(items, { fmt, sorted: false });
        o.yAxis.axisLine = { onZero: false, lineStyle: { color: C.grid } }; o.grid.right = 64; o.grid.top = 26;
        o.xAxis.min = (v) => Math.min(-12, v.min * 1.4); o.xAxis.max = (v) => Math.max(12, v.max * 1.18);
        o.series[0].data.forEach((d) => { if (d.value < 0) d.label = { position: "left" }; });
        o.series[0].markLine = { silent: true, symbol: "none", lineStyle: { color: C.real, type: "dashed", width: 1.4 }, label: { color: "#9cc4ff", fontSize: 11, formatter: t("empate com a inflação", "matched inflation"), position: "end" }, data: [{ xAxis: 0 }] };
        const end = items.reduce((m, x) => (x.ym > m ? x.ym : m), items[0].ym), by = Object.fromEntries(items.map((x) => [x.name, x.value]));
        const big = `<div class="c-big-row"><span>${t(`Em ${yearsLabel(MB.ymAdd(start, -1), end)} (${MB.ymLabel(start)} a ${MB.ymLabel(end)})`, `Over ${yearsLabel(MB.ymAdd(start, -1), end)} (${MB.ymLabel(start)} to ${MB.ymLabel(end)})`)}:</span>${items.map((x) => `<span><i class="sw" style="background:${x.color}"></i>${x.name}: <b class="${x.value >= 0 ? "pos" : "neg"}">${fmt(x.value)}</b></span>`).join("")}</div>`;
        return { option: o, big, table: { cols: [t("Onde o dinheiro ficou", "Where the money went"), t("Ganho/perda real", "Real gain/loss"), t("Último mês", "Last month")], rows: items.map((x) => [x.name, fmt(x.value), MB.ymLabel(x.ym)]) } };
      },
    });
    const lctrl = () => `<div class="c-ctrl"><button type="button" data-log="0" aria-pressed="${!st.log}">${t("linear", "linear")}</button><button type="button" data-log="1" aria-pressed="${st.log}">${t("escala log", "log scale")}</button></div>`;
    const line = MB.card(pre + "_rline", {
      title: t("Mês a mês, em poder de compra", "Month by month, in purchasing power"), sub: t("Mesmo período escolhido acima. 100 = o poder de compra do início; acima de 100, ganhou da inflação.", "Same period chosen above. 100 = purchasing power at the start; above 100, it beat inflation."),
      src: ["btc", "sgs:ptax", "sgs:cdiMes", "sgs:ipca"], ctrl: lctrl, height: 320,
      onClick(e, el) { const bt = e.target.closest("[data-log]"); if (!bt) return; st.log = bt.dataset.log === "1"; el.querySelector("[data-ctrl]").innerHTML = lctrl(); el._render(); },
      build() {
        const start = startFor(st.h); if (!start) return null;
        const c = MB.compareFrom(start, { real: true });
        const items = [["Bitcoin", C.btc, c.btc], [t("Dólar", "US dollar"), C.usd, c.usd], ["CDI", C.cdi, c.cdi], [t("Dinheiro parado", "Idle cash"), C.ref, c.cash]].filter((x) => x[2].length);
        const o = MB.baseOption({ legend: true, log: st.log, yFmt: (v) => F(v, 0), tipFmt: (v) => F(v, 1) });
        if (st.log) o.yAxis.min = (v) => Math.max(1, Math.floor(v.min * 0.8));
        o.series = items.map(([n, col, d], i) => MB.sLine(n, col, MB.toPts(d), { width: i === 0 ? 2.6 : 2, dashed: i === 3 }));
        o.series[0].markLine = MB.refLine(100, t("empate", "break-even"));
        return { option: o, table: MB.monthTable(items.map((x) => x[0]), items.map((x) => x[2]), items.map(() => (v) => F(v, 1)), 60) };
      },
    });
    return `${cmp}${line}`;
  };

  /* ------------------------- capítulo 1: por que isso importa ------------------------- */
  function whyCards() {
    const out = [];
    const pw = MB.powerNow("1994-07"), i12 = MB.lastOf(MB.ipca12()), lip = MB.last("ipca")[0];
    if (pw) out.push(`<a class="why reveal" href="#/inflacao" data-tab-go="inflacao"><p class="why-k">${t("Preços", "Prices")}</p><p class="why-n">+${F((1 / pw - 1) * 100, 0)}%</p><p class="why-x">${t(`Foi quanto os preços subiram desde o Plano Real. Só nos últimos 12 meses, a inflação foi de <b>${F(i12[1], 2)}%</b> — a meta oficial é 3%.`, `That is how much prices have risen since the Real Plan. In the last 12 months alone inflation was <b>${F(i12[1], 2)}%</b> — the official target is 3%.`)}</p>${src(t("IPCA · IBGE, via Banco Central", "IPCA · IBGE, via central bank"), lip ? t("até ", "through ") + MB.ymLabel(lip) : "")}<span class="why-go">${t("Ver detalhes", "See details")} →</span></a>`);
    const sr = MB.salMinReal(), s94 = at(sr, "1994-07"), sNow = MB.lastOf(sr), sNom = MB.last("salMin");
    if (sNom[1] && s94[1] && sNow[1]) { const g = (sNow[1] / s94[1] - 1) * 100; out.push(`<a class="why reveal" href="#/poder" data-tab-go="poder" data-anchor="poder-03"><p class="why-k">${t("Renda", "Income")}</p><p class="why-n">${MB.brl(sNom[1], 0)}</p><p class="why-x">${t(`É o salário mínimo hoje. Corrigido pela inflação, o mínimo de julho de 1994 valeria ${MB.brl(s94[1], 0)}: o piso ${g >= 0 ? "ganhou" : "perdeu"} <b>${F(Math.abs(g), 0)}%</b> de poder de compra desde então. Quem guardou dinheiro parado não teve essa correção.`, `That is the minimum wage today. Adjusted for inflation, July 1994's minimum would be worth ${MB.brl(s94[1], 0)}: the floor ${g >= 0 ? "gained" : "lost"} <b>${F(Math.abs(g), 0)}%</b> in purchasing power since. Cash left idle had no such adjustment.`)}</p>${src(t("Salário mínimo · Banco Central (SGS)", "Minimum wage · central bank (SGS)"), MB.ymLabel(sNom[0]))}<span class="why-go">${t("Ver detalhes", "See details")} →</span></a>`); }
    const cr = MB.last("jurosCartRot"), cm = MB.last("comprom");
    if (cr[1]) out.push(`<a class="why reveal" href="#/juros" data-tab-go="juros"><p class="why-k">${t("Dívidas", "Debt")}</p><p class="why-n">${F(cr[1], 0)}% <small>${t("ao ano", "a year")}</small></p><p class="why-x">${t(`É o juro médio do rotativo do cartão. Uma dívida pequena pode crescer muito mais rápido do que a renda.${cm[1] ? ` Hoje as famílias usam <b>${F(cm[1], 1)}%</b> da renda do mês para pagar dívidas.` : ""}`, `That is the average revolving credit-card rate. A small debt can grow much faster than income.${cm[1] ? ` Households now use <b>${F(cm[1], 1)}%</b> of monthly income to pay debts.` : ""}`)}</p>${src(t("Juros e endividamento · Banco Central (SGS)", "Rates and indebtedness · central bank (SGS)"), MB.ymLabel(cr[0]))}<span class="why-go">${t("Ver detalhes", "See details")} →</span></a>`);
    return `<div class="whys">${out.join("")}</div>`;
  }

  /* ------------------------- capítulo 2: quanto o brasileiro perdeu ------------------------- */
  const powerCard = () => MB.tsCard("p_poder", {
    title: t("R$ 100 de julho de 1994 ao longo do tempo", "R$ 100 from July 1994 over time"), sub: t("Quanto as mesmas notas compram a cada mês, descontada a inflação (IPCA)", "What the same notes buy each month, after inflation (IPCA)"),
    src: ["sgs:ipca"], ranges: ["5a", "10a", "20a", "tudo"], yFmt: (v) => "R$ " + F(v, 0), tipFmt: (v) => MB.brl(v), yMin: 0,
    series: () => [{ name: t("R$ 100 guardados", "R$ 100 kept"), color: C.real, area: true, data: MB.powerSeries() }],
    big: (S0) => `R$ 100 → <span class="neg">${MB.brl(S0[0].data.at(-1)[1])}</span>`,
  });
  function lossChapter() {
    const pw = MB.powerNow("1994-07"); if (!pw) return "";
    return `${insight(t(`Para comprar hoje o que R$ 100 compravam em julho de 1994, você precisa de <b>${MB.brl(100 / pw, 0)}</b>.`, `To buy today what R$ 100 bought in July 1994, you need <b>${MB.brl(100 / pw, 0)}</b>.`))}
      <div class="grid2">${powerCard()}${MB.salLongCard("home_sal")}</div>
      <div class="tools reveal">
        <button type="button" class="tool" data-tab-go="poder" data-anchor="poder-01"><b>${t("Máquina do tempo", "Time machine")}</b><span>${t("Quanto valia o seu dinheiro numa data — e quanto vale hoje", "What your money was worth on a date — and today")}</span></button>
        <button type="button" class="tool" data-tab-go="inflacao" data-anchor="inflacao-02"><b>${t("Comparar duas datas", "Compare two dates")}</b><span>${t("Quanto os preços subiram entre dois meses quaisquer", "How much prices rose between any two months")}</span></button>
        <button type="button" class="tool" data-tab-go="poder" data-anchor="poder-04"><b>${t("Meu salário ganhou da inflação?", "Did my salary beat inflation?")}</b><span>${t("Compare o que você ganhava com o que ganha hoje", "Compare what you earned with what you earn today")}</span></button>
      </div>`;
  }

  /* ------------------------- panorama e "o que mudou" ------------------------- */
  const KIND = { ipca12: () => ["monthly"], selic: () => ["daily"], usd: () => [MB.live.usdBrl ? "live" : "daily"], endiv: () => ["monthly"], dbgg: () => ["monthly"], btc: () => [MB.live.btcBrl ? "live" : "daily"] };
  function panorama() {
    const all = MB.kpiList(), L = ["ipca12", "selic", "usd", "endiv", "dbgg", "btc"].map((id) => all.find((k) => k.id === id)).filter(Boolean);
    return `<div class="kpis six reveal" id="kpis">${L.map((k) => `<a class="kpi" href="#/${k.tab}" data-tab-go="${k.tab}">
      <div class="k-top"><span class="k-l">${k.label}</span><span class="k-go">→</span></div>
      <div class="k-v"${k.live ? ` data-live="${k.live}"` : ""}>${k.value}</div>
      <div class="k-ch"><span class="${k.changeCls || "flat"}"${k.liveChg ? ` data-live="${k.liveChg}"` : ""}>${k.change || "&nbsp;"}</span></div>
      <div class="k-spark">${MB.spark(k.spark, k.color || C.btc)}</div>
      <div class="k-src"><span>${k.sub || ""}</span>${MB.kindBadges(KIND[k.id]())}</div></a>`).join("")}</div>`;
  }
  function changes() {
    const rows = [];
    const two = (arr) => (arr?.length > 1 ? [arr.at(-2), arr.at(-1)] : null);
    const add = (label, pair, fmt, unit = "", good) => { if (!pair) return; const [a, b] = pair, d = b[1] - a[1], cls = MB.sig(Math.abs(d) < 1e-9 ? 0 : d, good); rows.push(`<li><span class="ch-l">${label}</span><span class="ch-v"><b>${fmt(b[1])}${unit}</b> <small class="muted">${MB.perLabel(b[0])}</small></span><span class="ch-d ${cls}">${t("antes", "before")}: ${fmt(a[1])}${unit} <small>(${MB.perLabel(a[0])})</small></span></li>`); };
    add(t("Inflação do mês (IPCA)", "Monthly inflation (IPCA)"), two(MB.ser("ipca")), (v) => F(v, 2), "%", "down");
    add(t("Inflação em 12 meses", "12-month inflation"), two(MB.ipca12()), (v) => F(v, 2), "%", "down");
    const sd = MB.serD?.("selicMeta"); if (sd?.length) { const cur = sd.at(-1); let i = sd.length - 1; while (i > 0 && sd[i - 1][1] === cur[1]) i--; rows.push(`<li><span class="ch-l">${t("Selic (meta)", "Selic (target)")}</span><span class="ch-v"><b>${F(cur[1], 2)}%</b> <small class="muted">${MB.perLabel(cur[0])}</small></span><span class="ch-d flat">${i > 0 ? t(`mudou de ${F(sd[i - 1][1], 2)}% em ${MB.perLabel(sd[i][0])}`, `changed from ${F(sd[i - 1][1], 2)}% on ${MB.perLabel(sd[i][0])}`) : (() => { const m = MB.ser("selicMeta"); let j = m.length - 1; while (j > 0 && m[j - 1][1] === cur[1]) j--; return j > 0 ? t(`no mesmo nível desde ${MB.ymLabel(m[j][0])}`, `at the same level since ${MB.ymLabel(m[j][0])}`) : t("sem mudança recente", "no recent change"); })()}</span></li>`); }
    add(t("Dólar (PTAX)", "Dollar (PTAX)"), two(MB.serD?.("ptax")), (v) => MB.brl(v, 4), "", "down");
    add(t("Dívida das famílias / renda", "Household debt / income"), two(MB.ser("endiv")), (v) => F(v, 1), "%", "down");
    add(t("Dívida bruta do governo / PIB", "Government gross debt / GDP"), two(MB.ser("dbggPct")), (v) => F(v, 1), "%", "down");
    const up = MB.D.manifest?.updated;
    return `<article class="card changes reveal"><h3 class="c-title">${t("O que mudou na última divulgação", "What changed in the latest release")}</h3><p class="c-sub">${up ? t(`Coleta automática mais recente: ${new Date(up).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })} (horário de Brasília). Cada linha compara o dado mais novo com o anterior.`, `Latest automatic collection: ${new Date(up).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })} (Brasília time). Each row compares the newest figure with the previous one.`) : t("Cada linha compara o dado mais novo com o anterior.", "Each row compares the newest figure with the previous one.")}</p><ul class="chg">${rows.join("")}</ul><div class="c-foot">${MB.chips(["sgs:ipca", "sgs:selicMeta", "sgs:ptax", "sgs:endiv", "sgs:dbggPct"])}</div></article>`;
  }

  /* ------------------------- continue explorando ------------------------- */
  const paths = () => `<div class="paths reveal">
    <button type="button" class="path" data-tab-go="poder"><span class="p-k">${t("Seu dinheiro", "Your money")}</span><b>${t("Entenda seu dinheiro", "Understand your money")}</b><span>${t("Poder de compra, inflação, salário e calculadoras", "Purchasing power, inflation, wages and calculators")}</span></button>
    <button type="button" class="path" data-tab-go="juros"><span class="p-k">${t("Economia brasileira", "Brazil's economy")}</span><b>${t("Explore a economia brasileira", "Explore Brazil's economy")}</b><span>${t("Juros, crédito, famílias, dívida pública e Pix", "Rates, credit, households, public debt and Pix")}</span></button>
    <button type="button" class="path" data-tab-go="museu"><span class="p-k">${t("Explorar", "Explore")}</span><b>${t("Conheça a história do Real", "Discover the story of the Real")}</b><span>${t("Oito moedas, a hiperinflação e o confisco de 1990", "Eight currencies, hyperinflation and the 1990 freeze")}</span></button>
  </div>`;

  MB.tabs.painel = {
    render(panel) {
      const r5 = (() => { const s0 = startFor(5); const c = s0 && MB.compareFrom(s0, { real: true }); const v = c?.cash.at(-1)?.[1]; return v ? 100 - v : null; })();
      panel.innerHTML = `
        ${MB.sec("01", t("Por que esses dados importam?", "Why does this data matter?"), t("Três números resumem como a economia chega ao seu bolso: o preço das coisas, a renda e o custo das dívidas.", "Three numbers sum up how the economy reaches your pocket: prices, income and the cost of debt."), whyCards())}
        ${MB.sec("02", t("Quanto o brasileiro perdeu?", "How much have Brazilians lost?"), t("A inflação não aparece no extrato, mas aparece no carrinho do mercado. Veja o que aconteceu com o mesmo dinheiro ao longo dos anos.", "Inflation does not show on a bank statement, but it shows in the shopping cart. See what happened to the same money over the years."), lossChapter())}
        ${MB.sec("03", t("O que teria preservado o poder de compra?", "What would have preserved purchasing power?"), t("Só depois de medir a perda faz sentido comparar alternativas. Os valores abaixo já estão corrigidos pela inflação — escolha o período.", "Only after measuring the loss does it make sense to compare alternatives. The values below are already adjusted for inflation — pick the period."), `${r5 != null ? insight(t(`Em 5 anos, dinheiro parado perdeu <b>${F(r5, 0)}%</b> do poder de compra. Veja como outras formas de guardar se comportaram no mesmo período.`, `Over 5 years, idle cash lost <b>${F(r5, 0)}%</b> of its purchasing power. See how other ways of saving behaved over the same period.`)) : ""}${MB.shared.realCmp("home", { page: "painel", anchor: "painel-03" })}`)}
        ${MB.sec("04", t("Panorama de agora", "The picture right now"), t("Seis indicadores para acompanhar. Cada um leva à sua seção.", "Six indicators to follow. Each one leads to its section."), `${panorama()}${changes()}`)}
        ${MB.sec("05", t("Continue explorando", "Keep exploring"), "", paths())}`;
    },
  };
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

})();
