/* Aba JUROS E CRÉDITO — Selic, juro real, custo do crédito, cartão, ranking por banco e simulador do rotativo. */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.jurosState = { log: true, mod: null, cc: { debt: 5000, pay: 300, rate: null, cap: true } });

  /* Selic meta ao fim de cada mês (a série do BC guarda só as mudanças) */
  MB.selicM = () => MB.memo("selicM", () => {
    const a = MB.ser("selicMeta"); if (!a.length) return [];
    const out = []; let j = 0, cur = null;
    for (let ym = a[0][0].slice(0, 7); ym <= MB.nowYm(); ym = MB.ymAdd(ym, 1)) { while (j < a.length && a[j][0] <= ym + "-31") { cur = a[j][1]; j++; } if (cur != null) out.push([ym, cur]); }
    return out;
  });
  const realRate = () => { const i = MB.mapOf(MB.ipca12()); return MB.selicM().filter(([ym]) => i.has(ym) && ym >= "2002-01").map(([ym, s]) => [ym, ((1 + s / 100) / (1 + i.get(ym) / 100) - 1) * 100]); };
  const monthly = (a) => (Math.pow(1 + a / 100, 1 / 12) - 1) * 100;

  /* ------------------------- 01 · números do dia ------------------------- */
  function tiles() {
    const selic = MB.lastD("selicMeta")[1] ?? MB.last("selicMeta")[1];
    const L = (k) => MB.last(k), v = (k, d = 0) => (L(k)[0] ? F(L(k)[1], d) + "% a.a." : "—"), ref = (k) => (L(k)[0] ? MB.ymLabel(L(k)[0]) : "");
    return `<div class="tiles4 reveal">
      ${MB.tile(t("Juro básico (Selic)", "Base rate (Selic)"), selic != null ? F(selic, 2) + "% a.a." : "—", t("definido pelo Banco Central; guia todos os outros juros", "set by the central bank; guides every other rate"))}
      ${MB.tile(t("Cartão — rotativo", "Card — revolving"), v("jurosCartRot"), ref("jurosCartRot") + " · " + t("média das pessoas físicas", "individuals' average"), { best: true })}
      ${MB.tile(t("Cheque especial", "Overdraft"), v("jurosCheque"), ref("jurosCheque"))}
      ${MB.tile(t("Empréstimo pessoal", "Personal loan"), v("jurosPessoal"), ref("jurosPessoal"))}</div>`;
  }

  /* ------------------------- 02 · Selic ------------------------- */
  const selicCard = () => MB.tsCard("juros_selic", {
    title: t("Selic: a meta do Copom", "Selic: the Copom target"), sub: t("Taxa básica de juros definida a cada reunião do Comitê de Política Monetária", "The base rate set at each Monetary Policy Committee meeting"), src: ["sgs:selicMeta", "sgs:selicMes"], ranges: ["5a", "10a", "20a", "tudo"], defRange: "20a", range: "20a", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "% a.a.",
    series: () => [{ name: t("Meta Selic", "Selic target"), color: C.cdi, step: true, area: true, data: MB.selicM() }, { name: t("Selic efetiva (mensal, anualizada)", "Effective Selic (monthly, annualised)"), color: C.btc, data: MB.ser("selicMes"), width: 1.4 }],
    big: (S0) => { const l = S0[0].data.at(-1); return `${F(l[1], 2)}% <small class="muted">${MB.perLabel(l[0])}</small>`; },
  });
  const realCard = () => MB.tsCard("juros_real", {
    title: t("Juro real: quanto sobra acima da inflação", "Real interest rate: what is left above inflation"), sub: t("(1 + Selic meta) ÷ (1 + IPCA 12m) − 1, no fim de cada mês", "(1 + Selic target) ÷ (1 + 12m IPCA) − 1, at each month-end"), src: ["sgs:selicMeta", "sgs:ipca"], ranges: ["5a", "10a", "20a", "tudo"], defRange: "20a", range: "20a", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => [{ name: t("Juro real ex-post", "Ex-post real rate"), color: C.usd, area: true, data: realRate() }],
    extra: (o) => { o.series[0].markLine = MB.refLine(0, "0%"); }, big: (S0) => `${F(S0[0].data.at(-1)[1], 2)}% <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });

  /* ------------------------- 03 · crédito caro ------------------------- */
  const modCtrl = () => `<div class="c-ctrl"><button type="button" data-log="1" aria-pressed="${st.log}">log</button><button type="button" data-log="0" aria-pressed="${!st.log}">${t("linear", "linear")}</button></div>`;
  const ratesCard = () => MB.tsCard("juros_mod", {
    title: t("Quanto custa cada tipo de crédito (% ao ano)", "What each type of credit costs (% per year)"), sub: t("Taxa média de juros das operações de pessoas físicas, por modalidade — escala logarítmica para caber todas", "Average interest rate on individuals' loans, by type — log scale to fit them all"), src: ["sgs:jurosCartRot", "sgs:jurosCartPar", "sgs:jurosCheque", "sgs:jurosPessoal", "sgs:jurosVeic", "sgs:selicMeta"], ranges: ["3a", "5a", "10a", "tudo"], defRange: "10a", range: "10a", ctrl: modCtrl, log: undefined, height: 380,
    onClick(e, el) { const b = e.target.closest("[data-log]"); if (!b) return; st.log = b.dataset.log === "1"; el.querySelector("[data-ctrl]").innerHTML = modCtrl(); el._render(); },
    yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 1) + "% a.a.",
    series: () => [["jurosCartRot", t("Cartão rotativo", "Card revolving"), C.btc], ["jurosCartPar", t("Cartão parcelado", "Card instalments"), C.amber], ["jurosCheque", t("Cheque especial", "Overdraft"), C.pink], ["jurosPessoal", t("Pessoal não consignado", "Personal non-payroll"), C.cdi], ["jurosVeic", t("Veículos", "Vehicles"), C.usd], ["selic", t("Selic meta", "Selic target"), C.ref]].map(([k, n, col]) => ({ name: n, color: col, data: k === "selic" ? MB.selicM() : MB.ser(k), dashed: k === "selic", width: k === "jurosCartRot" ? 2.8 : 1.8 })),
    extra: (o) => { if (st.log) { o.yAxis.type = "log"; o.yAxis.scale = false; o.yAxis.min = 5; } },
  });
  const rankNowCard = () => MB.card("juros_now", {
    title: t("O mais recente: do mais barato ao mais caro", "Latest: from cheapest to priciest"), sub: t("Taxa média anual de cada modalidade (pessoas físicas) frente à Selic", "Annual average rate by type (individuals) against the Selic"), src: ["sgs:jurosCartRot", "sgs:jurosCheque", "sgs:jurosVeic"], height: 340,
    build() {
      const sel = MB.lastD("selicMeta")[1] ?? MB.last("selicMeta")[1];
      const items = [["jurosCartRot", t("Cartão rotativo", "Card revolving"), C.btc], ["jurosCartPar", t("Cartão parcelado", "Card instalments"), C.amber], ["jurosCheque", t("Cheque especial", "Overdraft"), C.pink], ["jurosPessoal", t("Pessoal não consignado", "Personal non-payroll"), C.cdi], ["jurosLivrePF", t("Recursos livres (PF) — média", "Free-funds (individuals) — avg"), C.real], ["jurosVeic", t("Veículos", "Vehicles"), C.usd]].map(([k, n, col]) => ({ name: n, value: MB.last(k)[1], color: col })).filter((x) => x.value != null);
      if (!items.length) return null;
      if (sel != null) items.push({ name: t("Selic (referência)", "Selic (reference)"), value: sel, color: C.ref });
      return { option: MB.hbar(items, { fmt: (v) => F(v, 0) + "%" }), big: sel ? t(`Rotativo ÷ Selic: <span class="mono">${F(items.find((x) => x.color === C.btc)?.value / sel, 0)}×</span>`, `Revolving ÷ Selic: <span class="mono">${F(items.find((x) => x.color === C.btc)?.value / sel, 0)}×</span>`) : "", table: { cols: [t("Modalidade", "Type"), "% a.a."], rows: items.map((x) => [x.name, F(x.value, 1)]) } };
    },
  });
  const cardDebtCard = () => MB.tsCard("juros_cartdebt", {
    title: t("A dívida do cartão de crédito (pessoas físicas)", "Credit-card debt (individuals)"), sub: t("Saldo por tipo, em R$ bilhões", "Balance by type, in R$ billion"), src: ["sgs:cartSaldoRot", "sgs:cartSaldoPar", "sgs:cartSaldoAvi"], ranges: ["5a", "10a", "tudo"], defRange: "10a", range: "10a", yFmt: (v) => "R$ " + F(v, 0) + (MB.lang === "pt" ? " bi" : " B"), tipFmt: (v) => "R$ " + F(v, 1) + (MB.lang === "pt" ? " bi" : " B"),
    series: () => [["cartSaldoPar", t("Parcelado", "Instalments"), C.amber], ["cartSaldoRot", t("Rotativo", "Revolving"), C.btc], ["cartSaldoAvi", t("À vista (fatura)", "Pay-in-full (statement)"), C.cdi]].map(([k, n, col]) => ({ name: n, color: col, data: MB.ser(k).map(([m, v]) => [m, v / 1000]) })),
    extra: (o) => o.series.forEach((s) => { s.stack = "cartao"; s.areaStyle = { color: s.lineStyle.color, opacity: 0.5 }; s.lineStyle.width = 1.2; }),
    big: (S0) => `R$ ${F(S0.reduce((p, s) => p + s.data.at(-1)[1], 0), 0)}${MB.lang === "pt" ? " bi" : " B"} <small class="muted">${MB.ymLabel(S0[0].data.at(-1)[0])}</small>`,
  });
  const inadCard = () => MB.tsCard("juros_inad", {
    title: t("Quem não consegue pagar: inadimplência do cartão", "Who cannot pay: card default rates"), sub: t("Atrasos acima de 90 dias, como % da carteira de pessoas físicas", "Arrears over 90 days, as % of the individuals' portfolio"), src: ["sgs:inadCartRot", "sgs:inadCartPar", "sgs:inadCartTot", "sgs:inadCheque"], ranges: ["5a", "10a", "tudo"], defRange: "10a", range: "10a", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%",
    series: () => [["inadCartRot", t("Rotativo", "Revolving"), C.btc], ["inadCartPar", t("Parcelado", "Instalments"), C.amber], ["inadCartTot", t("Cartão total", "Card total"), C.pink], ["inadCheque", t("Cheque especial", "Overdraft"), C.cdi]].map(([k, n, col]) => ({ name: n, color: col, data: MB.ser(k), width: k === "inadCartTot" ? 2.6 : 1.8 })),
  });

  /* ------------------------- 04 · simulador do rotativo ------------------------- */
  function ccHTML() {
    const rot = MB.last("jurosCartRot")[1], c = st.cc, rate = c.rate ?? (rot != null ? +F(monthly(rot), 2).replace(",", ".") : 14);
    return `<div class="card"><h3 class="c-title">${t("Simulador: quanto custa ficar no rotativo?", "Simulator: what does staying in revolving credit cost?")}</h3><p class="c-sub">${t("A taxa padrão é a média mensal equivalente à média anual divulgada pelo Banco Central; você pode trocar pela taxa do seu cartão.", "The default is the monthly equivalent of the annual average published by the central bank; you can replace it with your own card's rate.")}</p>
      <div class="calc" id="cc" style="margin-top:14px"><div class="calc-in">
        <label>${t("Dívida no rotativo (R$)", "Revolving balance (R$)")}<div class="in-prefix"><span>R$</span><input id="ccDebt" inputmode="decimal" value="${F(c.debt, 2)}"></div></label>
        <label>${t("Quanto você paga por mês (R$)", "How much you pay per month (R$)")}<div class="in-prefix"><span>R$</span><input id="ccPay" inputmode="decimal" value="${F(c.pay, 2)}"></div></label>
        <label>${t("Juros ao mês (%)", "Interest per month (%)")}<input id="ccRate" inputmode="decimal" value="${String(rate).replace(".", MB.lang === "pt" ? "," : ".")}"></label>
        <label style="flex-direction:row;align-items:center;gap:10px;text-transform:none;letter-spacing:0;font:500 13.5px Inter;color:var(--text-2)"><input id="ccCap" type="checkbox" style="width:auto"${c.cap ? " checked" : ""}> ${t("Aplicar o teto legal: juros e encargos limitados a 100% da dívida original", "Apply the legal cap: interest and charges limited to 100% of the original debt")}</label></div>
        <div class="calc-out" id="ccOut"></div></div></div>`;
  }
  function ccUpdate(root) {
    const D0 = MB.parseNum(root.querySelector("#ccDebt").value) || 0, P = MB.parseNum(root.querySelector("#ccPay").value) || 0, r = (MB.parseNum(root.querySelector("#ccRate").value) || 0) / 100, cap = root.querySelector("#ccCap").checked;
    st.cc = { debt: D0, pay: P, rate: r * 100, cap }; const out = root.querySelector("#ccOut");
    if (D0 <= 0 || P <= 0) { out.innerHTML = `<div class="out-big"><div class="l">${t("Informe a dívida e o pagamento mensal.", "Enter the balance and monthly payment.")}</div></div>`; return; }
    let B = D0, I = 0, paid = 0, n = 0, never = false;
    while (B > 0.005 && n < 600) {
      let add = B * r; if (cap && I + add > D0) add = Math.max(0, D0 - I); I += add; B += add;
      const pay = Math.min(P, B); B -= pay; paid += pay; n++;
      if (n === 12 && B >= D0 * 1.9 && !cap) { never = P <= D0 * r; }
    }
    const interest = paid - D0, yrs = Math.floor(n / 12), mo = n % 12, inactive = P <= D0 * r && !cap;
    out.innerHTML = inactive ? `<div class="out-big"><div class="l">${t("Atenção", "Warning")}</div><div class="v neg">${t("A dívida nunca acaba", "The debt never ends")}</div><div class="s">${t(`O pagamento de ${MB.brl(P, 0)} é menor que os juros do primeiro mês (${MB.brl(D0 * r, 0)}): a dívida cresce todo mês.`, `A payment of ${MB.brl(P, 0)} is smaller than the first month's interest (${MB.brl(D0 * r, 0)}): the debt grows every month.`)}</div></div>`
      : `<div class="out-big"><div class="l">${t("Você termina de pagar em", "You finish paying in")}</div><div class="v">${n >= 600 ? "50+ " + t("anos", "years") : (yrs ? yrs + t(" anos", " yrs") + " " : "") + (mo ? mo + t(" meses", " mo") : "")}</div><div class="s">${t(`Você paga <b>${MB.brl(paid, 0)}</b> por uma dívida de ${MB.brl(D0, 0)}: <b class="neg">${F((paid / D0 - 1) * 100, 0)}% só em juros</b> (${MB.brl(interest, 0)}).`, `You pay <b>${MB.brl(paid, 0)}</b> on a ${MB.brl(D0, 0)} debt: <b class="neg">${F((paid / D0 - 1) * 100, 0)}% in interest alone</b> (${MB.brl(interest, 0)}).`)}</div></div>
      <div class="out-row"><div><div class="l">${t("Juros no 1º mês", "Interest in month 1")}</div><div class="v">${MB.brl(D0 * r, 0)}</div></div><div><div class="l">${t("Taxa anual equivalente", "Equivalent annual rate")}</div><div class="v">${F((Math.pow(1 + r, 12) - 1) * 100, 0)}%</div></div><div><div class="l">${t("Total pago ÷ dívida", "Total paid ÷ debt")}</div><div class="v">${F(paid / D0, 2)}×</div></div></div>
      <p class="note">${t("Simulação simplificada (sem IOF e tarifas). Desde 2024, a lei limita juros e encargos do rotativo a 100% do valor original da dívida; marque a opção acima para ver o efeito do teto.", "Simplified simulation (no taxes or fees). Since 2024, Brazilian law caps revolving-credit interest and charges at 100% of the original debt; tick the box above to see the effect of the cap.")}</p>`;
  }

  /* ------------------------- 05 · ranking por banco ------------------------- */
  const modName = (m) => m.name;
  const bankCtrl = () => { const mods = MB.D.rates?.mods || []; return `<select class="c-select" data-mod aria-label="${t("Modalidade", "Type")}">${mods.map((m, i) => `<option value="${i}"${i === (st.mod ?? 0) ? " selected" : ""}>${MB.esc(modName(m))}</option>`).join("")}</select>`; };
  const banksCard = () => MB.card("juros_banks", { empty: t("Estes dados só chegam pela coleta automática (GitHub Actions) — ela roda sozinha depois de publicado.", "This data only arrives through the automatic collection (GitHub Actions) — it runs by itself once published."),
    title: t("O que cada banco cobra", "What each bank charges"), sub: t("Taxa média da semana informada pelas instituições ao Banco Central, por modalidade (pessoas físicas)", "Weekly average rate reported by institutions to the central bank, by type (individuals)"), src: ["juros"], height: 440, ctrl: bankCtrl,
    onChange(e, el) { if (e.target.matches("[data-mod]")) { st.mod = +e.target.value; el._render(); } },
    build(_r, el) {
      const mods = MB.D.rates?.mods; if (!mods?.length) return null; const m = mods[st.mod ?? 0] || mods[0];
      const items = (m.banks || []).map((b) => ({ name: b[0].replace(/^(BCO|BANCO)\s+/i, "").slice(0, 28), value: b[2] })).filter((x) => x.value != null);
      const w = MB.D.rates.week, range = Array.isArray(w) ? `${MB.isoLabel(w[0])} – ${MB.isoLabel(w[1])}` : w || "";
      return { option: MB.hbar(items, { fmt: (v) => F(v, 0) + "%", color: C.cdi }), big: `<div class="c-big-row"><span>${t("Média", "Average")}: ${F(m.avg, 1)}%</span><span>${t("Mediana", "Median")}: ${F(m.med, 1)}%</span><span>${t("Mín.", "Min")}: ${F(m.min, 1)}%</span><span>${t("Máx.", "Max")}: ${F(m.max, 1)}%</span><small>${m.n} ${t("instituições", "institutions")} · ${range}</small></div>`, table: { cols: [t("Instituição", "Institution"), t("% ao mês", "% per month"), t("% ao ano", "% per year")], rows: (m.banks || []).map((b) => [b[0], F(b[1], 2), F(b[2], 1)]) } };
    },
  });

  MB.tabs.juros = {
    render(panel) {
      panel.innerHTML = `${tiles()}
        ${MB.sec("01", t("O juro básico e o juro que você paga", "The base rate and the rate you pay"), t("A Selic é o preço do dinheiro no país. Entre ela e o que o consumidor paga no cartão e no cheque especial há uma distância enorme.", "The Selic is the price of money in the country. Between it and what consumers pay on cards and overdrafts there is an enormous gap."), `<div class="grid2">${selicCard()}${rankNowCard()}</div>`)}
        ${MB.sec("02", t("Simulador do rotativo", "Revolving-credit simulator"), t("Veja quanto tempo e quanto dinheiro uma dívida de cartão realmente consome.", "See how much time and money a card debt really consumes."), ccHTML())}
        ${MB.more("juros_more", t("Ver mais dados: juro real, cartão, atrasos e bancos", "See more data: real rate, cards, arrears and banks"), () => `<p class="more-h">${t("Juro real: o que sobra depois da inflação", "Real rate: what is left after inflation")}</p>${realCard()}<p class="more-h">${t("Juros por tipo de crédito, ao longo do tempo", "Interest by type of credit, over time")}</p>${ratesCard()}<div class="grid2">${cardDebtCard()}${inadCard()}</div><p class="more-h">${t("Ranking por banco", "Ranking by bank")}</p>${banksCard()}<p class="more-h">${t("Selic esperada pelo mercado", "Selic expected by the market")}</p>${MB.shared?.selicPathCard?.() || ""}`, { hint: t("juro real, modalidades, bancos, expectativas", "real rate, credit types, banks, expectations") })}`;
    },
    after(panel) { const cc = panel.querySelector("#cc"); if (cc) { cc.addEventListener("input", () => ccUpdate(cc)); cc.addEventListener("change", () => ccUpdate(cc)); ccUpdate(cc); } },
  };
})();
