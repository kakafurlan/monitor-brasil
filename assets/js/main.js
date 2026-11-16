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
    dinheiro: svg('<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M16 12.5h2M2 10h20"/><path d="M6 6l9-3 2 3"/>'),
    economia: svg('<path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-7 10 7"/>'),
    explorar: svg('<circle cx="12" cy="12" r="9.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
    glossario: svg('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5M8 7h7M8 11h5"/>'),
    dados: svg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
  };
  /* Páginas (cada uma é um módulo MB.tabs[id]) agrupadas em 5 áreas principais. "Dados e fontes" fica fora das áreas:
     é uma camada permanente de transparência, no cabeçalho e no rodapé. */
  const TABS = [
    { id: "painel", area: "painel", label: ["Visão geral", "Overview"] },
    { id: "poder", area: "dinheiro", label: ["Poder de compra e salário", "Purchasing power & wages"], title: ["Quanto o meu dinheiro perdeu?", "How much has my money lost?"], desc: ["Quanto vale hoje o dinheiro de ontem, o salário mínimo em reais de hoje e calculadoras para a sua realidade.", "What yesterday's money is worth today, the minimum wage in today's reais and calculators for your own situation."] },
    { id: "inflacao", area: "dinheiro", label: ["Inflação e calculadora", "Inflation & calculator"], title: ["Quanto os preços estão subindo?", "How fast are prices rising?"], desc: ["A inflação oficial, o que mais pesa no bolso e quanto os preços subiram entre duas datas quaisquer.", "Official inflation, what weighs most on your pocket and how much prices rose between any two dates."] },
    { id: "juros", area: "economia", label: ["Juros e crédito", "Rates & credit"], title: ["Quanto custa pegar dinheiro emprestado?", "How much does borrowing cost?"], desc: ["O juro básico da economia e o que os bancos cobram no cartão e no cheque especial.", "The economy's base rate and what banks charge on cards and overdrafts."] },
    { id: "familias", area: "economia", label: ["Famílias", "Households"], title: ["As famílias conseguem pagar as contas?", "Can households pay their bills?"], desc: ["Quanto da renda vai para dívidas, quem está com contas atrasadas e como anda o emprego.", "How much income goes to debt, who is behind on payments and how jobs are doing."] },
    { id: "divida", area: "economia", label: ["Dívida pública", "Public debt"], title: ["Quanto o governo deve — e quanto paga de juros?", "How much does the government owe — and pay in interest?"], desc: ["A dívida do governo em reais e em proporção do PIB, os juros que ela custa e o Brasil frente ao mundo.", "Government debt in reais and as a share of GDP, the interest it costs and Brazil against the world."] },
    { id: "pix", area: "economia", label: ["Pix e pagamentos", "Pix & payments"], title: ["Como o Brasil paga e movimenta dinheiro", "How Brazil pays and moves money"], desc: ["O Pix desde o lançamento, ano a ano, ao lado de cartões e boletos — e o Brasil frente aos sistemas do mundo.", "Pix since launch, year by year, next to cards and boletos — and Brazil against the world's systems."] },
    { id: "bitcoin", area: "bitcoin", label: ["Bitcoin", "Bitcoin"], title: ["Como o Bitcoin se comportou em diferentes períodos?", "How has Bitcoin behaved across different periods?"], desc: ["Comparação já descontada a inflação, simulador de aportes, quedas, escassez e a rede — com os riscos à vista.", "Inflation-adjusted comparison, purchase simulator, drawdowns, scarcity and the network — with the risks in plain sight."] },
    { id: "museu", area: "explorar", label: ["Museu do Real", "Real Museum"], title: ["Como chegamos ao Real?", "How did we get to the Real?"], desc: ["A história do dinheiro brasileiro, sala por sala: das moedas ao confisco da poupança, em 1990.", "The story of Brazilian money, room by room: from the coins to the 1990 savings freeze."] },
    { id: "glossario", area: "explorar", label: ["Glossário e perguntas", "Glossary & FAQ"], title: ["Glossário e perguntas frequentes", "Glossary and frequently asked questions"], desc: ["Os termos do monitor em linguagem simples — e respostas curtas para as dúvidas mais comuns.", "The monitor's terms in plain language — and short answers to the most common questions."] },
    { id: "dados", area: null, label: ["Dados e fontes", "Data & sources"], title: ["De onde vem cada número?", "Where does every number come from?"], desc: ["Fonte, data e frequência de cada série, o que é ao vivo, mensal, estimativa ou projeção — e como reproduzir.", "Source, date and frequency of every series, what is live, monthly, an estimate or a projection — and how to reproduce it."] },
  ];
  const AREAS = [
    { id: "painel", label: ["Visão geral", "Overview"], pages: ["painel"] },
    { id: "dinheiro", label: ["Seu dinheiro", "Your money"], pages: ["poder", "inflacao"] },
    { id: "economia", label: ["Economia brasileira", "Brazil's economy"], pages: ["juros", "familias", "divida", "pix"] },
    { id: "bitcoin", label: ["Bitcoin", "Bitcoin"], pages: ["bitcoin"] },
    { id: "explorar", label: ["Explorar", "Explore"], pages: ["museu", "glossario"] },
  ];
  const pageOf = (id) => TABS.find((x) => x.id === id), areaOf = (id) => AREAS.find((a) => a.id === pageOf(id)?.area);
  const lastInArea = {};
  MB.AREAS = AREAS;
  MB.TABS = TABS; MB.tabs = MB.tabs || {};
  let current = null, ready = false; const dirty = new Set(TABS.map((x) => x.id)); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ------------------------- chrome ------------------------- */
  function buildChrome() {
    const row = $("#tabsRow");
    const curArea = pageOf(current)?.area;
    row.innerHTML = `<span class="tab-ink" id="tabInk"></span>` + AREAS.map((a) => `<button type="button" class="tab" id="tab-${a.id}" aria-current="${a.id === curArea ? "page" : "false"}" aria-selected="${a.id === curArea}" data-area="${a.id}">${ICON[a.id]}<span>${MB.t(...a.label)}</span></button>`).join("");
    const main = $("#main");
    TABS.forEach((x) => { if (!$(`#panel-${x.id}`)) { const s = document.createElement("section"); s.className = "panel"; s.id = `panel-${x.id}`; s.setAttribute("aria-label", MB.t(...x.label)); main.appendChild(s); } });
    const tl = $("#topSrc"); if (tl) tl.innerHTML = `${ICON.dados}<span>${t("Dados e fontes", "Data & sources")}</span>`;
    $$("#lang button").forEach((b) => b.classList.toggle("on", b.dataset.l === MB.lang));
    const bs = $(".brand-sub"); if (bs) bs.textContent = t("Monitor Brasil", "Brazil Monitor");
    heroCopy();
    $("#footRow").innerHTML = `<nav class="foot-nav" aria-label="${t("Mapa do site", "Site map")}">${AREAS.map((a) => a.pages.length > 1 ? `<div><b>${MB.t(...a.label)}</b>${a.pages.map((p) => `<a href="#/${p}">${MB.t(...pageOf(p).label)}</a>`).join("")}</div>` : `<div><b><a class="foot-h" href="#/${a.pages[0]}">${MB.t(...a.label)}</a></b></div>`).join("")}<div><b>${t("Transparência", "Transparency")}</b><a href="#/dados">${t("Dados e fontes", "Data & sources")}</a><a href="#/dados/dados-05">${t("Método", "Method")}</a><a href="#/glossario">${t("Glossário", "Glossary")}</a></div></nav><div><span class="signoff">Opt Out</span> · ${t("Área Bitcoin Research. Conteúdo informativo; não é recomendação de investimento. Bitcoin é um ativo volátil e rentabilidade passada não garante resultados futuros.", "Área Bitcoin Research. Informational content; not investment advice. Bitcoin is a volatile asset and past performance does not guarantee future results.")}</div><div class="mono muted">v${MB.version}</div>`;
    emptyNotice();
    moveInk();
  }
  function heroCopy() {
    const pw = MB.powerNow?.("1994-07"), lastIpca = MB.last?.("ipca")?.[0];
    $("#heroCopy").innerHTML = `
      <p class="mast">${t("Monitor Brasil · Área Bitcoin Research", "Brazil Monitor · Área Bitcoin Research")}</p>
      <h1>${t("Seu dinheiro compra menos.<br><u>Entenda por quê.</u>", "Your money buys less.<br><u>Find out why.</u>")}</h1>
      <p class="lede">${t("Desde o Plano Real, a inflação reduziu o poder de compra da moeda. Veja o impacto no seu bolso e compare o que aconteceu com diferentes formas de proteção.", "Since the Real Plan, inflation has eroded the currency's purchasing power. See the impact on your pocket and compare what happened to different ways of protecting it.")}</p>
      ${pw != null ? `<div class="hero-stat"><p>${t("R$ 100 de julho de 1994 hoje compram o equivalente a", "R$ 100 from July 1994 today buys the equivalent of")}</p><b id="heroLoss">${MB.brl(pw * 100)}</b><p class="hs-src">${t("IPCA acumulado", "Cumulative IPCA")}${lastIpca ? ` ${t("até", "through")} ${MB.ymLabel(lastIpca)}` : ""} · ${t("IBGE, via Banco Central", "IBGE, via the central bank")} ${MB.kindBadges(["monthly"])}</p></div>` : ""}
      <div class="ctas"><button class="btn btn-primary" type="button" data-guide>${t("Entender em 3 passos", "Understand in 3 steps")} →</button><button class="btn" type="button" data-tab-go="poder" data-anchor="poder-01">${t("Calcular meu poder de compra", "Calculate my purchasing power")}</button></div>`;
    if (pw != null && !MB._heroAnim && current === "painel") { MB._heroAnim = true; const el = $("#heroLoss"); el._v = 100; MB.countUp(el, pw * 100, (v) => MB.brl(v), 1800); }
    const tab = pageOf(current), area = areaOf(current);
    $("#pageHead").innerHTML = tab?.title ? `<p class="kicker">${area ? MB.t(...area.label) : t("Transparência", "Transparency")} · ${MB.t(...tab.label)}</p><h2>${MB.t(...tab.title)}</h2><p>${MB.t(...tab.desc)}</p>` : "";
  }
  function emptyNotice() {
    const el = $("#emptyNotice"), b = MB.boot;
    if (b?.state === "running") { const pct = b.total ? Math.round((b.n / b.total) * 100) : 0; el.innerHTML = `<div class="callout" style="margin-top:24px"><b>${t("Carregando as séries oficiais direto do Banco Central…", "Loading the official series straight from the central bank…")}</b> <span class="mono">${pct}%</span><div class="meter"><div style="width:${pct}%"></div></div></div>`; return; }
    if (MB.empty && MB.booted) { el.innerHTML = `<div class="callout" style="margin-top:24px"><b>${t("Modo ao vivo parcial.", "Partial live mode.")}</b> ${t("Os dados foram carregados direto das fontes oficiais, neste navegador. Dívida pública no mundo (FMI), expectativas do mercado (Focus) e juros por banco só aparecem depois da primeira coleta automática (veja a aba <b>Dados e fontes</b>).", "The data was loaded straight from the official sources, in this browser. Public debt worldwide (IMF), market expectations (Focus) and rates by bank only show up after the first automatic collection (see the <b>Data &amp; sources</b> tab).")}</div>`; return; }
    el.innerHTML = MB.empty ? `<div class="callout warn" style="margin-top:24px"><b>${t("Os dados ainda não foram coletados.", "Data has not been collected yet.")}</b> ${t("Rode <span class='mono'>node scripts/collect.mjs --full</span> (ou execute o workflow “Atualizar dados e publicar” no GitHub). Enquanto isso, só os indicadores ao vivo (Bitcoin, dólar, Selic, IPCA) aparecem.", "Run <span class='mono'>node scripts/collect.mjs --full</span> (or trigger the “Update data and publish” workflow on GitHub). Meanwhile only the live indicators (Bitcoin, dollar, Selic, IPCA) show up.")}</div>` : "";
  }
  function moveInk() {
    const a = pageOf(current)?.area, sel = a ? $(`#tab-${a}`) : null, ink = $("#tabInk"); if (!ink) return;
    if (!sel) { ink.style.width = "0px"; return; }
    ink.style.left = sel.offsetLeft + "px"; ink.style.width = sel.offsetWidth + "px";
    sel.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  /* ------------------------- fita ------------------------- */
  function renderTape() {
    const all = MB.kpiList?.() || [], list = ["ipca12", "selic", "btc"].map((id) => all.find((k) => k.id === id)).filter(Boolean);
    const item = (k) => `<a class="tape-item" href="#/${k.tab}">${esc(k.short || k.label)} <b ${k.live ? `data-live="${k.live}"` : ""}>${k.value}</b>${k.change ? ` <span class="${k.changeCls || ""}" ${k.liveChg ? `data-live="${k.liveChg}"` : ""}>${k.change}</span>` : ""}</a>`;
    $("#tapeTrack").classList.add("static");
    $("#tapeTrack").innerHTML = list.map(item).join("");
  }

  /* ------------------------- subnavegação: páginas da área + "Nesta página" ------------------------- */
  let spy;
  function buildSubnav(id) {
    const host = $("#subnav"), panel = $(`#panel-${id}`), area = areaOf(id); if (!host) return;
    const secs = [...panel.querySelectorAll(":scope .sec")].map((el) => { const n = el.querySelector(".sec-num")?.textContent.trim(), h = el.querySelector(".sec-head h2")?.textContent.trim(); if (n && !el.id) el.id = `${id}-${n}`; return h ? [el.id, h] : null; }).filter(Boolean);
    const pages = area && area.pages.length > 1 ? `<div class="sub-pages" role="group" aria-label="${esc(MB.t(...area.label))}">${area.pages.map((p) => `<a href="#/${p}" aria-current="${p === id ? "page" : "false"}">${MB.t(...pageOf(p).label)}</a>`).join("")}</div>` : "";
    const toc = secs.length > 1 ? `<div class="sub-secs"><span class="sub-l">${t("Nesta página", "On this page")}</span>${secs.map(([sid, h]) => `<button type="button" data-jump="${sid}">${esc(h)}</button>`).join("")}</div>` : "";
    host.innerHTML = pages || toc ? `<div class="wrap subnav-row">${pages}${toc}</div>` : "";
    host.hidden = !(pages || toc);
    spy?.disconnect();
    if (secs.length > 1 && "IntersectionObserver" in window) {
      spy = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) $$("#subnav [data-jump]").forEach((b) => b.setAttribute("aria-current", String(b.dataset.jump === e.target.id))); }, { rootMargin: "-35% 0px -60% 0px" });
      secs.forEach(([sid]) => { const el = document.getElementById(sid); if (el) spy.observe(el); });
    }
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
    if (!TABS.some((x) => x.id === id) || !MB.tabs[id]) id = "painel";
    const prev = current, same = prev === id;
    if (!same && prev) { const pp = $(`#panel-${prev}`); pp.classList.remove("active"); pp.classList.add("leaving"); await sleep(150); pp.classList.remove("leaving"); }
    current = id; document.body.dataset.tab = id;
    const ar = pageOf(id)?.area; if (ar) lastInArea[ar] = id;
    $$(".tab").forEach((b) => { b.setAttribute("aria-selected", String(b.dataset.area === ar)); b.setAttribute("aria-current", b.dataset.area === ar ? "page" : "false"); });
    const panel = $(`#panel-${id}`);
    if (dirty.has(id)) renderPanel(id);
    panel.classList.add("active");
    buildSubnav(id);
    requestAnimationFrame(() => MB.resizeIn(panel));
    moveInk(); heroCopy(); MB.hero?.mode(id !== "painel");
    document.title = (id !== "painel" ? MB.t(...pageOf(id).label) + " · " : "") + "Monitor Brasil — Real × Bitcoin · Área Bitcoin";
    if (!same) window.scrollTo({ top: 0, behavior: anchor ? "auto" : "smooth" });
    if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), same ? 30 : 350);
    MB.emit("tab", id);
  }
  /* #/pagina/ancora?parametros — páginas antigas e nomes de área também funcionam */
  const route = () => { let [id, anchor] = location.hash.replace(/^#\/?/, "").split("?")[0].split("/"); const ar = AREAS.find((a) => a.id === id); if (ar && !pageOf(id)) id = lastInArea[ar.id] || ar.pages[0]; if (location.hash.includes("?") && id) dirty.add(id); show(id || "painel", anchor); };

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
      if (current) { const y = window.scrollY; renderPanel(current); buildSubnav(current); requestAnimationFrame(() => { MB.resizeIn($(`#panel-${current}`)); openMore.forEach((id) => MB.openMore?.(id)); window.scrollTo(0, y); }); }
      renderTape(); heroCopy(); updateLive();
    }, tries ? 800 : 60);
  };
  function bind() {
    $("#tabsRow").addEventListener("click", (e) => { const b = e.target.closest(".tab"); if (!b) return; const a = AREAS.find((x) => x.id === b.dataset.area); location.hash = "#/" + (lastInArea[a.id] || a.pages[0]); });
    $("#subnav").addEventListener("click", (e) => { const b = e.target.closest("[data-jump]"); if (b) document.getElementById(b.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" }); });
    $("#lang").addEventListener("click", (e) => { const b = e.target.closest("button[data-l]"); if (b && b.dataset.l !== MB.lang) MB.setLang(b.dataset.l); });
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-guide]")) { MB.guide?.open(); return; }
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
    let first = location.hash.replace(/^#\/?/, "").split("?")[0].split("/")[0] || "painel"; const ar0 = AREAS.find((a) => a.id === first && !pageOf(first)); if (ar0) first = ar0.pages[0]; current = TABS.some((x) => x.id === first) ? first : "painel";
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
    const prevCurrent = current; current = null; await show(prevCurrent, location.hash.split("?")[0].split("/")[2]);
    ready = true; updateLive(); tickLoop(); setInterval(tickLoop, 250);
    MB.live.start();
    // ao receber os primeiros dados ao vivo, atualiza fita e contadores sem redesenhar tudo
    setTimeout(renderTape, 4000);
  }
  init();
})();
