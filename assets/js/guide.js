/* MODO GUIADO — "Entender em 3 passos": os três capítulos da home em cerca de 60 segundos. */
(() => {
  "use strict";
  const MB = window.MB, F = MB.fmt, t = (...a) => MB.t(...a);
  const STEP_MS = 20000;
  let i = 0, timer = null, el = null, lastFocus = null;

  const sgn = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + F(Math.abs(v), 0) + "%";
  function steps() {
    const pw = MB.powerNow("1994-07"), i12 = MB.lastOf(MB.ipca12()), cr = MB.last("jurosCartRot"), lip = MB.last("ipca")[0];
    const btc = MB.btcM(), first = btc.length ? MB.ymAdd(btc[0][0], 1) : null, want = MB.ymAdd(MB.nowYm(), -60), start = first && want > first ? want : first;
    const c = start ? MB.compareFrom(start, { real: true }) : null, L = (k) => c?.[k]?.at(-1)?.[1], r = start ? MB.btcRisk?.(start) : null;
    return [
      { k: t("1 · Por que importa", "1 · Why it matters"), n: pw ? "+" + F((1 / pw - 1) * 100, 0) + "%" : "—",
        x: t(`Foi quanto os preços subiram desde o Plano Real, em 1994. Nos últimos 12 meses, a inflação foi de ${F(i12[1], 2)}% — e quem usa o rotativo do cartão paga ${cr[1] ? F(cr[1], 0) + "% ao ano" : "juros altíssimos"}.`, `That is how much prices have risen since the Real Plan in 1994. Over the last 12 months inflation was ${F(i12[1], 2)}% — and anyone using revolving card credit pays ${cr[1] ? F(cr[1], 0) + "% a year" : "sky-high interest"}.`),
        s: t(`IPCA · IBGE, via Banco Central${lip ? " · até " + MB.ymLabel(lip) : ""}`, `IPCA · IBGE, via central bank${lip ? " · through " + MB.ymLabel(lip) : ""}`), go: ["painel", "painel-01"] },
      { k: t("2 · Quanto o brasileiro perdeu", "2 · How much Brazilians lost"), n: pw ? MB.brl(pw * 100) : "—",
        x: t(`É o que R$ 100 de julho de 1994 compram hoje, em valores da época. Para comprar o mesmo que naquela data, você precisa de ${pw ? MB.brl(100 / pw, 0) : "muito mais"}.`, `That is what R$ 100 from July 1994 buys today, in that era's money. To buy the same as back then you need ${pw ? MB.brl(100 / pw, 0) : "much more"}.`),
        s: t("IPCA acumulado · IBGE, via Banco Central", "Cumulative IPCA · IBGE, via central bank"), go: ["painel", "painel-02"] },
      { k: t("3 · O que teria preservado", "3 · What would have preserved it"), n: L("cash") != null ? sgn(L("cash") - 100) : "—",
        x: c ? t(`É o que o dinheiro parado perdeu em 5 anos, já descontada a inflação. No mesmo período: renda fixa (CDI) ${sgn(L("cdi") - 100)}, dólar ${sgn(L("usd") - 100)} e Bitcoin ${sgn(L("btc") - 100)}${r ? ` — com uma queda de até ${sgn(r.mdd)} no caminho` : ""}. Volatilidade é risco real, e o passado não garante o futuro.`, `That is what idle cash lost in 5 years, after inflation. Over the same period: fixed income (CDI) ${sgn(L("cdi") - 100)}, dollar ${sgn(L("usd") - 100)} and Bitcoin ${sgn(L("btc") - 100)}${r ? ` — with a fall of up to ${sgn(r.mdd)} along the way` : ""}. Volatility is a real risk, and the past does not guarantee the future.`) : "",
        s: t("Bitcoin, PTAX, CDI e IPCA · preços de fim de mês", "Bitcoin, PTAX, CDI and IPCA · month-end prices"), go: ["painel", "painel-03"] },
    ];
  }
  function draw() {
    const S = steps(), s = S[i];
    el.querySelector(".gd-body").innerHTML = `<p class="gd-k">${s.k}</p><p class="gd-n">${s.n}</p><p class="gd-x">${s.x}</p><p class="gd-s">${s.s}</p>`;
    el.querySelector(".gd-dots").innerHTML = S.map((_, j) => `<button type="button" data-gd="${j}" aria-label="${t("Passo", "Step")} ${j + 1}" aria-current="${j === i}"><i style="${j < i ? "width:100%" : j === i ? `animation-duration:${STEP_MS}ms` : "width:0"}" class="${j === i ? "run" : ""}"></i></button>`).join("");
    el.querySelector("[data-gd-prev]").disabled = i === 0;
    el.querySelector("[data-gd-next]").textContent = i === S.length - 1 ? t("Ver os detalhes na página", "See the details on the page") : t("Próximo", "Next") + " →";
    clearTimeout(timer); if (i < S.length - 1) timer = setTimeout(() => { i++; draw(); }, STEP_MS);
  }
  function close(goTo) {
    clearTimeout(timer); if (!el) return;
    el.classList.remove("on"); document.body.style.overflow = "";
    setTimeout(() => { el?.remove(); el = null; }, 250);
    if (goTo) { location.hash = "#/" + goTo[0] + "/" + goTo[1]; if (location.hash === "#/" + goTo[0] + "/" + goTo[1]) setTimeout(() => document.getElementById(goTo[1])?.scrollIntoView({ behavior: "smooth", block: "start" }), 300); }
    lastFocus?.focus?.();
  }
  MB.guide = {
    open() {
      if (el) return; i = 0; lastFocus = document.activeElement;
      el = document.createElement("div"); el.className = "guide"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", t("Entender em 3 passos", "Understand in 3 steps"));
      el.innerHTML = `<div class="gd-card"><div class="gd-top"><span class="gd-t">${t("Entender em 3 passos", "Understand in 3 steps")} <small>· ${t("cerca de 1 minuto", "about 1 minute")}</small></span><button type="button" class="gd-x-btn" data-gd-close aria-label="${t("Fechar", "Close")}">✕</button></div><div class="gd-dots"></div><div class="gd-body" aria-live="polite"></div><div class="gd-nav"><button type="button" class="btn btn-sm" data-gd-prev>← ${t("Anterior", "Back")}</button><button type="button" class="btn btn-primary btn-sm" data-gd-next></button></div></div>`;
      document.body.appendChild(el); document.body.style.overflow = "hidden";
      requestAnimationFrame(() => el.classList.add("on"));
      el.addEventListener("click", (e) => {
        if (e.target === el || e.target.closest("[data-gd-close]")) return close();
        if (e.target.closest("[data-gd-prev]")) { i = Math.max(0, i - 1); return draw(); }
        if (e.target.closest("[data-gd-next]")) { const S = steps(); if (i < S.length - 1) { i++; draw(); } else close(S[i].go); return; }
        const d = e.target.closest("[data-gd]"); if (d) { i = +d.dataset.gd; draw(); }
      });
      el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") el.querySelector("[data-gd-next]").click(); if (e.key === "ArrowLeft" && i > 0) { i--; draw(); } });
      draw(); el.querySelector("[data-gd-next]").focus();
    },
  };
})();
