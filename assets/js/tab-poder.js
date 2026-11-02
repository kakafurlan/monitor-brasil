/* Aba PODER DE COMPRA — máquina do tempo, correção por ano, dólar, salário mínimo, oferta de moeda. */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.poderState = { ym: null, amt: 1000, sal: "real", proj: { amt: 10000, years: 10, infl: null }, wage: { a: 3000, ym: null, b: 3500 } });
  const START = "1994-07";

  /* ------------------------- cartões reutilizáveis ------------------------- */
  /** salário mínimo desde 1940, em poder de compra de hoje (Ipeadata + IPCA/IGP-DI) — também usado no museu */
  MB.salLongCard = (id) => MB.tsCard(id, {
    title: t("Salário mínimo desde 1940, em reais de hoje", "Minimum wage since 1940, in today's reais"), sub: t("Valor nominal de cada mês corrigido pelo IGP-DI (até 1979) e IPCA (desde 1980)", "Each month's nominal value adjusted by IGP-DI (to 1979) and IPCA (from 1980)"),
    src: ["ipea", "sgs:ipca"], ranges: ["20a", "30a", "tudo"], defRange: "tudo", range: "tudo", yMin: 0, yFmt: (v) => "R$ " + F(v, 0), tipFmt: (v) => MB.brl(v, 0),
    series: () => [{ name: t("Salário mínimo (reais de hoje)", "Minimum wage (today's reais)"), color: C.usd, area: true, data: MB.salMinReal() }],
    big: (S0) => { const d = S0[0].data, mx = d.reduce((a, b) => (b[1] > a[1] ? b : a)); return `${MB.brl(d.at(-1)[1], 0)} <small class="muted">${t("hoje", "now")} · ${t("pico", "peak")} ${MB.brl(mx[1], 0)} (${MB.ymLabel(mx[0])})</small>`; },
  });

  /* ------------------------- máquina do tempo ------------------------- */
  const months = () => MB.monthsBetween(START, MB.nowYm());
  function tmHTML() {
    const N = months(), ym = st.ym || MB.ymAdd(MB.nowYm(), -120), v = MB.monthsBetween(START, ym);
    const presets = [[START, t("Plano Real", "Real Plan")], ["2002-01", "2002"], ["2010-01", "2010"], ["2015-01", "2015"], ["2020-01", "2020"], [MB.ymAdd(MB.nowYm(), -12), t("1 ano atrás", "1 year ago")]];
    return `<div class="card timemachine" id="tm">
      <div>
        <div class="tm-label"><span>${t("Voltar para", "Go back to")}</span><b id="tmDate">${MB.ymLabel(ym)}</b></div>
        <input type="range" id="tmRange" min="0" max="${N}" value="${v}" aria-label="${t("Mês de origem", "Origin month")}">
        <div class="tm-axis mono"><span>${MB.ymLabel(START)}</span><span>${t("hoje", "today")}</span></div>
        <div class="presets" style="margin:10px 0">${presets.map(([p, l]) => `<button type="button" data-p="${p}">${l}</button>`).join("")}</div>
        <div class="calc-in"><label>${t("Valor naquela época (R$)", "Amount back then (R$)")}<div class="in-prefix"><span>R$</span><input id="tmAmt" inputmode="decimal" value="${F(st.amt, 2)}"></div></label></div>
        <div class="note-stage"><div class="banknote ghost"><span id="tmThen"></span></div><div class="banknote solid" id="tmNote" style="--k:1"><span id="tmNow"></span></div></div>
      </div>
      <div class="tm-right" id="tmOut"></div></div>`;
  }
  function tmUpdate(root) {
    const ym = st.ym, amt = st.amt, pw = MB.powerNow(ym), fac = MB.factorNow(ym), out = root.querySelector("#tmOut");
    if (pw == null || !amt) { out.innerHTML = `<div class="tm-stat"><div class="s">${t("Sem dados de inflação ainda.", "No inflation data yet.")}</div></div>`; return; }
    const prev = MB.ymAdd(ym, -1), months = MB.monthsBetween(prev, MB.idx().last), cag = MB.cagr(fac, months);
    const usd = MB.mapOf(MB.ptaxM()), u0 = usd.get(prev), u1 = MB.usdBrl();
    const btc = MB.mapOf(MB.btcM()), b0 = btc.get(prev), b1 = MB.btcNow();
    const cdi = MB.cdiIdx(), cl = [...cdi.keys()].at(-1), c0 = cdi.get(prev), c1 = cdi.get(cl);
    root.querySelector("#tmDate").textContent = MB.ymLabel(ym);
    root.querySelector("#tmNote").style.setProperty("--k", Math.max(0.13, Math.min(1, pw)).toFixed(3));
    root.querySelector("#tmNow").textContent = MB.brl(amt * pw, amt * pw < 100 ? 2 : 0);
    root.querySelector("#tmThen").textContent = t("então · ", "then · ") + MB.brl(amt, 0);
    const line = (l, v, s, big) => `<div class="tm-stat${big ? " big" : ""}"><div class="l">${l}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ""}</div>`;
    out.innerHTML = line(t(`${MB.brl(amt, 0)} de ${MB.ymLabel(ym)} valem hoje`, `${MB.brl(amt, 0)} from ${MB.ymLabel(ym)} is worth today`), MB.brl(amt * pw, 2), t(`Perda de ${F((1 - pw) * 100, 1)}% do poder de compra`, `${F((1 - pw) * 100, 1)}% of purchasing power lost`), true) +
      line(t("Para comprar hoje o mesmo que comprava então", "To buy today what it bought then"), MB.brl(amt * fac, 2), t(`Inflação acumulada de ${F((fac - 1) * 100, 0)}% · média de ${F(cag, 2)}% ao ano`, `Cumulative inflation of ${F((fac - 1) * 100, 0)}% · average ${F(cag, 2)}% a year`)) +
      (u0 && u1 ? line(t("Em dólares", "In US dollars"), `US$ ${F(amt / u0, 0)} → US$ ${F(amt / u1, 0)}`, t(`o dólar foi de ${MB.brl(u0, 2)} para ${MB.brl(u1, 2)}: ${F((u1 / u0 - 1) * 100, 0)}% mais caro`, `the dollar went from ${MB.brl(u0, 2)} to ${MB.brl(u1, 2)}: ${F((u1 / u0 - 1) * 100, 0)}% pricier`)) : "") +
      (c0 && c1 ? line(t("Se estivesse no CDI", "If it had been in the CDI"), MB.brl((amt * c1) / c0, 0), t(`${F((c1 / c0 / fac - 1) * 100, 0)}% de ganho real sobre a inflação`, `${F((c1 / c0 / fac - 1) * 100, 0)}% real gain over inflation`)) : "") +
      (b0 && b1 ? line(t("Se tivesse sido Bitcoin", "If it had been Bitcoin"), MB.brl((amt * b1) / b0, 0), t(`${F(((b1 / b0) * amt) / (amt * fac), 1)}× o necessário para empatar com a inflação · ${F(((amt / b0) * 1e8) / 1e6, 1)} milhões de sats comprados`, `${F(((b1 / b0) * amt) / (amt * fac), 1)}× what is needed to match inflation · ${F(((amt / b0) * 1e8) / 1e6, 1)} million sats bought`)) : line(t("Se tivesse sido Bitcoin", "If it had been Bitcoin"), "—", t("O Bitcoin ainda não existia (primeiros preços em 2010).", "Bitcoin did not exist yet (first prices in 2010).")));
  }

  /* ------------------------- gráficos ------------------------- */
  const needCard = () => MB.card("poder_need", {
    title: t("Quantos reais de hoje equivalem a R$ 100 de cada ano", "How many of today's reais equal R$ 100 of each year"), sub: t("Valor corrigido pelo IPCA do início do ano de origem até hoje", "Value adjusted by IPCA from the start of the origin year to today"), src: ["sgs:ipca"], height: 340,
    build() {
      const I = MB.idx(); if (!I.first) return null;
      const yrs = []; for (let y = 1995; y <= +I.last.slice(0, 4); y++) yrs.push(y);
      const data = yrs.map((y) => [String(y), 100 * (MB.factorNow(y + "-01") || 0)]).filter((x) => x[1] > 0);
      const o = MB.baseOption({ yFmt: (v) => "R$ " + F(v, 0) }); o.legend.show = false;
      o.xAxis = { type: "category", data: data.map((x) => x[0]), axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, axisLabel: { color: C.axis, fontSize: 11, interval: 2, fontFamily: "'IBM Plex Mono', monospace" } };
      o.tooltip = { trigger: "axis", backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, valueFormatter: (v) => MB.brl(v, 0) };
      o.series = [{ type: "bar", data: data.map((x) => x[1]), barMaxWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0], color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: C.btc }, { offset: 1, color: "#7b3a00" }] } } }];
      return { option: o, big: t("R$ 100 de 1995 precisam virar ", "R$ 100 of 1995 must become ") + `<span class="neg">${MB.brl(data[0][1], 0)}</span>`, table: { cols: [t("Ano de origem", "Origin year"), t("Equivalente hoje", "Equivalent today")], rows: data.map((x) => [x[0], MB.brl(x[1], 2)]) } };
    },
  });
  const usdCard = () => MB.tsCard("poder_usd", {
    title: t("Quantos reais custa 1 dólar", "How many reais one US dollar costs"), sub: t("PTAX de venda, fim de cada mês", "PTAX selling rate, month-end"), src: ["sgs:ptax", "fx"], ranges: ["5a", "10a", "20a", "tudo"], yMin: 0, yFmt: (v) => "R$ " + F(v, 2), tipFmt: (v) => MB.brl(v, 4),
    series: () => { const p = MB.ptaxModern().slice(); const u = MB.live.usdBrl; if (u && p.length && p.at(-1)[0] === MB.nowYm()) p[p.length - 1] = [p.at(-1)[0], u]; return [{ name: "USD/BRL", color: C.usd, area: true, data: p }]; },
    big: (S0) => MB.brl(MB.usdBrl(), 4),
  });
  const realUsdCard = () => MB.tsCard("poder_realusd", {
    title: t("Quanto vale R$ 1 em dólares", "What R$ 1 is worth in US dollars"), sub: t("Inverso do câmbio — o Real começou valendo cerca de US$ 1", "Inverse of the exchange rate — the Real started worth about US$ 1"), src: ["sgs:ptax"], ranges: ["10a", "20a", "tudo"], defRange: "tudo", range: "tudo", yMin: 0, yFmt: (v) => "US$ " + F(v, 2), tipFmt: (v) => "US$ " + F(v, 3),
    series: () => [{ name: t("US$ por R$ 1", "US$ per R$ 1"), color: C.real, area: true, data: MB.ptaxModern().map(([m, v]) => [m, 1 / v]) }],
    big: (S0) => { const d = S0[0].data; return `US$ ${F(d.at(-1)[1], 3)} <small class="muted">${t("perda de", "lost")} ${F((1 - d.at(-1)[1] / d[0][1]) * 100, 0)}% ${t("desde", "since")} ${MB.ymLabel(d[0][0])}</small>`; },
  });
  /* salário mínimo: modos */
  const salModes = () => [["nom", t("Nominal (R$)", "Nominal (R$)")], ["real", t("Reais de hoje", "Today's reais")], ["usd", "US$"], ["sats", "sats"]];
  const salCtrl = () => `<div class="c-ctrl">${salModes().map(([k, l]) => `<button type="button" data-sal="${k}" aria-pressed="${st.sal === k}">${l}</button>`).join("")}</div>`;
  const salCard = () => MB.tsCard("poder_sal", {
    title: t("Salário mínimo: quanto ele compra?", "Minimum wage: what does it buy?"), sub: t("Valor mensal vigente (SGS 1619) em quatro unidades", "Monthly statutory value (SGS 1619) in four units"), src: ["sgs:salMin", "sgs:ipca", "btc"], ranges: ["10a", "20a", "tudo"], defRange: "tudo", range: "tudo", ctrl: salCtrl,
    onClick(e, el) { const b = e.target.closest("[data-sal]"); if (!b) return; st.sal = b.dataset.sal; el.querySelector("[data-ctrl]").innerHTML = salCtrl(); el._render(); },
    yFmt: (v) => (st.sal === "usd" ? "US$ " + F(v, 0) : st.sal === "sats" ? MB.compact(v, "", 1) : "R$ " + F(v, 0)), tipFmt: (v) => (st.sal === "usd" ? "US$ " + F(v, 2) : st.sal === "sats" ? F(v, 0) + " sats" : MB.brl(v, 2)),
    series: () => {
      const w = MB.ser("salMin").filter((p) => p[0] >= START), now = MB.Pnow(); let d = w, color = C.usd, name = t("Salário mínimo", "Minimum wage");
      if (st.sal === "real") { d = w.map(([m, v]) => (MB.P(m) ? [m, (v * now) / MB.P(m)] : null)).filter(Boolean); name = t("Em reais de hoje", "In today's reais"); color = C.real; }
      if (st.sal === "usd") { const u = MB.mapOf(MB.ptaxM()); d = w.map(([m, v]) => (u.get(m) ? [m, v / u.get(m)] : null)).filter(Boolean); name = "US$"; color = C.cdi; }
      if (st.sal === "sats") { const b = MB.mapOf(MB.btcM()); d = w.map(([m, v]) => (b.get(m) ? [m, (v / b.get(m)) * 1e8] : null)).filter(Boolean); name = "sats"; color = C.btc; }
      return [{ name, color, area: true, data: d }];
    },
    big: (S0) => { const l = S0[0].data.at(-1); return `${st.sal === "usd" ? "US$ " + F(l[1], 0) : st.sal === "sats" ? F(l[1], 0) + " sats" : MB.brl(l[1], 0)} <small class="muted">${MB.ymLabel(l[0])}</small>`; },
  });
  const m2Card = () => MB.tsCard("poder_m2", {
    title: t("Quanto o dinheiro é criado: M2 × inflação × Bitcoin", "How fast money is created: M2 vs inflation vs Bitcoin"), sub: t("Crescimento anual dos meios de pagamento amplos (M2), do IPCA e da oferta de bitcoins pelo calendário do protocolo", "Annual growth of broad money (M2), IPCA and Bitcoin's supply per the protocol schedule"), src: ["sgs:m2", "sgs:ipca"], ranges: ["10a", "20a", "tudo"], defRange: "20a", range: "20a", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => {
      const m2 = MB.ser("m2"), yoy = []; for (let i = 12; i < m2.length; i++) yoy.push([m2[i][0], (m2[i][1] / m2[i - 12][1] - 1) * 100]);
      const keys = yoy.map((p) => p[0]).filter((k) => k >= "2014-01"), btc = keys.map((k) => { const ms = MB.ymMs(k); return [k, (MB.btcSupply(ms) / MB.btcSupply(ms - 365 * 864e5) - 1) * 100]; });
      return [{ name: t("M2 (reais em circulação)", "M2 (reais in circulation)"), color: C.real, data: yoy }, { name: "IPCA 12m", color: C.amber, data: MB.ipca12(), dashed: true }, { name: t("Oferta de Bitcoin", "Bitcoin supply"), color: C.btc, data: btc, width: 2.6 }];
    },
    big: (S0) => S0.map((s) => `<span style="color:${s.color}">${s.name.split(" (")[0]}: ${F(s.data.at(-1)[1], 1)}%</span>`).join(" &nbsp; "),
  });

  /* ------------------------- calculadoras ------------------------- */
  function projHTML() {
    const f = MB.D.focus?.inds?.IPCA, defInfl = st.proj.infl ?? (f?.at(-1)?.med ?? 4.5);
    return `<div class="card"><h3 class="c-title">${t("Quanto valerá o seu dinheiro no futuro?", "What will your money be worth in the future?")}</h3><p class="c-sub">${t("Projeção simples com uma inflação média anual que você escolhe (o padrão é a expectativa do Focus para o último ano disponível).", "A simple projection with an average annual inflation you choose (default is the Focus forecast for the farthest year available).")}</p>
      <div class="calc" id="proj" style="margin-top:14px"><div class="calc-in">
        <label>${t("Valor hoje (R$)", "Amount today (R$)")}<div class="in-prefix"><span>R$</span><input id="pjAmt" inputmode="decimal" value="${F(st.proj.amt, 2)}"></div></label>
        <label>${t("Prazo", "Horizon")}: <b id="pjYLbl" style="color:#fff">${st.proj.years} ${t("anos", "years")}</b><input id="pjYears" type="range" min="1" max="40" value="${st.proj.years}"></label>
        <label>${t("Inflação média anual", "Average annual inflation")}: <b id="pjILbl" style="color:#fff">${F(defInfl, 1)}%</b><input id="pjInfl" type="range" min="0" max="20" step="0.1" value="${defInfl}"></label></div>
        <div class="calc-out" id="pjOut"></div></div></div>`;
  }
  function projUpdate(root) {
    const infl = +root.querySelector("#pjInfl").value, yrs = +root.querySelector("#pjYears").value, amt = MB.parseNum(root.querySelector("#pjAmt").value) || 0;
    st.proj = { amt, years: yrs, infl }; const fac = Math.pow(1 + infl / 100, yrs);
    root.querySelector("#pjYLbl").textContent = `${yrs} ${t("anos", "years")}`; root.querySelector("#pjILbl").textContent = F(infl, 1) + "%";
    root.querySelector("#pjOut").innerHTML = `<div class="out-big"><div class="l">${t(`${MB.brl(amt, 0)} parados daqui a ${yrs} anos terão o poder de compra de`, `${MB.brl(amt, 0)} sitting idle in ${yrs} years will buy what this buys today:`)}</div><div class="v">${MB.brl(amt / fac, 2)}</div><div class="s">${t(`Perda de ${F((1 - 1 / fac) * 100, 1)}% do poder de compra`, `${F((1 - 1 / fac) * 100, 1)}% purchasing power lost`)}</div></div>
      <div class="out-row"><div><div class="l">${t("Para manter o poder de compra", "To keep purchasing power")}</div><div class="v">${MB.brl(amt * fac, 0)}</div></div><div><div class="l">${t("Preços sobem", "Prices rise")}</div><div class="v">${F((fac - 1) * 100, 0)}%</div></div><div><div class="l">${t("Dobram em", "Double in")}</div><div class="v">${infl > 0 ? F(Math.log(2) / Math.log(1 + infl / 100), 1) + t(" anos", " yrs") : "—"}</div></div></div>`;
  }
  function wageHTML() {
    const ym = st.wage.ym || MB.ymAdd(MB.nowYm(), -36);
    return `<div class="card"><h3 class="c-title">${t("Meu salário ganhou da inflação?", "Did my salary beat inflation?")}</h3><p class="c-sub">${t("Compare o que você ganhava com o que ganha hoje, em poder de compra.", "Compare what you earned then with what you earn now, in purchasing power.")}</p>
      <div class="calc" id="wage" style="margin-top:14px"><div class="calc-in">
        <label>${t("Quando você ganhava", "When you earned")}<input id="wgYm" type="month" value="${ym}" min="${START}" max="${MB.nowYm()}"></label>
        <label>${t("Salário naquela época (R$)", "Salary back then (R$)")}<div class="in-prefix"><span>R$</span><input id="wgA" inputmode="decimal" value="${F(st.wage.a, 2)}"></div></label>
        <label>${t("Salário hoje (R$)", "Salary today (R$)")}<div class="in-prefix"><span>R$</span><input id="wgB" inputmode="decimal" value="${F(st.wage.b, 2)}"></div></label></div>
        <div class="calc-out" id="wgOut"></div></div></div>`;
  }
  function wageUpdate(root) {
    const ym = root.querySelector("#wgYm").value, a = MB.parseNum(root.querySelector("#wgA").value), b = MB.parseNum(root.querySelector("#wgB").value);
    st.wage = { ym, a, b }; const out = root.querySelector("#wgOut"), fac = MB.factorNow(ym);
    if (!fac || !a || !b) { out.innerHTML = `<div class="out-big"><div class="l">${t("Escolha um mês a partir de jul/1994 e informe os dois salários.", "Pick a month from Jul/1994 and enter both salaries.")}</div></div>`; return; }
    const need = a * fac, gain = (b / need - 1) * 100;
    out.innerHTML = `<div class="out-big"><div class="l">${t("Seu salário de então, em reais de hoje", "Your old salary, in today's reais")}</div><div class="v">${MB.brl(need, 2)}</div><div class="s">${gain >= 0 ? t(`Você hoje ganha <b class="pos">${F(gain, 1)}% a mais</b> em poder de compra`, `You now earn <b class="pos">${F(gain, 1)}% more</b> in purchasing power`) : t(`Você hoje ganha <b class="neg">${F(-gain, 1)}% a menos</b> em poder de compra`, `You now earn <b class="neg">${F(-gain, 1)}% less</b> in purchasing power`)}</div></div>
      <div class="out-row"><div><div class="l">${t("Inflação no período", "Inflation over the period")}</div><div class="v">${F((fac - 1) * 100, 1)}%</div></div><div><div class="l">${t("Seu reajuste nominal", "Your nominal raise")}</div><div class="v">${F((b / a - 1) * 100, 1)}%</div></div><div><div class="l">${t("Falta/sobra por mês", "Gap per month")}</div><div class="v ${gain >= 0 ? "pos" : "neg"}">${MB.brl(b - need, 0)}</div></div></div>`;
  }

  const p100Card = () => MB.tsCard("poder_100", { title: t("Quanto valem hoje R$ 100 de julho de 1994", "What R$ 100 from July 1994 is worth today"), sub: t("Poder de compra, descontado o IPCA", "Purchasing power, discounted by IPCA"), src: ["sgs:ipca"], ranges: ["10a", "20a", "tudo"], defRange: "tudo", range: "tudo", yMin: 0, yFmt: (v) => "R$ " + F(v, 0), tipFmt: (v) => MB.brl(v), series: () => [{ name: t("R$ 100 guardados", "R$ 100 kept"), color: C.real, area: true, data: MB.powerSeries() }], big: (S0) => `R$ 100 → <span class="neg">${MB.brl(S0[0].data.at(-1)[1])}</span>` });
  MB.tabs.poder = {
    render(panel) {
      panel.innerHTML = `
        ${MB.sec("01", t("Máquina do tempo", "Time machine"), t("Escolha uma data e veja quanto o seu dinheiro valia naquela época — e o que aconteceu com ele.", "Pick a date and see what your money was worth back then — and what happened to it."), tmHTML())}
        ${MB.sec("02", t("A conta da corrosão", "The erosion math"), t("Quanto você precisa ter hoje para repor o poder de compra de R$ 100 de cada ano.", "How much you need today to restore the purchasing power of R$ 100 from each year."), `<div class="grid2">${needCard()}${p100Card()}</div>`)}
        ${MB.sec("03", t("Salário mínimo", "Minimum wage"), t("O piso nacional, em reais de hoje, desde 1940.", "The national wage floor, in today's reais, since 1940."), MB.salLongCard("poder_sallong"))}
        ${MB.sec("04", t("Calculadoras", "Calculators"), t("Faça a conta com a sua realidade.", "Run the numbers with your own situation."), `<div class="grid2">${projHTML()}${wageHTML()}</div>`)}
        ${MB.more("poder_more", t("Ver mais dados", "See more data"), () => `<p class="more-h">${t("O Real frente ao dólar", "The Real against the dollar")}</p><div class="grid2">${usdCard()}${realUsdCard()}</div><p class="more-h">${t("Salário mínimo em reais, dólares e satoshis", "Minimum wage in reais, dollars and satoshis")}</p>${salCard()}<p class="more-h">${t("Mais reais, menos valor", "More reais, less value")}</p>${m2Card()}`, { hint: t("dólar, salário em dólares e sats, oferta de moeda", "dollar, wage in dollars and sats, money supply") })}
        <p class="disclaimer">${t("Convenção: valor no início do mês de origem, corrigido até o último mês divulgado pelo IBGE (IPCA; antes de 1980, IGP-DI). Simulações são hipotéticas e não são recomendação de investimento.", "Convention: value at the start of the origin month, adjusted to the latest month published by IBGE (IPCA; IGP-DI before 1980). Simulations are hypothetical and not investment advice.")}</p>`;
    },
    after(panel) {
      if (!st.ym) st.ym = MB.ymAdd(MB.nowYm(), -120);
      const tm = panel.querySelector("#tm");
      if (tm) {
        const rng = tm.querySelector("#tmRange"), amt = tm.querySelector("#tmAmt");
        const setYm = (ym) => { st.ym = ym; rng.value = MB.monthsBetween(START, ym); tmUpdate(tm); };
        rng.addEventListener("input", () => setYm(MB.ymAdd(START, +rng.value)));
        amt.addEventListener("input", () => { st.amt = MB.parseNum(amt.value) || 0; tmUpdate(tm); });
        amt.addEventListener("blur", () => { amt.value = F(st.amt, 2); });
        tm.querySelector(".presets").addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) setYm(b.dataset.p); });
        tmUpdate(tm);
      }
      const pj = panel.querySelector("#proj"); if (pj) { pj.addEventListener("input", () => projUpdate(pj)); projUpdate(pj); }
      const wg = panel.querySelector("#wage"); if (wg) { wg.addEventListener("input", () => wageUpdate(wg)); wageUpdate(wg); }
    },
  };
})();
