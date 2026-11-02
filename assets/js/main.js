/* Monitor Brasil — roteador de abas, "chrome" da página (fita, banner, rodapé) e laço ao vivo. */
(() => {
  "use strict";
  const MB = window.MB, { $, $$, esc } = MB, t = (...a) => MB.t(...a);
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICON = {
    painel: svg('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
    poder: svg('<path d="M3 7l6 6 4-4 8 8"/><path d="M17 17h4v-4"/>'),
    inflacao: svg('<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>'),
    juros: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'),
    familias: svg('<path d="M3 11l9-8 9 8v10H3z"/><path d="M9 21v-6h6v6"/>'),
    divida: svg('<path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-7 10 7"/>'),
    pix: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    bitcoin: svg('<path d="M9 5v14M9 5h5.5a3.5 3.5 0 010 7H9m0 0h6a3.5 3.5 0 010 7H9M11 3v2M14 3v2M11 19v2M14 19v2"/>'),
    museu: svg('<path d="M3 21h18M4 10h16M12 3l9 5H3zM6 10v8M10 10v8M14 10v8M18 10v8"/>'),
    dados: svg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  };
  const TABS = [
    { id: "painel", label: ["Painel", "Dashboard"] },
    { id: "poder", label: ["Poder de compra", "Purchasing power"], title: ["A corrosão do Real", "The erosion of the Real"], desc: ["Quanto vale hoje o dinheiro de ontem — e quanto você precisa ter para não perder poder de compra.", "What yesterday's money is worth today — and how much you need to avoid losing purchasing power."] },
    { id: "inflacao", label: ["Inflação", "Inflation"], title: ["Inflação: do índice ao bolso", "Inflation: index to pocket"], desc: ["O quanto os preços sobem, o que pesa no seu bolso e como calcular a inflação entre duas datas.", "How fast prices rise, what weighs on your pocket and how to compute inflation between two dates."] },
    { id: "juros", label: ["Juros e crédito", "Rates & credit"], title: ["Juros e crédito", "Interest rates & credit"], desc: ["O preço do dinheiro: juro básico, cartão de crédito e cheque especial.", "The price of money: the base rate, credit cards and overdrafts."] },
    { id: "familias", label: ["Famílias", "Households"], title: ["Endividamento das famílias", "Household debt"], desc: ["Quanto da renda vai para dívidas, quem está com contas atrasadas e como anda o emprego.", "How much income goes to debt, who is behind on payments and how jobs are doing."] },
    { id: "divida", label: ["Dívida pública", "Public debt"], title: ["Dívida do governo", "Government debt"], desc: ["Quanto o governo deve, quanto paga de juros e como isso se compara ao resto do mundo.", "How much the government owes, how much interest it pays and how that compares with the rest of the world."] },
    { id: "pix", label: ["Pix", "Pix"], title: ["Pix: Brasil e mundo", "Pix: Brazil and the world"], desc: ["Quanto o Pix já movimentou desde o lançamento, ano a ano — e como o Brasil se compara ao mundo.", "How much Pix has moved since launch, year by year — and how Brazil compares with the world."] },
    { id: "bitcoin", label: ["Bitcoin", "Bitcoin"], title: ["Real × Bitcoin: a proteção", "Real vs Bitcoin: the shield"], desc: ["Simule o que teria acontecido se você tivesse se protegido com Bitcoin — com os riscos à vista.", "Simulate what would have happened had you protected yourself with Bitcoin — with the risks in plain sight."] },
    { id: "museu", label: ["Museu do Real", "Real Museum"], title: ["Museu interativo do Real", "Interactive Museum of the Real"], desc: ["A história do dinheiro brasileiro, sala por sala: das moedas ao confisco da poupança, em 1990.", "The story of Brazilian money, room by room: from the coins to the 1990 savings freeze."] },
    { id: "dados", label: ["Dados e fontes", "Data & sources"], title: ["Dados, fontes e método", "Data, sources and method"], desc: ["De onde vem cada número, quando foi atualizado e como reproduzir.", "Where every number comes from, when it was updated and how to reproduce it."] },
  ];
  MB.TABS = TABS; MB.tabs = MB.tabs || {};
  let current = null, ready = false; const dirty = new Set(TABS.map((x) => x.id)); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ------------------------- chrome ------------------------- */
  function buildChrome() {
    const row = $("#tabsRow");
    row.innerHTML = `<span class="tab-ink" id="tabInk"></span>` + TABS.map((x) => `<button type="button" class="tab" role="tab" id="tab-${x.id}" aria-controls="panel-${x.id}" aria-selected="${x.id === current}" data-tab="${x.id}">${ICON[x.id]}<span>${MB.t(...x.label)}</span></button>`).join("");
    const main = $("#main");
    TABS.forEach((x) => { if (!$(`#panel-${x.id}`)) { const s = document.createElement("section"); s.className = "panel"; s.id = `panel-${x.id}`; s.setAttribute("role", "tabpanel"); s.setAttribute("aria-labelledby", `tab-${x.id}`); main.appendChild(s); } });
    $$("#lang button").forEach((b) => b.classList.toggle("on", b.dataset.l === MB.lang));
    const bs = $(".brand-sub"); if (bs) bs.textContent = t("Monitor Brasil", "Brazil Monitor");
    heroCopy();
    $("#footRow").innerHTML = `<div><span class="signoff">Opt Out</span> · ${t("Área Bitcoin Research. Conteúdo informativo; não é recomendação de investimento. Bitcoin é um ativo volátil e rentabilidade passada não garante resultados futuros.", "Área Bitcoin Research. Informational content; not investment advice. Bitcoin is a volatile asset and past performance does not guarantee future results.")}</div><div class="mono muted">v${MB.version}</div>`;
    emptyNotice();
    moveInk();
  }
  function heroCopy() {
    const loss = MB.powerNow?.("1994-07"); const pctLoss = loss != null ? (1 - loss) * 100 : null;
    $("#heroCopy").innerHTML = `
      <p class="mast">${t("Monitor Brasil · Área Bitcoin Research", "Brazil Monitor · Área Bitcoin Research")}</p>
      <h1>${t("O Real perdeu", "The Real has lost")} <em id="heroLoss">${pctLoss != null ? MB.fmt(pctLoss, 1) + "%" : "—"}</em> ${t("do poder de compra desde o <u>Plano Real</u>.", "of its purchasing power since the <u>Real Plan</u>.")}</h1>
      <p class="lede">${t("Inflação, juros, endividamento, dívida pública, Pix e Bitcoin num só lugar: <b>dados oficiais</b> do Banco Central, IBGE, FMI e BIS, atualizados continuamente, com a fonte de cada número à vista.", "Inflation, interest rates, household debt, public debt, Pix and Bitcoin in one place: <b>official data</b> from Brazil's central bank, IBGE, IMF and BIS, continuously updated, with the source of every number in view.")}</p>
      <div class="ctas"><button class="btn btn-primary" type="button" data-go="#kpis">${t("Ver o painel", "See the dashboard")} ↓</button><button class="btn" type="button" data-tab-go="poder">${t("Quanto vale meu dinheiro?", "What is my money worth?")}</button><button class="btn" type="button" data-tab-go="museu">${t("Museu do Real", "Real Museum")}</button></div>`;
    if (pctLoss != null && !MB._heroAnim && current === "painel") { MB._heroAnim = true; MB.countUp($("#heroLoss"), pctLoss, (v) => MB.fmt(v, 1) + "%", 1800); }
    const tab = TABS.find((x) => x.id === current);
    $("#pageHead").innerHTML = tab?.title ? `<p class="kicker">${t("Monitor Brasil", "Brazil Monitor")} · ${MB.t(...tab.label)}</p><h2>${MB.t(...tab.title)}</h2><p>${MB.t(...tab.desc)}</p>` : "";
  }
  function emptyNotice() {
    const el = $("#emptyNotice"), b = MB.boot;
    if (b?.state === "running") { const pct = b.total ? Math.round((b.n / b.total) * 100) : 0; el.innerHTML = `<div class="callout" style="margin-top:24px"><b>${t("Carregando as séries oficiais direto do Banco Central…", "Loading the official series straight from the central bank…")}</b> <span class="mono">${pct}%</span><div class="meter"><div style="width:${pct}%"></div></div></div>`; return; }
    if (MB.empty && MB.booted) { el.innerHTML = `<div class="callout" style="margin-top:24px"><b>${t("Modo ao vivo parcial.", "Partial live mode.")}</b> ${t("Os dados foram carregados direto das fontes oficiais, neste navegador. Dívida pública no mundo (FMI), expectativas do mercado (Focus) e juros por banco só aparecem depois da primeira coleta automática (veja a aba <b>Dados e fontes</b>).", "The data was loaded straight from the official sources, in this browser. Public debt worldwide (IMF), market expectations (Focus) and rates by bank only show up after the first automatic collection (see the <b>Data &amp; sources</b> tab).")}</div>`; return; }
    el.innerHTML = MB.empty ? `<div class="callout warn" style="margin-top:24px"><b>${t("Os dados ainda não foram coletados.", "Data has not been collected yet.")}</b> ${t("Rode <span class='mono'>node scripts/collect.mjs --full</span> (ou execute o workflow “Atualizar dados e publicar” no GitHub). Enquanto isso, só os indicadores ao vivo (Bitcoin, dólar, Selic, IPCA) aparecem.", "Run <span class='mono'>node scripts/collect.mjs --full</span> (or trigger the “Update data and publish” workflow on GitHub). Meanwhile only the live indicators (Bitcoin, dollar, Selic, IPCA) show up.")}</div>` : "";
  }
  function moveInk() {
    const sel = $(`#tab-${current}`), ink = $("#tabInk"); if (!sel || !ink) return;
    ink.style.left = sel.offsetLeft + "px"; ink.style.width = sel.offsetWidth + "px";
    sel.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  /* ------------------------- fita ------------------------- */
  function renderTape() {
    const list = (MB.kpiList?.() || []).filter((k) => k.tape);
    const item = (k) => `<span class="tape-item">${esc(k.short || k.label)} <b ${k.live ? `data-live="${k.live}"` : ""}>${k.value}</b>${k.change ? ` <span class="${k.changeCls || ""}" ${k.liveChg ? `data-live="${k.liveChg}"` : ""}>${k.change}</span>` : ""}</span>`;
    const html = list.map(item).join("");
    $("#tapeTrack").innerHTML = html + html;
  }

  /* ------------------------- abas ------------------------- */
  function renderPanel(id) {
    const panel = $(`#panel-${id}`), mod = MB.tabs[id];
    MB.disposeIn(panel);
    try { mod.render(panel); } catch (e) { console.error("[aba " + id + "]", e); panel.innerHTML = `<div class="err-banner" style="margin-top:20px">${t("Não foi possível desenhar esta aba.", "This tab could not be drawn.")} <span class="mono">${esc(e.message)}</span></div>`; }
    MB.mount(panel); MB.reveal(panel); try { mod.after?.(panel); } catch (e) { console.error("[aba " + id + " after]", e); }
    dirty.delete(id);
  }
  async function show(id, anchor) {
    if (!TABS.some((x) => x.id === id)) id = "painel";
    const prev = current, same = prev === id;
    if (!same && prev) { const pp = $(`#panel-${prev}`); pp.classList.remove("active"); pp.classList.add("leaving"); await sleep(150); pp.classList.remove("leaving"); }
    current = id; document.body.dataset.tab = id;
    $$(".tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    const panel = $(`#panel-${id}`);
    if (dirty.has(id)) renderPanel(id);
    panel.classList.add("active");
    requestAnimationFrame(() => MB.resizeIn(panel));
    moveInk(); heroCopy(); MB.hero?.mode(id !== "painel");
    document.title = (MB.tabs[id]?.title ? MB.t(...TABS.find((x) => x.id === id).label) + " · " : "") + "Monitor Brasil — Real × Bitcoin · Área Bitcoin";
    if (!same) window.scrollTo({ top: 0, behavior: anchor ? "auto" : "smooth" });
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    MB.emit("tab", id);
  }
  const route = () => { const [id, anchor] = location.hash.replace(/^#\/?/, "").split("/"); show(id || "painel", anchor); };

  /* ------------------------- ao vivo ------------------------- */
  const LIVE = {
    btcBrl: () => MB.brl(MB.btcNow(), 0),
    btcUsd: () => MB.usd(MB.btcUsdNow(), 0),
    usdBrl: () => MB.brl(MB.usdBrl(), 4),
    sats: () => MB.fmt(MB.sats(MB.btcNow()), 0) + " sats",
    satsN: () => MB.fmt(MB.sats(MB.btcNow()), 0),
    btcChg: (el) => { const c = MB.live.chg24; if (c == null) return ""; el.classList.toggle("up", c >= 0); el.classList.toggle("down", c < 0); return (c >= 0 ? "▲ " : "▼ ") + MB.pct(Math.abs(c), 2); },
    height: () => (MB.live.height ? MB.fmt(MB.live.height) : "—"),
    feeFast: () => (MB.live.fees ? MB.fmt(MB.live.fees.fastestFee) + " sat/vB" : "—"),
    feeHour: () => (MB.live.fees ? MB.fmt(MB.live.fees.hourFee) + " sat/vB" : "—"),
  };
  MB.liveFns = LIVE;
  let lastBtc = null;
  function updateLive() {
    for (const el of $$("[data-live]")) { const f = LIVE[el.dataset.live]; if (!f) continue; const txt = f(el); if (txt !== el.textContent) el.textContent = txt; }
    const b = MB.live.btcBrl;
    if (b && lastBtc && b !== lastBtc) $$('[data-live="btcBrl"]').forEach((el) => MB.flash(el, b > lastBtc));
    lastBtc = b || lastBtc;
    const ok = ["binance", "foxbit", "coinbase", "coingecko", "awesomeapi"].some((k) => MB.live.src[k]?.ok && Date.now() - MB.live.src[k].at < 90000);
    $("#liveDot").classList.toggle("on", ok); $("#liveTxt").textContent = ok ? t("AO VIVO", "LIVE") : t("SNAPSHOT", "SNAPSHOT");
    $(".live").title = ok ? t("Cotações em tempo real conectadas", "Real-time quotes connected") : t("Sem conexão com as cotações ao vivo — mostrando o último dado coletado", "No live quotes — showing last collected data");
  }
  function tickLoop() {
    for (const el of $$("[data-tick]")) { const f = MB.tickFns?.[el.dataset.tick]; if (f) { const x = f(); if (x !== el.textContent) el.textContent = x; } }
    $("#clock").textContent = new Intl.DateTimeFormat(MB.loc(), { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Sao_Paulo" }).format(new Date()) + " BRT";
  }

  /* ------------------------- inicialização ------------------------- */
  let redrawT;
  const typing = () => { const a = document.activeElement; return !!a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && !!a.closest(".panel"); };
  const redrawActive = (tries = 0) => {
    clearTimeout(redrawT);
    redrawT = setTimeout(() => {
      if (typing() && tries < 20) { redrawActive(tries + 1); return; }   // não apaga o que a pessoa está digitando
      const openMore = current ? [...$$(`#panel-${current} details.more[open]`)].map((d) => d.dataset.more) : [];
      TABS.forEach((x) => dirty.add(x.id));
      if (current) { const y = window.scrollY; renderPanel(current); requestAnimationFrame(() => { MB.resizeIn($(`#panel-${current}`)); openMore.forEach((id) => MB.openMore?.(id)); window.scrollTo(0, y); }); }
      renderTape(); heroCopy(); updateLive();
    }, tries ? 800 : 60);
  };
  function bind() {
    $("#tabsRow").addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (b) location.hash = "#/" + b.dataset.tab; });
    $("#lang").addEventListener("click", (e) => { const b = e.target.closest("button[data-l]"); if (b && b.dataset.l !== MB.lang) MB.setLang(b.dataset.l); });
    document.addEventListener("click", (e) => {
      const g = e.target.closest("[data-tab-go]"); if (g) { location.hash = "#/" + g.dataset.tabGo + (g.dataset.anchor ? "/" + g.dataset.anchor : ""); return; }
      const s = e.target.closest("[data-go]"); if (s) { const el = document.querySelector(s.dataset.go); el?.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    window.addEventListener("hashchange", route);
    window.addEventListener("resize", () => { clearTimeout(MB._ink); MB._ink = setTimeout(moveInk, 120); });
    MB.on("lang", () => { buildChrome(); redrawActive(); });
    MB.on("data", () => { if (!ready) return; emptyNotice(); redrawActive(); });
    MB.on("live", updateLive);
  }
  async function init() {
    document.documentElement.lang = MB.lang === "pt" ? "pt-BR" : "en";
    const first = location.hash.replace(/^#\/?/, "").split("/")[0] || "painel"; current = TABS.some((x) => x.id === first) ? first : "painel";
    document.body.dataset.tab = current;
    buildChrome(); MB.hero?.init(current !== "painel");
    bind();
    $("#panel-" + current).innerHTML = `<div class="skeleton" style="height:340px;margin-top:20px"></div>`;
    await MB.load();
    buildChrome(); renderTape();
    MB.on("boot", emptyNotice);
    const bootP = MB.bootstrapIfNeeded().catch((e) => { console.warn("[boot]", e); return false; });
    bootP.then(() => MB.bootstrapExtras?.()).catch((e) => console.warn("[boot-x]", e));   // Pix, Bitcoin, Banco Mundial, BIS, IBGE, Ipeadata (se faltarem)
    if (MB.empty) { emptyNotice(); await bootP; buildChrome(); renderTape(); } // sem snapshot: espera o Banco Central responder
    const prevCurrent = current; current = null; await show(prevCurrent, location.hash.split("/")[2]);
    ready = true; updateLive(); tickLoop(); setInterval(tickLoop, 250);
    MB.live.start();
    // ao receber os primeiros dados ao vivo, atualiza fita e contadores sem redesenhar tudo
    setTimeout(renderTape, 4000);
  }
  init();
})();
