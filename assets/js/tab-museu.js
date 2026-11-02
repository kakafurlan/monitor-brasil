/* Aba MUSEU DO REAL — museu interativo: moedas, conversor, máquina de preços, hiperinflação, mundo, salário mínimo, marcos. */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a);
  const st = (MB.museuState = { room: "sala-historia", era: "reis", cv: { amt: 1000, cur: "cruzeiro3", date: "" }, pm: { price: 10, i: null, play: null, speed: 1 }, wy: new Date().getFullYear() - 1, wplay: null });
  const nom = (v) => { if (!isFinite(v)) return "—"; if (v === 0) return "0"; const a = Math.abs(v); return a >= 1e15 || a < 0.005 ? MB.sci(v) : F(v, a < 100 ? 2 : 0); };
  const ymOf = (d) => d.slice(0, 7);

  /* texto curto de cada moeda (neutro: fatos e atos legais) */
  const STORY = () => ({
    reis: [t("A unidade do Império e da Primeira República era o réis; na prática, o mil-réis (1.000 réis) era a moeda do dia a dia, escrita com o cifrão: 1$000.", "The unit of the Empire and early Republic was the réis; in practice the mil-réis (1,000 réis) was everyday money, written with the cifrão sign: 1$000.")],
    cruzeiro1: [t("O Decreto-Lei 4.791, de outubro de 1942, criou o cruzeiro, equivalente a um mil-réis. Foi a primeira troca de nome da moeda em mais de um século.", "Decree-Law 4,791 of October 1942 created the cruzeiro, equal to one mil-réis. It was the first change in the currency's name in over a century.")],
    cruzeironovo: [t("Em 1967 a moeda perdeu três zeros: NCr$ 1 passou a valer Cr$ 1.000. O prefixo “novo” avisava que era a mesma moeda com outra escala.", "In 1967 the currency lost three zeros: NCr$ 1 became worth Cr$ 1,000. The “novo” prefix signalled the same money on a different scale.")],
    cruzeiro2: [t("Em 1970 o “novo” saiu do nome, sem mudar de valor: Cr$ 1 = NCr$ 1. A moeda atravessou mais de uma década e meia de inflação crescente.", "In 1970 “novo” left the name without changing the value: Cr$ 1 = NCr$ 1. The currency went through more than fifteen years of rising inflation.")],
    cruzado: [t("O Plano Cruzado (fevereiro de 1986) cortou três zeros (Cz$ 1 = Cr$ 1.000) e congelou preços e salários. Foi a primeira de uma série de tentativas de estabilização.", "The Cruzado Plan (February 1986) cut three zeros (Cz$ 1 = Cr$ 1,000) and froze prices and wages. It was the first of a series of stabilisation attempts.")],
    cruzadonovo: [t("Em janeiro de 1989, outra troca com corte de três zeros (NCz$ 1 = Cz$ 1.000) e novo congelamento de preços — o Plano Verão.", "In January 1989, another change cutting three zeros (NCz$ 1 = Cz$ 1,000) and a new price freeze — the Summer Plan.")],
    cruzeiro3: [t("Em março de 1990, o cruzeiro voltou, em paridade com o cruzado novo, junto com o bloqueio temporário de depósitos e aplicações financeiras.", "In March 1990 the cruzeiro returned, at par with the cruzado novo, along with a temporary freeze on deposits and financial investments.")],
    cruzeiroreal: [t("Em agosto de 1993, mais três zeros saíram (CR$ 1 = Cr$ 1.000). Foi a última moeda antes do Real, em meio ao pico da inflação.", "In August 1993, three more zeros were cut (CR$ 1 = Cr$ 1,000). It was the last currency before the Real, at the height of inflation.")],
    real: [t("Em 1º de julho de 1994, R$ 1 passou a valer CR$ 2.750, o valor da URV no dia anterior. Antes, desde março, preços e contratos migraram para a URV, uma unidade que acompanhava a inflação diária.", "On 1 July 1994, R$ 1 became worth CR$ 2,750, the URV's value the day before. Since March, prices and contracts had moved to the URV, a unit that tracked daily inflation.")],
  });
  const eraStats = (m, i) => {
    const I = MB.idx(); if (!I.first) return null;
    const fromYm = ymOf(m.from), toYm = m.to ? ymOf(m.to) : I.last, a = fromYm > I.first ? MB.P(MB.ymAdd(fromYm, -1)) : null, startYm = fromYm > I.first ? fromYm : I.first, b = MB.P(toYm);
    const base = a ?? (I.map.get(I.first) / (1 + (MB.ser("igpdi")[0]?.[1] || 0) / 100)); if (!b || !base) return null;
    const months = Math.max(1, MB.monthsBetween(MB.ymAdd(startYm, -1), toYm)), f = b / base;
    return { f, months, avg: (Math.pow(f, 1 / months) - 1) * 100, partial: fromYm < I.first, startYm, toYm };
  };

  /* ------------------------- hall ------------------------- */
  const hall = () => { const F0 = MB.MOEDAS[0].F; return `<div class="hall reveal"><p class="kicker">${t("Bem-vindo ao museu", "Welcome to the museum")}</p><div class="big" id="hallBig" data-to="${F0}">${F(F0, 0)}</div><p>${t("É quanto vale 1 real de hoje em mil-réis, a unidade monetária do Brasil até 1942. Foram oito trocas de moeda em 52 anos — e quinze ordens de grandeza de inflação acumulada, cortadas de zero em zero.", "That is what 1 real is worth in mil-réis, Brazil's monetary unit until 1942. Eight currency changes in 52 years — and fifteen orders of magnitude of accumulated inflation, cut away zero by zero.")}</p><div class="btn-row" style="justify-content:center"><button class="btn btn-primary btn-sm" type="button" data-room="sala-historia">${t("Comece pela história", "Start with the story")} →</button><button class="btn btn-sm" type="button" data-room="sala-confisco">${t("O confisco de 1990", "The 1990 savings freeze")} →</button><button class="btn btn-sm" type="button" data-room="sala-moedas">${t("Ver as moedas", "See the currencies")} →</button></div></div>`; };

  /* ------------------------- sala 1: moedas ------------------------- */
  const gallery = () => `<div class="gallery-nav"><button type="button" data-gal="-1" aria-label="${t("anterior", "previous")}">←</button><button type="button" data-gal="1" aria-label="${t("próxima", "next")}">→</button></div><div class="gallery" id="gallery">${MB.MOEDAS.map((m) => `<div class="era${m.id === st.era ? " on" : ""}" data-era="${m.id}" style="--era:${m.color}" tabindex="0" role="button" aria-label="${m.name}"><div class="sym">${m.sym}</div><h4>${m.name}</h4><div class="dates">${m.from.slice(0, 4)} – ${m.to ? m.to.slice(0, 4) : t("hoje", "today")}</div><div class="cut">${m.id === "reis" ? t("Unidade original", "Original unit") : m.ratio === 1 ? t("Troca de nome, paridade 1:1", "Name change, 1:1 parity") : `<b>${m.sym}</b> 1 = ${t("anterior", "previous")} ${F(m.ratio)}`}</div></div>`).join("")}</div><div id="eraDetail"></div>`;
  function eraDetail() {
    const m = MB.MOEDAS.find((x) => x.id === st.era) || MB.MOEDAS.at(-1), i = MB.MOEDAS.indexOf(m), s = eraStats(m, i), story = STORY()[m.id]?.[0] || "";
    const ptax = MB.ser("ptax"), ym = m.to ? ymOf(m.to) : MB.nowYm(), pt = ptax.find((p) => p[0] === ym)?.[1], sal = MB.salMinLong(), salEnd = sal.find((p) => p[0] === ym)?.[1];
    const line = (a, b) => `<div class="stat-line"><span>${a}</span><b>${b}</b></div>`;
    document.getElementById("eraDetail").innerHTML = `<div class="era-detail" style="border-color:${m.color}55"><div><span class="kicker" style="color:${m.color}">${m.from.slice(0, 4)} – ${m.to ? m.to.slice(0, 4) : t("hoje", "today")}</span><h3>${m.name} <span class="muted">(${m.sym})</span></h3><p>${story}</p>${m.act ? `<p class="mono muted" style="font-size:12.5px">${t("Ato legal de referência", "Reference legal act")}: ${MB.esc(m.act)}</p>` : ""}<p class="muted" style="font-size:13px">${t("Vigência", "In force")}: ${MB.isoLabel(m.from)} → ${m.to ? MB.isoLabel(m.to) : t("hoje", "today")}</p></div>
      <div>${line(t("R$ 1 de hoje equivale a", "R$ 1 today equals"), `${m.sym} ${nom(m.F)}`)}${line(t(`1 ${m.sym} vale em reais de hoje`, `1 ${m.sym} in today's reais`), "R$ " + nom(1 / m.F))}${s ? line(t("Preços no período (IGP-DI/IPCA)", "Prices in the period (IGP-DI/IPCA)"), `× ${nom(s.f)}`) : ""}${s ? line(t("Inflação média mensal", "Average monthly inflation"), `${F(s.avg, 2)}%`) : ""}${s?.partial ? `<p class="note">${t("Índice de preços disponível desde 1944.", "Price index available since 1944.")}</p>` : ""}${pt ? line(t(`Dólar no fim do período (${MB.ymLabel(ym)})`, `Dollar at the end (${MB.ymLabel(ym)})`), `1 US$ = ${m.sym} ${nom(pt)}`) : ""}${salEnd ? line(t("Salário mínimo no fim do período", "Minimum wage at the end"), `${m.sym} ${nom(salEnd * m.F)}`) : ""}</div></div>`;
  }

  /* ------------------------- sala 2: conversor ------------------------- */
  function conv() {
    const last = MB.idx().last || MB.nowYm();
    return `<div class="card" id="conv"><h3 class="c-title">${t("Conversor de moedas históricas", "Historical currency converter")}</h3><p class="c-sub">${t("Converte um valor da moeda de uma época para reais (só a troca de unidade) e, se você informar o mês, atualiza pela inflação até hoje.", "Converts an amount from an era's currency into reais (unit change only) and, if you give the month, updates it for inflation up to today.")}</p>
      <div class="calc" style="margin-top:14px"><div class="calc-in">
        <label>${t("Valor", "Amount")}<input id="cvAmt" inputmode="decimal" value="${F(st.cv.amt, 2)}"></label>
        <label>${t("Moeda", "Currency")}<select id="cvCur">${MB.MOEDAS.map((m) => `<option value="${m.id}"${m.id === st.cv.cur ? " selected" : ""}>${m.name} (${m.sym}) · ${m.from.slice(0, 4)}–${m.to ? m.to.slice(0, 4) : t("hoje", "today")}</option>`).join("")}</select></label>
        <label>${t("Mês de referência (opcional)", "Reference month (optional)")}<input id="cvDate" type="month" min="1944-01" max="${last}" value="${st.cv.date}"></label></div>
        <div class="calc-out" id="cvOut"></div></div></div>`;
  }
  function convUpdate(root) {
    const amt = MB.parseNum(root.querySelector("#cvAmt").value) || 0, id = root.querySelector("#cvCur").value, ym = root.querySelector("#cvDate").value; st.cv = { amt, cur: id, date: ym };
    const m = MB.MOEDAS.find((x) => x.id === id), rs = amt / m.F, fac = ym ? MB.Pnow() / MB.P(ym) : null, out = root.querySelector("#cvOut");
    out.innerHTML = `<div class="out-big"><div class="l">${m.sym} ${nom(amt)} ${t("em reais (troca de unidade)", "in reais (unit change)")}</div><div class="v">R$ ${nom(rs)}</div>${fac && isFinite(fac) ? `<div class="s">${t(`Atualizado pela inflação de ${MB.ymLabel(ym)} até hoje: <b>R$ ${nom(rs * fac)}</b>`, `Updated for inflation from ${MB.ymLabel(ym)} to today: <b>R$ ${nom(rs * fac)}</b>`)}</div>` : `<div class="s muted">${t("Informe o mês para ver o valor em poder de compra de hoje.", "Enter the month to see the value in today's purchasing power.")}</div>`}</div>
      <div class="table-wrap" style="margin:0"><div class="c-table" style="max-height:230px">${MB.table([t("Moeda", "Currency"), t("O mesmo valor em reais, na moeda de...", "The same R$ amount in...")], MB.MOEDAS.map((x) => [`${x.name} (${x.sym})`, `${x.sym} ${nom(rs * x.F)}`]), "src-table")}</div></div>`;
  }

  /* ------------------------- sala 3: máquina de preços ------------------------- */
  const pmKeys = () => MB.idx().keys;
  const pmPrice = (ym) => st.pm.price * (MB.P(ym) / MB.Pnow()) * MB.eraAtYm(ym).F;
  function pm() {
    const keys = pmKeys(); if (keys.length < 2) return `<div class="card"><p class="muted">${t("Aguardando índice de preços.", "Waiting for the price index.")}</p></div>`;
    if (st.pm.i == null) st.pm.i = keys.indexOf("1993-12") >= 0 ? keys.indexOf("1993-12") : keys.length - 1;
    return `<div class="grid21"><div class="card" id="pm"><h3 class="c-title">${t("Máquina de preços", "Price machine")}</h3><p class="c-sub">${t("Quanto custaria, na moeda da época, algo que hoje custa:", "How much would something that costs this today have cost, in the currency of the time:")}</p>
      <div class="calc-in" style="margin:10px 0"><label><div class="in-prefix"><span>R$</span><input id="pmP" inputmode="decimal" value="${F(st.pm.price, 2)}"></div></label></div>
      <div class="tm-label"><span id="pmEra"></span><b id="pmDate"></b></div>
      <input type="range" id="pmR" min="0" max="${keys.length - 1}" value="${st.pm.i}" aria-label="${t("Mês", "Month")}"><div class="tm-axis mono"><span>${MB.ymLabel(keys[0])}</span><span>${MB.ymLabel(keys.at(-1))}</span></div>
      <div class="hall" style="margin:12px 0 8px;padding:20px 10px"><div class="mono muted" id="pmSym" style="font-size:13px"></div><div class="big" id="pmTag" style="font-size:clamp(24px,4vw,44px)"></div><p id="pmNote" style="font-size:13.5px"></p></div>
      <div class="btn-row"><button class="btn btn-primary btn-sm" type="button" id="pmPlay">▶ ${t("Reproduzir a história", "Play history")}</button><div class="presets"><button type="button" data-j="1964-01">1964</button><button type="button" data-j="1986-01">1986</button><button type="button" data-j="1990-03">1990</button><button type="button" data-j="1994-06">${t("Jun/94", "Jun/94")}</button><button type="button" data-j="1994-07">${t("Jul/94", "Jul/94")}</button></div></div></div>
      ${MB.card("mu_pm", { title: t("A serra dos preços", "The price saw-tooth"), sub: t("O mesmo produto, na moeda de cada época (escala log): a cada troca de moeda o número despenca de um dia para o outro — sem que o preço tenha caído.", "The same product, in each era's currency (log scale): at each currency change the number plunges overnight — without the price having fallen."), src: ["sgs:ipca", "sgs:igpdi"], height: 390, noTable: true, build: pmChart })}</div>`;
  }
  function pmChart() {
    const keys = pmKeys(); if (keys.length < 2) return null;
    const data = keys.map((k) => [MB.ymMs(k), pmPrice(k)]).filter((p) => isFinite(p[1]) && p[1] > 0);
    const o = MB.baseOption({ log: true, yFmt: (v) => MB.compact(v, "", 0), tipFmt: (v) => nom(v) });
    o.series = [{ ...MB.sLine(t("Preço na moeda da época", "Price in the era's currency"), C.btc, data, { width: 1.8 }), markLine: { silent: true, symbol: "none", lineStyle: { color: C.ref, type: "dashed", width: 1 }, label: { color: C.text, fontSize: 10, formatter: (p) => p.data.sym, position: "insideEndBottom" }, data: MB.MOEDAS.slice(1).map((m) => ({ xAxis: MB.isoMs(m.from), sym: m.sym })) } }, { type: "line", name: "cursor", data: [], markLine: { silent: true, symbol: "none", lineStyle: { color: "#fff", width: 1.4 }, label: { show: false }, data: [{ xAxis: MB.ymMs(keys[st.pm.i ?? keys.length - 1]) }] } }];
    o.legend = { show: false };
    return { option: o, big: MB.mini(t("As linhas tracejadas marcam as trocas de moeda.", "Dashed lines mark the currency changes.")), table: null };
  }
  function pmUpdate(root, fromSlider) {
    const keys = pmKeys(), ym = keys[st.pm.i], era = MB.eraAtYm(ym), p = pmPrice(ym), rel = MB.P(ym) / MB.Pnow();
    root.querySelector("#pmDate").textContent = MB.ymLabel(ym); root.querySelector("#pmEra").textContent = era.name;
    root.querySelector("#pmSym").textContent = `${era.sym} · ${MB.esc ? "" : ""}${t("moeda em vigor", "currency in force")}`;
    root.querySelector("#pmTag").textContent = `${era.sym} ${nom(p)}`;
    root.querySelector("#pmNote").innerHTML = t(`Poder de compra: o mesmo produto custava <b>${F(rel * 100, rel < 0.01 ? 4 : 1)}%</b> do preço de hoje.`, `Purchasing power: the same product cost <b>${F(rel * 100, rel < 0.01 ? 4 : 1)}%</b> of today's price.`);
    if (!fromSlider) root.querySelector("#pmR").value = st.pm.i;
    const ch = MB.charts["mu_pm"]; ch?.setOption({ series: [{}, { markLine: { data: [{ xAxis: MB.ymMs(ym) }] } }] });
  }

  /* ------------------------- sala 4: hiperinflação ------------------------- */
  const hyperCard = () => MB.tsCard("mu_hyper", {
    title: t("Inflação mensal, 1980–1994", "Monthly inflation, 1980–1994"), sub: t("IPCA de cada mês, até o último mês antes do Real", "IPCA for each month, up to the last month before the Real"), src: ["sgs:ipca"], ranges: [], height: 330, yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 1) + "%",
    series: () => [{ name: "IPCA", color: C.btc, type: "bar", data: MB.ser("ipca").filter((p) => p[0] <= "1994-06") }],
    big: (S0) => { const d = S0[0].data, mx = d.reduce((a, b) => (b[1] > a[1] ? b : a)), dbl = Math.log(2) / Math.log(1 + mx[1] / 100) * 30; return t(`Pico: <span class="neg">${F(mx[1], 1)}%</span> em ${MB.ymLabel(mx[0])} — preços dobrando em ~${F(dbl, 0)} dias`, `Peak: <span class="neg">${F(mx[1], 1)}%</span> in ${MB.ymLabel(mx[0])} — prices doubling in ~${F(dbl, 0)} days`); },
  });
  const yearsCard = () => MB.card("mu_years", { title: t("Inflação de cada ano, 1980–1995", "Inflation of each year, 1980–1995"), sub: t("IPCA acumulado no ano-calendário", "IPCA accumulated over the calendar year"), src: ["sgs:ipca"], height: 330,
    build() { const by = MB.byYear(MB.ser("ipca")).filter((x) => +x[0] >= 1980 && +x[0] <= 1995); if (!by.length) return null; return { option: MB.hbar(by.map((x) => ({ name: x[0], value: x[1], color: +x[0] <= 1994 && x[1] > 100 ? C.red : C.btc })), { fmt: (v) => F(v, 0) + "%", sorted: false }), big: "", table: { cols: [t("Ano", "Year"), "IPCA"], rows: by.map((x) => [x[0], F(x[1], 1) + "%"]) } }; } });

  /* ------------------------- sala 5: mundo ------------------------- */
  const wInfl = (y) => Object.entries(MB.D.world?.inflation || {}).map(([iso, o]) => [iso, o[y]]).filter((x) => x[1] != null && isFinite(x[1]));
  const wYears = () => { const a = Object.values(MB.D.world?.inflation || {}).flatMap((o) => Object.keys(o).map(Number)); return a.length ? [Math.min(...a), Math.max(...a)] : [1960, new Date().getFullYear() - 1]; };
  const wCtrl = () => { const [y0, y1] = wYears(); return `<div class="seg" style="align-items:center"><button type="button" data-wplay>${st.wplay ? "❚❚" : "▶"}</button><span class="mono" style="padding:0 10px;min-width:48px;color:#fff" id="wYear">${st.wy}</span></div><input id="wRange" type="range" min="${y0}" max="${y1}" value="${st.wy}" style="width:min(240px,40vw)">`; };
  const wData = () => { const rows = wInfl(st.wy), sorted = rows.slice().sort((a, b) => b[1] - a[1]), bra = sorted.findIndex((x) => x[0] === "BRA"); return { rows, sorted, bra }; };
  const worldCard = () => MB.card("mu_world", {
    title: t("Mapa-múndi da inflação", "World inflation map"), sub: t("Variação anual dos preços ao consumidor, país a país (Banco Mundial). Arraste o ano ou aperte ▶ para ver as crises passarem.", "Annual consumer-price change, country by country (World Bank). Drag the year or press ▶ to watch the crises pass."), src: ["wb"], height: 470, ctrl: wCtrl,
    onClick(e, el) { if (e.target.closest("[data-wplay]")) { if (st.wplay) { clearInterval(st.wplay); st.wplay = null; } else { const [y0, y1] = wYears(); st.wplay = setInterval(() => { st.wy = st.wy >= y1 ? y0 : st.wy + 1; if (!el.isConnected) { clearInterval(st.wplay); st.wplay = null; return; } el.querySelector("[data-ctrl]").innerHTML = wCtrl(); wFast(el); }, 700); } el.querySelector("[data-ctrl]").innerHTML = wCtrl(); } },
    onInput(e, el) { if (e.target.id === "wRange") { st.wy = +e.target.value; el.querySelector("#wYear").textContent = st.wy; wFast(el); } },
    build() {
      if (!MB.geo?.world) return { loading: true }; const { rows, sorted, bra } = wData(); if (!rows.length) return null;
      const o = { backgroundColor: "transparent", tooltip: { trigger: "item", backgroundColor: C.tipBg, borderColor: C.tipBorder, textStyle: { color: "#fff", fontSize: 13 }, formatter: (p) => (p.value == null || isNaN(p.value) ? "" : `<b>${MB.esc(MB.D.world?.names?.[p.name] || p.name)}</b> · ${st.wy}<br>${F(p.value, 1)}%`) },
        visualMap: { type: "piecewise", orient: "horizontal", left: 12, bottom: 4, itemWidth: 14, itemHeight: 10, textStyle: { color: C.text, fontSize: 11 }, pieces: [{ lt: 0, label: "<0", color: "#1fb5a8" }, { gte: 0, lt: 3, label: "0–3", color: "#3d3378" }, { gte: 3, lt: 6, label: "3–6", color: "#6f5fd0" }, { gte: 6, lt: 12, label: "6–12", color: "#9085e9" }, { gte: 12, lt: 25, label: "12–25", color: "#ffc266" }, { gte: 25, lt: 100, label: "25–100", color: "#ff8a00" }, { gte: 100, label: "100+", color: "#cc080c" }] },
        series: [{ type: "map", map: "world", nameProperty: "iso3", roam: true, scaleLimit: { min: 1, max: 6 }, zoom: 1.1, top: 6, bottom: 34, itemStyle: { areaColor: "#15121c", borderColor: "#2c2540", borderWidth: 0.5 }, emphasis: { label: { show: false }, itemStyle: { areaColor: "#ffb15c" } }, data: rows.map(([iso, v]) => ({ name: iso, value: v, ...(iso === "BRA" ? { itemStyle: { borderColor: "#fff", borderWidth: 1.6 } } : {}) })) }] };
      return { option: o, big: bra >= 0 ? t(`${st.wy}: Brasil <span class="mono">${F(sorted[bra][1], 1)}%</span> · ${bra + 1}º maior entre ${sorted.length} países`, `${st.wy}: Brazil <span class="mono">${F(sorted[bra][1], 1)}%</span> · ${bra + 1}th highest of ${sorted.length} countries`) : "", table: { cols: [t("País", "Country"), "%"], rows: sorted.map(([iso, v]) => [MB.D.world?.names?.[iso] || iso, F(v, 1)]) } };
    },
  });
  function wRank() { const { sorted, bra } = wData(); const top = sorted.slice(0, 10).map(([iso, v]) => ({ name: MB.D.world?.names?.[iso] || iso, v, br: iso === "BRA" })); if (bra >= 10) top.push({ name: `#${bra + 1} ${MB.D.world.names.BRA}`, v: sorted[bra][1], br: true }); const mx = Math.max(...top.map((x) => x.v), 1); return `<ul class="rank">${top.map((x) => `<li class="${x.br ? "on" : ""}"><span>${MB.esc(x.name)}<div class="bar" style="width:${Math.max(1, (x.v / mx) * 100)}%;background:${x.br ? C.btc : C.cdi}"></div></span><span class="val">${F(x.v, 0)}%</span></li>`).join("")}</ul>`; }
  function wFast(el) {
    const ch = MB.charts["mu_world"]; if (!ch) return; const { rows, sorted, bra } = wData();
    ch.setOption({ series: [{ data: rows.map(([iso, v]) => ({ name: iso, value: v, ...(iso === "BRA" ? { itemStyle: { borderColor: "#fff", borderWidth: 1.6 } } : {}) })) }] });
    const big = el.querySelector("[data-big]"); if (big && bra >= 0) big.innerHTML = t(`${st.wy}: Brasil <span class="mono">${F(sorted[bra][1], 1)}%</span> · ${bra + 1}º maior entre ${sorted.length} países`, `${st.wy}: Brazil <span class="mono">${F(sorted[bra][1], 1)}%</span> · ${bra + 1}th highest of ${sorted.length} countries`);
    const h = document.getElementById("wRankHost"); if (h) h.innerHTML = wRank(); const y = el.querySelector("#wYear"); if (y) y.textContent = st.wy; const r = el.querySelector("#wRange"); if (r && +r.value !== st.wy) r.value = st.wy;
  }

  /* ------------------------- salas (uma de cada vez; o conteúdo nasce na primeira visita) ------------------------- */
  const roomHead = (n, title, lead) => `<div class="room-title"><span class="rn">SALA ${n}</span><h2>${title}</h2></div>${lead ? `<p class="room-lead">${lead}</p>` : ""}`;
  function moedasAfter(el) {
    eraDetail();
    const cv = el.querySelector("#conv"); if (cv) { cv.addEventListener("input", () => convUpdate(cv)); cv.addEventListener("change", () => convUpdate(cv)); convUpdate(cv); }
  }
  function precosAfter(el) {
    const pmEl = el.querySelector("#pm"); if (!pmEl) return;
    const keys = pmKeys(); pmUpdate(pmEl);
    pmEl.querySelector("#pmR").addEventListener("input", (e) => { st.pm.i = +e.target.value; pmUpdate(pmEl, true); });
    pmEl.querySelector("#pmP").addEventListener("input", (e) => { st.pm.price = MB.parseNum(e.target.value) || 0; pmUpdate(pmEl); MB.rerender("mu_pm"); });
    pmEl.querySelector(".presets").addEventListener("click", (e) => { const b = e.target.closest("[data-j]"); if (b) { const i = keys.indexOf(b.dataset.j); if (i >= 0) { st.pm.i = i; pmUpdate(pmEl); } } });
    pmEl.querySelector("#pmPlay").addEventListener("click", (e) => {
      const btn = e.currentTarget; if (st.pm.play) { clearInterval(st.pm.play); st.pm.play = null; btn.textContent = "▶ " + t("Reproduzir a história", "Play history"); return; }
      if (st.pm.i >= keys.length - 2) st.pm.i = 0; btn.textContent = "❚❚ " + t("Pausar", "Pause");
      st.pm.play = setInterval(() => { if (!pmEl.isConnected || pmEl.closest("[hidden]")) { clearInterval(st.pm.play); st.pm.play = null; return; } st.pm.i = Math.min(keys.length - 1, st.pm.i + 1); pmUpdate(pmEl); if (st.pm.i >= keys.length - 1) { clearInterval(st.pm.play); st.pm.play = null; btn.textContent = "▶ " + t("Reproduzir a história", "Play history"); } }, 55);
    });
  }
  const ROOMS = () => [
    { id: "sala-historia", n: "01", title: t("A história do dinheiro", "The story of money"), sub: t("cinco capítulos com curiosidades e ilustrações", "five chapters with curiosities and illustrations"), build: () => MB.museu.story(), after: (el) => MB.museu.storyAfter(el) },
    { id: "sala-confisco", n: "02", star: 1, title: t("O confisco de 1990", "The 1990 savings freeze"), sub: t("o dia em que o dinheiro parou nos bancos", "the day money stopped in the banks"), build: () => MB.museu.confisco(), after: (el) => MB.museu.confiscoAfter(el) },
    { id: "sala-moedas", n: "03", title: t("As moedas e o conversor", "Currencies and converter"), sub: t("nove moedas, do mil-réis ao Real", "nine currencies, from mil-réis to the Real"), build: () => `${roomHead("03", t("As moedas do Brasil", "Brazil's currencies"), t("Toque em uma moeda para ver quando valeu, o ato legal, o que aconteceu com os preços e quanto vale em reais de hoje.", "Tap a currency to see when it was in force, the legal act, what happened to prices and what it is worth in today's reais."))}${gallery()}<p class="more-h" style="margin-top:24px">${t("Conversor de moedas históricas", "Historical currency converter")}</p>${conv()}`, after: moedasAfter },
    { id: "sala-precos", n: "04", title: t("Máquina de preços", "Price machine"), sub: t("viaje no tempo com um produto", "travel through time with a product"), build: () => `${roomHead("04", t("Máquina de preços", "Price machine"), t("Viaje no tempo com um produto e veja o preço mudar de moeda, de zeros e de tamanho.", "Travel through time with a product and watch its price change currency, zeros and size."))}${pm()}`, after: precosAfter },
    { id: "sala-hiper", n: "05", title: t("A hiperinflação em câmera lenta", "Hyperinflation in slow motion"), sub: t("mês a mês e ano a ano, 1980–1994", "month by month and year by year, 1980–1994"), build: () => `${roomHead("05", t("A hiperinflação em câmera lenta", "Hyperinflation in slow motion"), t("Entre 1980 e 1994 o Brasil conviveu com preços que subiam mais de 40% em um mês. Aqui, o ritmo.", "Between 1980 and 1994 Brazil lived with prices rising more than 40% in a month. Here, the pace."))}<div class="grid21">${hyperCard()}${yearsCard()}</div>` },
    { id: "sala-mundo", n: "06", title: t("A inflação pelo mundo", "Inflation around the world"), sub: t("mapa-múndi com ano a ano", "world map, year by year"), build: () => `${roomHead("06", t("A inflação pelo mundo", "Inflation around the world"), t("O Brasil não esteve sozinho nas crises de preços — e outros países as viveram em outras décadas.", "Brazil was not alone in price crises — and other countries lived through them in other decades."))}<div class="map-wrap"><div>${worldCard()}</div><article class="card"><p class="side-h">${t("Maiores inflações do ano", "Highest inflation of the year")}</p><div id="wRankHost">${wRank()}</div><div class="c-foot">${MB.chips(["wb"])}</div></article></div>`, after: () => MB.ensureGeo("world").then(() => MB.rerender("mu_world")) },
    { id: "sala-salario", n: "07", title: t("O salário mínimo desde 1940", "The minimum wage since 1940"), sub: t("tudo em reais de hoje", "all in today's reais"), build: () => `${roomHead("07", t("O salário mínimo desde 1940", "The minimum wage since 1940"), t("Oitenta e poucos anos de piso salarial, tudo em reais de hoje.", "Eighty-odd years of wage floor, all in today's reais."))}${MB.salLongCard("mu_sal")}` },
  ];
  function openRoom(panel, id, scroll) {
    const rooms = ROOMS(), r = rooms.find((x) => x.id === id) || rooms[0]; st.room = r.id;
    panel.querySelectorAll(".room-card").forEach((b) => { const on = b.dataset.room === r.id; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
    panel.querySelectorAll(".room").forEach((el) => { el.hidden = el.id !== r.id; });
    const el = panel.querySelector("#" + r.id); if (!el) return;
    if (!el.dataset.ready) { el.dataset.ready = "1"; el.innerHTML = r.build(); MB.mount(el); MB.reveal(el); try { r.after?.(el); } catch (e) { console.error("[sala " + r.id + "]", e); } }
    else requestAnimationFrame(() => MB.resizeIn(el));
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    if (scroll) panel.querySelector("#roomStage")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (history.replaceState && location.hash.startsWith("#/museu")) history.replaceState(null, "", "#/museu/" + r.id);
  }

  MB.tabs.museu = {
    render(panel) {
      const rooms = ROOMS();
      panel.innerHTML = `${hall()}
        <div class="rooms reveal" role="group" aria-label="${t("Salas do museu", "Museum rooms")}">${rooms.map((r) => `<button type="button" class="room-card${r.star ? " star" : ""}" data-room="${r.id}" aria-pressed="false"><span class="rn">SALA ${r.n}</span><b>${r.title}</b><span class="rs">${r.sub}</span></button>`).join("")}</div>
        <div id="roomStage">${rooms.map((r) => `<section class="room" id="${r.id}" hidden></section>`).join("")}</div>
        <p class="disclaimer">${t("Fontes e método: o índice de preços encadeia o IGP-DI (1944–1979) e o IPCA (desde 1980); os fatores de conversão vêm dos atos que instituíram cada moeda. Para as moedas e cédulas em si, visite o Museu de Valores do Banco Central.", "Sources and method: the price index chains the IGP-DI (1944–1979) and the IPCA (from 1980); conversion factors come from the acts that instituted each currency. For the actual coins and banknotes, visit the central bank's Museu de Valores.")} <a href="https://museuvalores.bcb.gov.br/" target="_blank" rel="noopener">museuvalores.bcb.gov.br ↗</a></p>`;
    },
    after(panel) {
      const big = panel.querySelector("#hallBig"); if (big) { const to = +big.dataset.to; big.textContent = "0"; const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { MB.countUp(big, to, (v) => F(v, 0), 2400); io.disconnect(); } }); io.observe(big); setTimeout(() => { if (big.textContent === "0") MB.countUp(big, to, (v) => F(v, 0), 1800); }, 3000); }
      if (panel._museuClick) panel.removeEventListener("click", panel._museuClick);
      panel._museuClick = (e) => {
        const gb = e.target.closest("[data-gal]"); if (gb) { const g = panel.querySelector("#gallery"); g?.scrollBy({ left: +gb.dataset.gal * g.clientWidth * 0.75, behavior: "smooth" }); return; }
        const r = e.target.closest("[data-room]"); if (r) { openRoom(panel, r.dataset.room, true); return; }
        const c = e.target.closest("[data-era]"); if (c) { st.era = c.dataset.era; panel.querySelectorAll(".era").forEach((x) => x.classList.toggle("on", x === c)); eraDetail(); }
      };
      panel.addEventListener("click", panel._museuClick);
      if (panel._museuKey) panel.removeEventListener("keydown", panel._museuKey);
      panel._museuKey = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches(".era")) { e.preventDefault(); e.target.click(); } };
      panel.addEventListener("keydown", panel._museuKey);
      const fromHash = location.hash.replace(/^#\/?/, "").split("/")[1];
      openRoom(panel, ROOMS().some((r) => r.id === fromHash) ? fromHash : st.room || "sala-historia", false);
    },
  };
})();
