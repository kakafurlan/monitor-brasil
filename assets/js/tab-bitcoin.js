/* Aba BITCOIN — preço ao vivo, "e se eu tivesse comprado?", riscos (quedas e janelas), escassez e rede. */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.btcState = { sim: { mode: "dca", amt: 500, from: null }, cur: "brl" });
  const HAL_H = 1050000; // altura do próximo halving (5º)

  const supplyAtHeight = (h) => { let s = 0, r = 50, left = h + 1; while (left > 0 && r > 1e-8) { const n = Math.min(210000, left); s += n * r; left -= n; r /= 2; } return s; };

  /* ------------------------- ao vivo ------------------------- */
  function liveTiles() {
    return `<div class="tiles4 reveal">
      ${MB.tile("Bitcoin · BTC/BRL", MB.brl(MB.btcNow(), 0), `<span data-live="btcChg" class="mono"></span> <span class="muted">24h</span>`, { best: true, id: "btcBrl" })}
      ${MB.tile("Bitcoin · BTC/USD", MB.usd(MB.btcUsdNow(), 0), t("preço em dólares", "price in dollars"), { id: "btcUsd" })}
      ${MB.tile(t("R$ 1 compra", "R$ 1 buys"), F(MB.sats(MB.btcNow()), 0) + " sats", t("1 bitcoin = 100 milhões de satoshis", "1 bitcoin = 100 million satoshis"), { id: "sats" })}
      ${MB.tile(t("Dólar", "Dollar"), MB.brl(MB.usdBrl(), 4), "USD/BRL", { id: "usdBrl" })}</div>`;
  }
  function netHTML() {
    const L = MB.live, h = L.height, supply = h ? supplyAtHeight(h) : MB.btcSupply(Date.now()), left = h ? Math.max(0, HAL_H - h) : null, d = L.diff;
    const prog = h ? Math.min(100, ((h - 840000) / 210000) * 100) : null, days = left != null ? left / 144 : null;
    return `<div class="card" id="net"><div class="c-head"><div><h3 class="c-title">${t("A rede Bitcoin agora", "The Bitcoin network now")}</h3><p class="c-sub">${t("Dados da rede, direto do mempool.space", "Network data, straight from mempool.space")}</p></div>${MB.chips(["mempool"])}</div>
      <div class="tiles4" style="margin-top:14px">
      ${MB.tile(t("Altura do bloco", "Block height"), h ? F(h) : "—", t("blocos minerados desde 2009", "blocks mined since 2009"), { id: "height" })}
      ${MB.tile(t("Taxa para confirmar rápido", "Fee for fast confirmation"), L.fees ? F(L.fees.fastestFee) + " sat/vB" : "—", t("na próxima hora: ", "within the hour: ") + (L.fees ? F(L.fees.hourFee) + " sat/vB" : "—"), { id: "feeFast" })}
      ${MB.tile(t("Bitcoins em circulação", "Bitcoin in circulation"), F(supply / 1e6, 3) + (MB.lang === "pt" ? " mi" : " M"), `${F((supply / 21e6) * 100, 2)}% ${t("dos 21 milhões", "of the 21 million")}`)}
      ${MB.tile(t("Próximo halving", "Next halving"), left != null ? F(left) + t(" blocos", " blocks") : "—", days != null ? t(`em ~${F(days, 0)} dias (${new Date(Date.now() + days * 864e5).toLocaleDateString(MB.loc(), { month: "short", year: "numeric" })})`, `in ~${F(days, 0)} days (${new Date(Date.now() + days * 864e5).toLocaleDateString(MB.loc(), { month: "short", year: "numeric" })})`) : "")}</div>
      ${prog != null ? `<div class="meter"><div style="width:${prog}%"></div></div><p class="note">${t(`Ciclo atual: ${F(prog, 1)}% concluído — a recompensa por bloco cai pela metade a cada 210.000 blocos (≈ 4 anos).`, `Current cycle: ${F(prog, 1)}% complete — the block reward halves every 210,000 blocks (≈ 4 years).`)}</p>` : ""}
      ${d ? `<p class="note">${t(`Ajuste de dificuldade: ${F(d.progressPercent, 1)}% do período, variação estimada de ${d.difficultyChange >= 0 ? "+" : ""}${F(d.difficultyChange, 2)}%.`, `Difficulty adjustment: ${F(d.progressPercent, 1)}% through the period, estimated change ${d.difficultyChange >= 0 ? "+" : ""}${F(d.difficultyChange, 2)}%.`)}</p>` : ""}</div>`;
  }

  /* ------------------------- simulador ------------------------- */
  const firstBtc = () => MB.ymAdd(MB.D.btc?.brlM?.[0]?.[0] || "2010-07", 1);
  function simulate() {
    const s = st.sim, btc = MB.mapOf(MB.btcM()), usd = MB.mapOf(MB.ptaxM()), cdiRates = MB.mapOf(MB.ser("cdiMes")); let from = s.from || MB.ymAdd(MB.nowYm(), -60); if (from < firstBtc()) from = firstBtc();
    const now = MB.nowYm(), out = { btc: [], usd: [], cdi: [], need: [], inv: [] }; let units = { btc: 0, usd: 0 }, cdi = 0, invested = 0, need = 0, first = true, lastU = null;
    const lastCdi = MB.lastOf(MB.ser("cdiMes"))[0];
    for (let ym = from; ym <= now; ym = MB.ymAdd(ym, 1)) {
      const prev = MB.ymAdd(ym, -1), pB = btc.get(prev), pU = usd.get(prev), P0 = MB.P(prev); if (!pB || !pU || !P0) continue;
      const put = s.mode === "dca" || first ? s.amt : 0; first = false;
      if (put) { units.btc += put / pB; units.usd += put / pU; cdi += put; invested += put; need += put; }
      need *= MB.P(ym) / P0; // custo de vida do mês
      if (ym <= lastCdi) cdi *= 1 + (cdiRates.get(ym) || 0) / 100;
      /* o PTAX de fim de mês só existe para meses fechados: no mês corrente vale a cotação ao vivo (ou a última conhecida) */
      const vB = btc.get(ym), vU = usd.get(ym) ?? (ym === now ? MB.usdBrl() : null); if (vB == null) continue;
      if (vU != null) lastU = vU;
      out.btc.push([ym, units.btc * vB]); out.usd.push([ym, units.usd * (vU ?? lastU ?? 0)]); out.cdi.push([ym, cdi]); out.need.push([ym, need]); out.inv.push([ym, invested]);
    }
    // o mês corrente usa o preço ao vivo, se houver
    return { ...out, from, invested };
  }
  function simOut() {
    const R = simulate(), L = (k) => R[k].at(-1)?.[1]; if (!R.btc.length) return `<div class="out-big"><div class="l">${t("Escolha uma data a partir de " + MB.ymLabel(firstBtc()), "Pick a date from " + MB.ymLabel(firstBtc()) + " onwards")}</div></div>`;
    const inv = R.invested, tile = (n, v, col, sub) => `<div class="tile" style="background:var(--bg-2)"><div class="t-l"><span class="sw" style="background:${col}"></span>${n}</div><div class="t-v">${MB.brl(v, 0)}</div><div class="t-s">${sub}</div></div>`;
    const g = (v) => `${v >= inv ? "+" : ""}${F((v / inv - 1) * 100, 0)}% ${t("sobre o investido", "on invested")}`;
    const best = Math.max(L("btc"), L("usd"), L("cdi"), L("need"));
    return `<div class="out-big"><div class="l">${t(`${st.sim.mode === "dca" ? `${MB.brl(st.sim.amt, 0)} por mês` : `${MB.brl(st.sim.amt, 0)} de uma vez`} desde ${MB.ymLabel(R.from)}: total investido`, `${st.sim.mode === "dca" ? `${MB.brl(st.sim.amt, 0)} per month` : `${MB.brl(st.sim.amt, 0)} lump sum`} since ${MB.ymLabel(R.from)}: total invested`)}</div><div class="v">${MB.brl(inv, 0)}</div></div>
      <div class="tiles3" style="border-radius:10px">${tile("Bitcoin", L("btc"), C.btc, g(L("btc")))}${tile("CDI", L("cdi"), C.cdi, g(L("cdi")))}${tile(t("Dólar", "Dollar"), L("usd"), C.usd, g(L("usd")))}</div>
      <div class="out-row"><div><div class="l">${t("Para só empatar com a inflação", "To just match inflation")}</div><div class="v">${MB.brl(L("need"), 0)}</div></div><div><div class="l">${t("Bitcoin ÷ inflação", "Bitcoin ÷ inflation")}</div><div class="v">${F(L("btc") / L("need"), 2)}×</div></div><div><div class="l">${t("Dinheiro parado hoje vale", "Idle cash is worth")}</div><div class="v neg">${MB.brl(inv / (L("need") / inv), 0)}</div></div></div>`;
  }
  const simCtrl = () => "";
  const simCard = () => MB.tsCard("bt_sim", {
    title: t("Evolução do patrimônio", "How the position evolved"), sub: t("Valor em reais de cada alternativa; linha tracejada = o necessário para só manter o poder de compra", "Value in reais of each alternative; dashed = what is needed just to keep purchasing power"), src: ["btc", "sgs:cdiMes", "sgs:ptax", "sgs:ipca"], ranges: [], yFmt: (v) => MB.compact(v, "R$ ", 0), tipFmt: (v) => MB.brl(v, 0), height: 360,
    series: () => { const R = simulate(); return [{ name: "Bitcoin", color: C.btc, data: R.btc, width: 2.8 }, { name: "CDI", color: C.cdi, data: R.cdi }, { name: t("Dólar", "Dollar"), color: C.usd, data: R.usd }, { name: t("Para empatar com a inflação", "To match inflation"), color: C.real, dashed: true, data: R.need }, { name: t("Total investido", "Total invested"), color: C.ref, dashed: true, data: R.inv, step: true }]; },
  });
  function simHTML() {
    const s = st.sim, from = s.from || MB.ymAdd(MB.nowYm(), -60);
    return `<div class="card" id="sim"><h3 class="c-title">${t("E se eu tivesse comprado?", "What if I had bought?")}</h3><p class="c-sub">${t("Simule o que teria acontecido com aportes em Bitcoin, dólar e CDI — comparados à inflação. Preços de fim de mês; sem impostos e taxas.", "Simulate what would have happened with purchases of Bitcoin, dollars and CDI — compared with inflation. Month-end prices; no taxes or fees.")}</p>
      <div class="calc" style="margin-top:14px"><div class="calc-in">
        <div class="seg" role="group"><button type="button" data-mode="dca" aria-pressed="${s.mode === "dca"}">${t("Aporte mensal", "Monthly purchase")}</button><button type="button" data-mode="lump" aria-pressed="${s.mode === "lump"}">${t("Aporte único", "Lump sum")}</button></div>
        <label>${s.mode === "dca" ? t("Valor por mês (R$)", "Amount per month (R$)") : t("Valor investido (R$)", "Amount invested (R$)")}<div class="in-prefix"><span>R$</span><input id="smAmt" inputmode="decimal" value="${F(s.amt, 2)}"></div></label>
        <label>${t("A partir de", "Starting from")}<input id="smFrom" type="month" value="${from}" min="${firstBtc()}" max="${MB.nowYm()}"></label>
        <div class="presets"><button type="button" data-y="3">3 ${t("anos", "yrs")}</button><button type="button" data-y="5">5 ${t("anos", "yrs")}</button><button type="button" data-y="8">8 ${t("anos", "yrs")}</button><button type="button" data-y="12">12 ${t("anos", "yrs")}</button></div></div>
        <div class="calc-out" id="smOut">${simOut()}</div></div></div>`;
  }

  /* ------------------------- risco: quedas e janelas ------------------------- */
  const ddCard = () => MB.tsCard("bt_dd", {
    title: t("O preço da escolha: quedas desde a máxima anterior", "The price of the choice: falls from the previous peak"), sub: t("Quanto o Bitcoin (em reais) estava abaixo do seu recorde anterior, mês a mês", "How far Bitcoin (in reais) was below its previous record, month by month"), src: ["btc"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 1) + "%",
    series: () => { let mx = 0; return [{ name: t("Queda desde a máxima", "Drawdown"), color: C.down, area: true, data: MB.btcM().map(([m, v]) => { mx = Math.max(mx, v); return [m, (v / mx - 1) * 100]; }) }]; },
    big: (S0) => { const d = S0[0].data, mn = d.reduce((a, b) => (b[1] < a[1] ? b : a)); return `${t("Maior queda", "Worst fall")}: <span class="neg">${F(mn[1], 0)}%</span> (${MB.ymLabel(mn[0])}) · ${t("agora", "now")}: ${F(d.at(-1)[1], 0)}%`; },
  });
  function windows() {
    const b = MB.btcM(), out = [];
    for (const yrs of [1, 2, 3, 4, 5, 6]) { const n = 12 * yrs, mult = []; for (let i = 0; i + n < b.length; i++) { const f = MB.P(b[i + n][0]) / MB.P(b[i][0]); if (isFinite(f) && f > 0) mult.push(b[i + n][1] / b[i][1] / f); } if (mult.length >= 6) { mult.sort((x, y) => x - y); out.push({ yrs, n: mult.length, beat: (mult.filter((x) => x > 1).length / mult.length) * 100, min: mult[0], med: mult[(mult.length / 2) | 0], max: mult.at(-1) }); } }
    return out;
  }
  const winCard = () => MB.card("bt_win", {
    title: t("Quanto tempo segurando faz diferença?", "Does holding longer make a difference?"), sub: t("Em quantas janelas de N anos o Bitcoin (em reais) superou a inflação — todas as datas possíveis de compra desde 2010", "In how many N-year windows Bitcoin (in reais) beat inflation — every possible purchase date since 2010"), src: ["btc", "sgs:ipca"], height: 340,
    build() {
      const W = windows(); if (!W.length) return null; const o = MB.baseOption({ yFmt: (v) => F(v, 0) + "%" }); o.legend.show = false; o.yAxis.scale = false; o.yAxis.min = 0; o.yAxis.max = 100; o.grid.top = 30;
      o.xAxis = { type: "category", data: W.map((w) => `${w.yrs} ${w.yrs === 1 ? t("ano", "yr") : t("anos", "yrs")}`), axisLine: { lineStyle: { color: C.grid } }, axisTick: { show: false }, axisLabel: { color: C.text, fontSize: 12 } };
      o.tooltip = { trigger: "axis", backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 12.5 }, formatter: (ps) => { const w = W[ps[0].dataIndex]; return `<b>${w.yrs} ${t("anos", "yrs")}</b> · ${w.n} ${t("janelas", "windows")}<br>${t("Superou a inflação em", "Beat inflation in")} <b>${F(w.beat, 0)}%</b><br>${t("Pior / mediano / melhor (múltiplo real)", "Worst / median / best (real multiple)")}: ${F(w.min, 2)}× / ${F(w.med, 2)}× / ${F(w.max, 1)}×`; } };
      o.series = [{ type: "bar", barMaxWidth: 46, data: W.map((w) => w.beat), itemStyle: { color: C.btc, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: "top", color: "#fff", fontSize: 12, formatter: (p) => F(p.value, 0) + "%" } }];
      return { option: o, big: MB.mini(t("Janelas se sobrepõem e o histórico é curto: isto descreve o passado, não promete o futuro.", "Windows overlap and history is short: this describes the past, it does not promise the future.")), table: { cols: [t("Prazo", "Horizon"), t("Janelas", "Windows"), t("Superou a inflação", "Beat inflation"), t("Pior", "Worst"), t("Mediana", "Median"), t("Melhor", "Best")], rows: W.map((w) => [`${w.yrs} ${t("anos", "yrs")}`, w.n, F(w.beat, 0) + "%", F(w.min, 2) + "×", F(w.med, 2) + "×", F(w.max, 1) + "×"]) } };
    },
  });

  /* ------------------------- preço, sats e escassez ------------------------- */
  const priceCtrl = () => MB.segHTML("cur", [["brl", "R$"], ["usd", "US$"]], st.cur);
  const priceCard = () => MB.tsCard("bt_price", {
    title: t("Preço do Bitcoin desde 2010", "Bitcoin price since 2010"), sub: t("Fim de cada mês, escala logarítmica; linhas verticais = halvings (a emissão de novos bitcoins cai pela metade)", "End of each month, log scale; vertical lines = halvings (new-bitcoin issuance is cut in half)"), src: ["btc", "live"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", log: true, ctrl: priceCtrl, height: 380,
    onClick(e, el) { const b = e.target.closest("[data-cur]"); if (!b) return; st.cur = b.dataset.cur; el.querySelector("[data-ctrl]").innerHTML = priceCtrl(); el._render(); },
    yFmt: (v) => (st.cur === "brl" ? "R$ " : "US$ ") + MB.compact(v, "", 0), tipFmt: (v) => (st.cur === "brl" ? MB.brl(v, 0) : MB.usd(v, 0)),
    series: () => [{ name: st.cur === "brl" ? "BTC/BRL" : "BTC/USD", color: C.btc, area: true, data: st.cur === "brl" ? MB.btcM() : MB.btcUsdM() }],
    extra: (o) => { o.series[0].markLine = { silent: true, symbol: "none", lineStyle: { color: C.ref, type: "dashed", width: 1 }, label: { color: C.text, fontSize: 10.5, formatter: "halving", position: "insideEndTop" }, data: MB.HALVINGS.filter(([d]) => d <= MB.todayIso()).map(([d]) => ({ xAxis: MB.isoMs(d) })) }; },
    big: (S0) => `${st.cur === "brl" ? MB.brl(MB.btcNow(), 0) : MB.usd(MB.btcUsdNow(), 0)} <small class="muted">${MB.live.btcBrl ? t("ao vivo", "live") : t("último dado", "last data")}</small>`,
  });
  const satsCard = () => MB.tsCard("bt_sats", {
    title: t("Quantos satoshis R$ 1 compra", "How many satoshis R$ 1 buys"), sub: t("Cada real compra menos Bitcoin ao longo do tempo — o inverso do preço", "Each real buys less Bitcoin over time — the inverse of the price"), src: ["btc", "live"], ranges: ["5a", "10a", "tudo"], defRange: "tudo", range: "tudo", log: true, yFmt: (v) => MB.compact(v, "", 0), tipFmt: (v) => F(v, v < 10 ? 2 : 0) + " sats",
    series: () => [{ name: t("Sats por R$ 1", "Sats per R$ 1"), color: C.btc, data: MB.btcM().map(([m, v]) => [m, MB.sats(v)]) }], big: (S0) => `${F(S0[0].data.at(-1)[1], 0)} sats`,
  });
  const supplyCard = () => MB.card("bt_supply", {
    title: t("Escassez programada: quantos bitcoins existem", "Programmed scarcity: how many bitcoins exist"), sub: t("Oferta acumulada ao longo do tempo, em milhões — o limite de 21 milhões é definido no código", "Cumulative supply over time, in millions — the 21 million cap is set in the code"), src: ["mempool"], height: 340, noTable: false,
    build() {
      const pts = []; for (let y = 2009; y <= 2041; y += 0.25) { const ms = Date.UTC(Math.floor(y), Math.round((y % 1) * 12), 1); pts.push([ms, MB.btcSupply(ms) / 1e6]); }
      const o = MB.baseOption({ yFmt: (v) => F(v, 0) + (MB.lang === "pt" ? " mi" : " M"), tipFmt: (v) => F(v, 3) + (MB.lang === "pt" ? " milhões" : " million") }); o.yAxis.scale = false; o.yAxis.min = 0; o.yAxis.max = 22;
      o.series = [{ ...MB.sLine(t("Oferta", "Supply"), C.btc, pts, { area: true }), markLine: { silent: true, symbol: "none", lineStyle: { color: C.ref, type: "dashed" }, label: { color: C.text, fontSize: 11, position: "insideStartTop", formatter: t("limite: 21 milhões", "cap: 21 million") }, data: [{ yAxis: 21 }, { xAxis: Date.now(), lineStyle: { color: C.real, type: "solid" }, label: { formatter: t("hoje", "today"), position: "insideEndTop", color: C.text } }] } }];
      const now = MB.btcSupply(Date.now());
      return { option: o, big: `${F(now / 1e6, 2)}${MB.lang === "pt" ? " mi" : " M"} (${F((now / 21e6) * 100, 1)}%) ${t("já emitidos", "already issued")}`, table: { cols: [t("Halving", "Halving"), t("Oferta (mi)", "Supply (M)")], rows: MB.HALVINGS.map(([d, v]) => [d, F(v / 1e6, 3)]) } };
    },
  });

  MB.tabs.bitcoin = {
    render(panel) {
      panel.innerHTML = `${liveTiles()}
        ${MB.sec("01", t("E se o brasileiro tivesse se protegido com Bitcoin?", "What if Brazilians had protected themselves with Bitcoin?"), t("Simule compras mensais ou únicas em Bitcoin, dólar e CDI e compare com o que seria preciso só para manter o poder de compra.", "Simulate monthly or one-off purchases of Bitcoin, dollars and CDI and compare with what is needed just to keep purchasing power."), `<div class="grid21">${simHTML()}${simCard()}</div>`)}
        ${MB.sec("02", t("O outro lado: o risco", "The other side: risk"), t("O Bitcoin é volátil. Veja as quedas que já enfrentou e se o tempo de permanência mudou o resultado.", "Bitcoin is volatile. See the falls it has been through and whether holding time changed the outcome."), `<div class="grid2">${ddCard()}${winCard()}</div>`)}
        ${MB.more("btc_more", t("Ver mais dados: preço, escassez e a rede", "See more data: price, scarcity and the network"), () => `<p class="more-h">${t("Preço e poder de compra", "Price and purchasing power")}</p><div class="grid21">${priceCard()}${satsCard()}</div><p class="more-h">${t("Escassez e rede", "Scarcity and network")}</p><div class="grid21">${supplyCard()}${netHTML()}</div>`, { hint: t("preço, satoshis, oferta e rede ao vivo", "price, satoshis, supply and live network") })}
        <p class="disclaimer">${t("Conteúdo educativo, não é recomendação de investimento. Simulações usam preços históricos de fim de mês, ignoram impostos, taxas e spreads e não garantem resultados futuros. Bitcoin pode perder valor, inclusive de forma acentuada.", "Educational content, not investment advice. Simulations use historical month-end prices, ignore taxes, fees and spreads and do not guarantee future results. Bitcoin can lose value, sometimes sharply.")}</p>`;
    },
    after(panel) {
      const sim = panel.querySelector("#sim"); if (!sim) return;
      const upd = () => { const amt = MB.parseNum(sim.querySelector("#smAmt").value) || 0, from = sim.querySelector("#smFrom").value; st.sim.amt = amt; if (from) st.sim.from = from; sim.querySelector("#smOut").innerHTML = simOut(); MB.rerender("bt_sim"); };
      sim.addEventListener("input", upd); sim.addEventListener("change", upd);
      sim.addEventListener("click", (e) => {
        const m = e.target.closest("[data-mode]"); if (m) { st.sim.mode = m.dataset.mode; sim.outerHTML = simHTML(); MB.tabs.bitcoin.after(panel); MB.rerender("bt_sim"); return; }
        const y = e.target.closest("[data-y]"); if (y) { st.sim.from = MB.ymAdd(MB.nowYm(), -12 * +y.dataset.y); sim.querySelector("#smFrom").value = st.sim.from < firstBtc() ? firstBtc() : st.sim.from; upd(); }
      });
    },
  };
})();
