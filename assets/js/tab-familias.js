/* Aba FAMÍLIAS — endividamento, comprometimento da renda, inadimplência, crédito e trabalho. */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.famState = { income: 5000, debts: 1500 });
  const pctTile = (label, key, sub, opts, d = 1, unit = "%") => { const l = MB.last(key); return MB.tile(label, l[0] ? F(l[1], d) + unit : "—", (sub ? sub + " · " : "") + (l[0] ? MB.ymLabel(l[0]) : ""), opts); };

  function tiles() {
    return `<div class="tiles4 reveal">
      ${pctTile(t("Dívida das famílias", "Household debt"), "endiv", t("da renda de um ano", "of a year's income"), { best: true })}
      ${pctTile(t("Renda comprometida com dívidas", "Income committed to debt"), "comprom", t("juros + parcelas", "interest + instalments"))}
      ${pctTile(t("Atraso — pessoas físicas", "Arrears — individuals"), "inadPF", t("carteira com mais de 90 dias de atraso", "portfolio more than 90 days overdue"))}
      ${pctTile(t("Desemprego", "Unemployment"), "desemprego", "PNAD Contínua")}</div>`;
  }
  const lineBy = (arr) => arr.map(([k, n, col, o]) => ({ name: n, color: col, data: MB.ser(k), ...(o || {}) }));
  const endivCard = () => MB.tsCard("fam_endiv", {
    title: t("Endividamento das famílias", "Household indebtedness"), sub: t("Saldo das dívidas ÷ renda acumulada em 12 meses", "Debt balance ÷ income accumulated over 12 months"), src: ["sgs:endiv", "sgs:endivExHab"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => lineBy([["endiv", t("Total", "Total"), C.pink, { area: true }], ["endivExHab", t("Sem imobiliário", "Excluding mortgages"), C.cdi]]), big: (S0) => `${F(S0[0].data.at(-1)[1], 1)}% <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });
  const promCard = () => MB.tsCard("fam_comprom", {
    title: t("Quanto da renda vai para pagar dívidas", "How much income goes to paying debts"), sub: t("Juros + amortizações em relação à renda mensal (série dessazonalizada)", "Interest + principal relative to monthly income (seasonally adjusted)"), src: ["sgs:comprom", "sgs:compromEx", "sgs:compromJur", "sgs:compromAmo"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => lineBy([["comprom", t("Total", "Total"), C.btc, { width: 2.8, area: true }], ["compromEx", t("Sem imobiliário", "Excluding mortgages"), C.amber], ["compromJur", t("Só juros", "Interest only"), C.real], ["compromAmo", t("Só amortização", "Principal only"), C.usd]]), big: (S0) => `${F(S0[0].data.at(-1)[1], 1)}% <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });
  const inadCard = () => MB.tsCard("fam_inad", {
    title: t("Inadimplência do crédito", "Credit default rates"), sub: t("Atrasos acima de 90 dias sobre a carteira", "Arrears over 90 days on the portfolio"), src: ["sgs:inadPF", "sgs:inadPJ", "sgs:inadTotal"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => lineBy([["inadPF", t("Pessoas físicas", "Individuals"), C.pink, { width: 2.6 }], ["inadPJ", t("Empresas", "Companies"), C.real], ["inadTotal", t("Total", "Total"), C.ref, { dashed: true }]]),
  });
  const credCard = () => MB.tsCard("fam_cred", {
    title: t("Saldo de crédito no país", "Credit balance in the country"), sub: t("Famílias e empresas, em R$ trilhões", "Households and companies, in R$ trillion"), src: ["sgs:credPF", "sgs:credPJ"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => "R$ " + F(v, 1) + (MB.lang === "pt" ? " tri" : " T"), tipFmt: (v) => "R$ " + F(v, 2) + (MB.lang === "pt" ? " tri" : " T"),
    series: () => [["credPF", t("Pessoas físicas", "Individuals"), C.pink], ["credPJ", t("Empresas", "Companies"), C.real]].map(([k, n, col]) => ({ name: n, color: col, data: MB.ser(k).map(([m, v]) => [m, v / 1e6]) })),
    extra: (o) => o.series.forEach((s) => { s.stack = "cred"; s.areaStyle = { color: s.lineStyle.color, opacity: 0.5 }; s.lineStyle.width = 1.2; }),
  });
  const jobCard = () => MB.tsCard("fam_job", {
    title: t("Desocupação (PNAD Contínua)", "Unemployment (continuous household survey)"), sub: t("Trimestre móvel, % da força de trabalho", "Rolling quarter, % of the labour force"), src: ["sgs:desemprego"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 1) + "%",
    series: () => lineBy([["desemprego", t("Taxa de desocupação", "Unemployment rate"), C.usd, { area: true }]]), big: (S0) => `${F(S0[0].data.at(-1)[1], 1)}% <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });
  const ibcCard = () => MB.tsCard("fam_ibc", {
    title: t("Atividade econômica (IBC-Br)", "Economic activity (IBC-Br)"), sub: t("Índice dessazonalizado, termômetro mensal do PIB", "Seasonally adjusted index, monthly GDP gauge"), src: ["sgs:ibcbr"], ranges: ["5a", "10a", "tudo"], defRange: "10a", range: "10a", yFmt: (v) => F(v, 0), tipFmt: (v) => F(v, 1),
    series: () => lineBy([["ibcbr", "IBC-Br", C.real, { area: true }]]),
  });

  /* ------------------------- orçamento ------------------------- */
  function budgetHTML() {
    return `<div class="card"><h3 class="c-title">${t("Quanto da sua renda vai para dívidas?", "How much of your income goes to debt?")}</h3><p class="c-sub">${t("Some as parcelas mensais de financiamentos, empréstimos, cartão e consórcios.", "Add up monthly instalments of loans, financing, cards and consortia.")}</p>
      <div class="calc" id="bud" style="margin-top:14px"><div class="calc-in">
        <label>${t("Renda mensal líquida (R$)", "Net monthly income (R$)")}<div class="in-prefix"><span>R$</span><input id="bdInc" inputmode="decimal" value="${F(st.income, 2)}"></div></label>
        <label>${t("Parcelas de dívidas por mês (R$)", "Monthly debt payments (R$)")}<div class="in-prefix"><span>R$</span><input id="bdDebt" inputmode="decimal" value="${F(st.debts, 2)}"></div></label></div>
        <div class="calc-out" id="bdOut"></div></div></div>`;
  }
  function budgetUpdate(root) {
    const inc = MB.parseNum(root.querySelector("#bdInc").value) || 0, debt = MB.parseNum(root.querySelector("#bdDebt").value) || 0; st.income = inc; st.debts = debt;
    const out = root.querySelector("#bdOut"); if (inc <= 0) { out.innerHTML = `<div class="out-big"><div class="l">${t("Informe a renda.", "Enter your income.")}</div></div>`; return; }
    const r = (debt / inc) * 100, nat = MB.last("comprom")[1], lvl = r <= 30 ? ["pos", t("confortável pela regra prática", "comfortable by the rule of thumb")] : r <= 50 ? ["", t("atenção: pouco espaço para imprevistos", "caution: little room for surprises")] : ["neg", t("alto risco: a maior parte da renda já está comprometida", "high risk: most of your income is already committed")];
    out.innerHTML = `<div class="out-big"><div class="l">${t("Renda comprometida", "Income committed")}</div><div class="v ${lvl[0]}">${F(r, 1)}%</div><div class="s">${lvl[1]}</div><div class="meter"><div style="width:${Math.min(100, r)}%;${r > 50 ? "background:linear-gradient(90deg,#b25f00,#cc080c)" : ""}"></div></div></div>
      <div class="out-row"><div><div class="l">${t("Sobra por mês", "Left each month")}</div><div class="v">${MB.brl(Math.max(0, inc - debt), 0)}</div></div><div><div class="l">${t("Média nacional (BC)", "National average (BCB)")}</div><div class="v">${nat != null ? F(nat, 1) + "%" : "—"}</div></div><div><div class="l">${t("Trabalha só para dívidas", "Works for debt")}</div><div class="v">${F((r / 100) * 22, 1)} ${t("dias/mês", "days/mo")}</div></div></div>
      <p class="note">${t("Regra prática (não é norma oficial): até 30% da renda em parcelas costuma ser considerado confortável. A média nacional do Banco Central mede juros + amortizações de todas as dívidas das famílias sobre a renda agregada.", "Rule of thumb (not an official standard): up to 30% of income in instalments is usually considered comfortable. The central bank's national average measures interest + principal on all household debt relative to aggregate income.")}</p>`;
  }

  MB.tabs.familias = {
    render(panel) {
      panel.innerHTML = `${tiles()}
        ${MB.sec("01", t("Dívida e renda", "Debt and income"), t("O Banco Central mede quanto as famílias devem em relação ao que ganham em um ano e quanto da renda do mês vai para juros e parcelas.", "The central bank measures how much households owe relative to a year's earnings and how much of monthly income goes to interest and instalments."), `<div class="grid2">${endivCard()}${promCard()}</div>`)}
        ${MB.sec("02", t("Atrasos e trabalho", "Arrears and work"), t("Quando a conta não fecha, a dívida vira atraso. E a renda vem do trabalho.", "When the budget does not add up, debt turns into arrears. And income comes from work."), `<div class="grid2">${inadCard()}${jobCard()}</div>`)}
        ${MB.sec("03", t("Seu orçamento", "Your budget"), t("Uma conta rápida para colocar a sua realidade ao lado da média do país.", "A quick calculation to put your reality next to the national average."), budgetHTML())}
        ${MB.more("fam_more", t("Ver mais dados: crédito e atividade econômica", "See more data: credit and economic activity"), () => `<div class="grid2">${credCard()}${ibcCard()}</div>`, { hint: t("crédito às famílias e IBC-Br", "household credit and IBC-Br") })}`;
    },
    after(panel) { const b = panel.querySelector("#bud"); if (b) { b.addEventListener("input", () => budgetUpdate(b)); budgetUpdate(b); } },
  };
})();
