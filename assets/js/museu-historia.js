/* Museu do Real — a história contada (capítulos, curiosidades, ilustrações originais) e a sala do confisco de 1990.
 *
 * Regras deste arquivo:
 *  - As ILUSTRAÇÕES são desenhos originais (SVG), sempre legendados como ilustração. Não são fotos nem fac-símiles.
 *  - Fotos e capas de jornal pertencem a seus autores: entram pelo ACERVO (assets/museu/acervo.js), com crédito.
 *  - Só há texto de lei (ato oficial, sem direito autoral) e UMA manchete curta, com fonte e link para o original.
 *  - Números de inflação vêm da série oficial (IBGE/BCB) carregada no site; o texto estático só tem datas e fatos conferidos.
 */
(() => {
  "use strict";
  const MB = window.MB, C = MB.C, F = MB.fmt, t = (...a) => MB.t(...a), esc = MB.esc;
  const M = (MB.museu = {});
  const K = { bg: "#0b0910", s1: "#15121c", s2: "#1b1726", s3: "#2c2540", ln: "#3a3252", tx: "#c6c0d2", mu: "#8a839a", or: "#ff8a00", or2: "#ffc266", pu: "#9085e9", pu2: "#6f5fd0", bl: "#3987e5", rd: "#cc080c", rd2: "#ff5c63", paper: "#ece7dc", ink: "#17131f" };
  let uid = 0;
  const svg = (label, body) => `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(label)}"><rect width="400" height="260" fill="${K.bg}"/>${body}</svg>`;
  const MONO = "font-family=\"'IBM Plex Mono',ui-monospace,monospace\"";
  const SERIF = "font-family=\"Georgia,'Times New Roman',serif\"";
  const HEAD = "font-family=\"Lexend,Inter,sans-serif\"";

  /* ------------------------- ilustrações originais ------------------------- */
  const IL = {
    gondola() {
      const tag = (cx, a, b, c) => `<g transform="translate(${cx - 42} 186)"><rect width="84" height="60" rx="4" fill="${K.paper}"/><text x="42" y="17" text-anchor="middle" font-size="10.5" ${MONO} fill="#8a8272" text-decoration="line-through">Cr$ ${a}</text><text x="42" y="31" text-anchor="middle" font-size="10.5" ${MONO} fill="#8a8272" text-decoration="line-through">Cr$ ${b}</text><text x="42" y="51" text-anchor="middle" font-size="14" font-weight="700" ${MONO} fill="${K.rd}">Cr$ ${c}</text></g>`;
      return svg("Prateleira de supermercado com etiquetas de preço riscadas e remarcadas", `
        <g stroke="#17131f" stroke-width="1">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="170"/>`).join("")}</g>
        <rect x="24" y="168" width="352" height="9" rx="2" fill="${K.s3}"/><rect x="24" y="177" width="352" height="3" fill="${K.s2}"/>
        <g><rect x="52" y="104" width="46" height="64" rx="5" fill="#3d3378"/><rect x="52" y="104" width="46" height="9" rx="3" fill="#5446a3"/><rect x="60" y="126" width="30" height="20" rx="2" fill="${K.or}" opacity=".9"/></g>
        <g><rect x="170" y="92" width="62" height="76" rx="4" fill="${K.pu2}"/><rect x="170" y="92" width="62" height="12" rx="3" fill="${K.pu}"/><circle cx="201" cy="136" r="15" fill="${K.s2}" opacity=".55"/></g>
        <g><rect x="302" y="88" width="40" height="80" rx="8" fill="#c25f00"/><rect x="314" y="66" width="16" height="26" rx="3" fill="#c25f00"/><rect x="312" y="60" width="20" height="8" rx="2" fill="${K.or2}"/></g>
        ${tag(75, "120", "190", "310")}${tag(201, "45", "80", "135")}${tag(322, "800", "1.250", "2.100")}
        <g transform="translate(232 46) rotate(-12)"><rect width="88" height="26" rx="9" fill="${K.or}"/><rect x="60" y="-9" width="30" height="13" rx="3" fill="${K.or2}"/><path d="M18 24 L30 60 L47 60 L39 24 Z" fill="#c25f00"/><rect x="84" y="9" width="16" height="8" rx="2" fill="${K.paper}"/></g>
        `);
    },
    fila() {
      const cols = [40, 78, 158, 196].map((x) => `<rect x="${x}" y="64" width="14" height="116" rx="2" fill="${K.ln}"/><rect x="${x - 3}" y="60" width="20" height="6" rx="2" fill="${K.s3}"/><rect x="${x - 3}" y="178" width="20" height="6" rx="2" fill="${K.s3}"/>`).join("");
      const col = [K.pu2, K.bl, K.pu, "#c25f00", K.mu];
      const ppl = Array.from({ length: 9 }, (_, i) => { const x = 158 + i * 26, c = col[i % 5], h = 28 + (i % 3) * 2; return `<g><circle cx="${x}" cy="${170 + 14 - h + 4}" r="7" fill="${K.tx}" opacity=".9"/><rect x="${x - 8}" y="${184 - h + 12}" width="16" height="${h}" rx="7" fill="${c}"/><rect x="${x - 6}" y="212" width="5" height="9" rx="1.5" fill="${K.s3}"/><rect x="${x + 1}" y="212" width="5" height="9" rx="1.5" fill="${K.s3}"/>${i % 3 === 1 ? `<rect x="${x + 5}" y="${190}" width="8" height="11" rx="1.5" fill="${K.or}"/>` : ""}</g>`; }).join("");
      return svg("Fila de pessoas na porta de uma agência bancária", `
        <polygon points="26,60 126,22 226,60" fill="${K.s3}" stroke="${K.ln}" stroke-width="2"/><rect x="26" y="60" width="200" height="8" fill="${K.ln}"/>
        <circle cx="126" cy="44" r="9" fill="none" stroke="${K.tx}" stroke-width="2"/><path d="M126 44 v-6 M126 44 h-5" stroke="${K.tx}" stroke-width="2" stroke-linecap="round"/>
        ${cols}<rect x="96" y="76" width="60" height="18" rx="3" fill="${K.or}"/><text x="126" y="89.5" text-anchor="middle" font-size="12" font-weight="700" ${HEAD} fill="${K.ink}" letter-spacing="2">BANCO</text>
        <rect x="106" y="124" width="40" height="56" rx="3" fill="#07060a" stroke="${K.ln}" stroke-width="2"/><rect x="124" y="150" width="3" height="8" fill="${K.or}"/>
        <rect x="14" y="184" width="224" height="8" fill="${K.s3}"/><rect x="0" y="221" width="400" height="39" fill="#0e0c13"/><line x1="0" y1="221" x2="400" y2="221" stroke="${K.s3}" stroke-width="2"/>${ppl}`);
    },
    persiana() {
      const slats = Array.from({ length: 17 }, (_, i) => `<rect x="42" y="${34 + i * 11}" width="316" height="9.5" rx="2" fill="${i % 2 ? "#221c30" : "#2a2340"}"/>`).join("");
      return svg("Porta de aço de uma agência bancária fechada, com placa de feriado bancário", `
        <rect x="38" y="26" width="324" height="204" rx="6" fill="${K.s2}" stroke="${K.ln}" stroke-width="2"/>${slats}
        <rect x="170" y="150" width="60" height="44" rx="7" fill="${K.or}"/><path d="M182 150 v-15 a18 18 0 0 1 36 0 v15" fill="none" stroke="${K.or2}" stroke-width="8"/><circle cx="200" cy="170" r="6" fill="${K.ink}"/><rect x="197" y="172" width="6" height="14" fill="${K.ink}"/>
        <g transform="translate(200 92) rotate(-3)"><path d="M-72 -34 L-72 -50 M72 -34 L72 -50" stroke="${K.mu}" stroke-width="3"/><rect x="-116" y="-34" width="232" height="70" rx="5" fill="${K.paper}"/><text x="0" y="-6" text-anchor="middle" font-size="20" font-weight="700" ${SERIF} fill="${K.ink}">FERIADO BANCÁRIO</text><text x="0" y="22" text-anchor="middle" font-size="13" font-weight="600" ${MONO} fill="${K.rd}">14 · 15 · 16 MAR · 1990</text></g>`);
    },
    caderneta() {
      return svg("Caderneta de poupança com cadeado e carimbo de limite de 50 mil cruzados novos", `
        <g transform="translate(118 26)"><rect width="172" height="208" rx="10" fill="#2a2350" stroke="${K.pu}" stroke-width="2"/><rect width="24" height="208" rx="10" fill="#1d1838"/>
        <rect x="44" y="26" width="108" height="46" rx="4" fill="${K.paper}"/><text x="98" y="46" text-anchor="middle" font-size="11.5" font-weight="700" ${SERIF} fill="${K.ink}" letter-spacing="1">CADERNETA</text><text x="98" y="62" text-anchor="middle" font-size="11.5" font-weight="700" ${SERIF} fill="${K.ink}" letter-spacing="1">DE POUPANÇA</text>
        <circle cx="98" cy="118" r="27" fill="none" stroke="${K.or2}" stroke-width="3"/><circle cx="98" cy="118" r="21" fill="none" stroke="${K.or2}" stroke-width="1" stroke-dasharray="2 4"/><text x="98" y="128" text-anchor="middle" font-size="28" font-weight="700" ${HEAD} fill="${K.or2}">$</text>
        <rect x="44" y="166" width="108" height="3" rx="1.5" fill="#5446a3"/><rect x="44" y="178" width="74" height="3" rx="1.5" fill="#5446a3"/></g>
        <g transform="translate(236 150)"><rect y="32" width="66" height="56" rx="8" fill="${K.rd}"/><path d="M13 32 v-18 a20 20 0 0 1 40 0 v18" fill="none" stroke="${K.rd2}" stroke-width="9"/><circle cx="33" cy="56" r="7" fill="${K.ink}"/><rect x="30" y="58" width="6" height="16" fill="${K.ink}"/></g>
        <g transform="translate(18 150) rotate(-10)"><rect width="124" height="48" rx="5" fill="rgba(11,9,16,.7)" stroke="${K.rd2}" stroke-width="3"/><text x="62" y="19" text-anchor="middle" font-size="11" font-weight="700" ${MONO} fill="${K.rd2}" letter-spacing="2">LIMITE</text><text x="62" y="40" text-anchor="middle" font-size="17" font-weight="700" ${MONO} fill="${K.rd2}">NCz$ 50.000</text></g>`);
    },
    urv() {
      return svg("Cédula tracejada com a sigla URV: a unidade que nunca foi impressa", `
        <text x="200" y="36" text-anchor="middle" font-size="12.5" ${MONO} fill="${K.or}">1 URV: CR$ 647,50 → CR$ 2.750,00</text>
        <g transform="translate(50 54)"><rect width="300" height="150" rx="10" fill="rgba(144,133,233,.07)" stroke="${K.pu}" stroke-width="2.5" stroke-dasharray="9 7"/><rect x="14" y="14" width="272" height="122" rx="6" fill="none" stroke="${K.ln}" stroke-dasharray="3 5"/>
        <text x="150" y="84" text-anchor="middle" font-size="56" font-weight="700" ${HEAD} fill="${K.pu}">URV</text><text x="150" y="110" text-anchor="middle" font-size="11.5" ${MONO} fill="${K.mu}" letter-spacing="2.5">UNIDADE REAL DE VALOR</text>
        <circle cx="42" cy="40" r="15" fill="none" stroke="${K.ln}" stroke-dasharray="3 4" stroke-width="2"/><circle cx="258" cy="110" r="15" fill="none" stroke="${K.ln}" stroke-dasharray="3 4" stroke-width="2"/></g>
        <g transform="translate(200 230)"><rect x="-150" y="-15" width="300" height="30" rx="15" fill="${K.s2}" stroke="${K.s3}"/><text y="4.5" text-anchor="middle" font-size="12" ${MONO} fill="${K.tx}">nunca foi impressa · só valia no papel</text></g>`);
    },
    real() {
      const id = "g" + ++uid, rays = Array.from({ length: 13 }, (_, i) => { const a = (-170 + i * 13.3) * Math.PI / 180; return `<line x1="${200 + Math.cos(a) * 74}" y1="${214 + Math.sin(a) * 74}" x2="${200 + Math.cos(a) * 190}" y2="${214 + Math.sin(a) * 190}" stroke="${K.or}" stroke-opacity=".28" stroke-width="3"/>`; }).join("");
      return svg("Um sol nascendo atrás de uma moeda de um real", `
        <defs><radialGradient id="${id}" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="${K.or}" stop-opacity=".55"/><stop offset="1" stop-color="${K.or}" stop-opacity="0"/></radialGradient></defs>
        <circle cx="200" cy="214" r="150" fill="url(#${id})"/>${rays}<rect y="214" width="400" height="46" fill="${K.bg}"/><line x1="0" y1="214" x2="400" y2="214" stroke="${K.s3}" stroke-width="2"/>
        <g transform="translate(200 128)"><circle r="64" fill="${K.s2}" stroke="${K.or}" stroke-width="5"/><circle r="52" fill="none" stroke="${K.or2}" stroke-width="1.5" stroke-dasharray="2 4"/><text y="15" text-anchor="middle" font-size="44" font-weight="700" ${HEAD} fill="${K.or}">R$ 1</text></g>
        <text x="200" y="240" text-anchor="middle" font-size="13" ${MONO} fill="${K.tx}">= CR$ 2.750 · 1º de julho de 1994</text>`);
    },
    tv() {
      const id = "s" + ++uid;
      return svg("Televisão antiga exibindo um pronunciamento em rede nacional", `
        <defs><pattern id="${id}" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1.4" fill="#fff" opacity=".06"/></pattern><radialGradient id="${id}g" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#3d3378"/><stop offset="1" stop-color="#0e0c13"/></radialGradient></defs>
        <path d="M166 58 L198 18 M234 58 L202 18" stroke="${K.mu}" stroke-width="3.5" stroke-linecap="round"/>
        <rect x="64" y="56" width="272" height="176" rx="18" fill="${K.s2}" stroke="${K.ln}" stroke-width="3"/>
        <rect x="82" y="72" width="204" height="144" rx="12" fill="url(#${id}g)" stroke="${K.s3}" stroke-width="2"/>
        <path d="M144 212 L154 144 H214 L224 212 Z" fill="${K.s3}"/><rect x="150" y="138" width="68" height="9" rx="2" fill="${K.ln}"/><line x1="184" y1="138" x2="184" y2="116" stroke="${K.mu}" stroke-width="2.5"/><circle cx="184" cy="111" r="6" fill="${K.tx}"/>
        <rect x="82" y="186" width="204" height="26" fill="${K.rd}"/><text x="92" y="203" font-size="9.5" font-weight="700" ${MONO} fill="#fff" letter-spacing=".6">REDE NACIONAL · 16/03/1990</text>
        <rect x="82" y="72" width="204" height="144" rx="12" fill="url(#${id})"/>
        <circle cx="312" cy="102" r="10" fill="${K.s3}" stroke="${K.ln}" stroke-width="2"/><circle cx="312" cy="138" r="10" fill="${K.s3}" stroke="${K.ln}" stroke-width="2"/><g stroke="${K.s3}" stroke-width="3" stroke-linecap="round"><line x1="302" y1="172" x2="322" y2="172"/><line x1="302" y1="182" x2="322" y2="182"/><line x1="302" y1="192" x2="322" y2="192"/></g>
        <rect x="104" y="232" width="20" height="10" rx="2" fill="${K.s3}"/><rect x="276" y="232" width="20" height="10" rx="2" fill="${K.s3}"/>`);
    },
    mp() {
      const lines = Array.from({ length: 9 }, (_, i) => `<rect x="20" y="${88 + i * 14}" width="${i % 4 === 3 ? 84 : 124}" height="3.2" rx="1.6" fill="#bdb6a6"/>`).join("");
      return svg("Folha de documento oficial com selo: a Medida Provisória nº 168", `
        <g transform="translate(118 22) rotate(1.5 82 108)"><rect width="164" height="216" rx="6" fill="${K.paper}"/>
        <text x="82" y="31" text-anchor="middle" font-size="9.5" font-weight="700" ${SERIF} fill="${K.ink}" letter-spacing="1.6">MEDIDA PROVISÓRIA</text><text x="82" y="54" text-anchor="middle" font-size="19" font-weight="700" ${SERIF} fill="${K.ink}">Nº 168</text><text x="82" y="70" text-anchor="middle" font-size="9" ${SERIF} fill="#6b6355">15 de março de 1990</text>${lines}
        <circle cx="126" cy="188" r="19" fill="${K.rd}" opacity=".85"/><circle cx="126" cy="188" r="13" fill="none" stroke="${K.paper}" stroke-dasharray="2 3"/></g>`);
    },
  };
  /* moldura de figura: ilustração (SVG) ou foto do acervo, sempre com legenda */
  const figSvg = (art, cap, tag) => `<figure class="frame"><div class="art">${art}</div><figcaption>${cap}<small>${tag || t("Ilustração original do museu", "Original museum illustration")}</small></figcaption></figure>`;
  const acervoFor = (sala) => (MB.ACERVO || []).filter((x) => x.sala === sala);
  const figImg = (x) => `<figure class="frame"><a class="art" href="${esc(x.link || x.src)}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(x.src)}" alt="${esc(x.titulo)}"></a><figcaption><b>${esc(x.titulo)}</b>${x.credito ? `<small>${esc(x.credito)}</small>` : ""}</figcaption></figure>`;
  const figEmpty = () => `<figure class="frame empty"><b>${t("Espaço para o seu acervo", "Room for your collection")}</b><span>${t("Fotos e capas de jornal da época, com licença e crédito, entram aqui.", "Period photos and newspaper covers, licensed and credited, go here.")}</span><code>assets/museu/acervo.js</code></figure>`;

  /* ------------------------- dados da série oficial ------------------------- */
  const ipcaMap = () => MB.memo("mu-ipca-map", () => new Map(MB.ser("ipca")));
  const ipcaAt = (ym) => ipcaMap().get(ym) ?? null;
  const yearAcc = (y) => { const r = MB.byYear(MB.ser("ipca")).find((x) => +x[0] === y); return r ? r[1] : null; };
  const pf = (v) => (v == null ? "—" : F(v, Math.abs(v) >= 100 ? 0 : v >= 10 ? 1 : 2) + "%");
  const maxMonth = () => MB.ser("ipca").reduce((a, b) => (!a || b[1] > a[1] ? b : a), null);
  const link = (href, txt) => `<a href="${href}" target="_blank" rel="noopener">${txt} ↗</a>`;
  const curio = (html, src) => `<div class="curio"><div>${html}${src ? `<small>${src}</small>` : ""}</div></div>`;
  const barsMini = (a, hi) => { if (!a.length) return ""; const mx = Math.max(...a.map((p) => p[1])) || 1; return `<div class="bars-mini" aria-hidden="true">${a.map((p) => `<i class="${p[0] === hi ? "hi" : ""}" style="height:${Math.max(3, (p[1] / mx) * 100)}%" title="${MB.ymLabel(p[0])}: ${F(p[1], 1)}%"></i>`).join("")}</div><div class="bars-cap"><span>${MB.ymLabel(a[0][0])}</span><span>${t("inflação mês a mês", "month-by-month inflation")}</span><span>${MB.ymLabel(a.at(-1)[0])}</span></div>`; };

  /* ======================================================================
   * SALA 1 — A HISTÓRIA DO DINHEIRO (capítulos)
   * ====================================================================== */
  const PLANS = () => [
    { y: 1986, c: "#1fb5a8", n: t("Plano Cruzado", "Cruzado Plan"), d: t("Nova moeda, o cruzado (Cz$ 1 = Cr$ 1.000), e congelamento de preços.", "A new currency, the cruzado (Cz$ 1 = Cr$ 1,000), and a price freeze.") },
    { y: 1987, c: "#6f5fd0", n: t("Plano Bresser", "Bresser Plan"), d: t("Mais uma tentativa de estabilização, ainda sob a moeda cruzado.", "Another stabilisation attempt, still under the cruzado.") },
    { y: 1989, c: "#f5a524", n: t("Plano Verão", "Summer Plan"), d: t("Outra troca: cruzado novo (NCz$ 1 = Cz$ 1.000) e novo congelamento.", "Another change: the cruzado novo (NCz$ 1 = Cz$ 1,000) and a new freeze.") },
    { y: 1990, c: "#cc080c", n: t("Plano Collor I", "Collor Plan I"), go: 1, d: t("Volta o cruzeiro (Cr$ 1 = NCz$ 1) e saldos acima de um limite ficam bloqueados.", "The cruzeiro returns (Cr$ 1 = NCz$ 1) and balances above a limit are frozen.") },
    { y: 1991, c: "#e0529c", n: t("Plano Collor II", "Collor Plan II"), d: t("Novo congelamento de preços e fim do overnight.", "A new price freeze and the end of the overnight market.") },
    { y: 1993, c: "#ff5c63", n: t("Cruzeiro real", "Cruzeiro real"), d: t("Mais três zeros cortados (CR$ 1 = Cr$ 1.000), em meio ao pico da inflação.", "Three more zeros cut (CR$ 1 = Cr$ 1,000), at the height of inflation.") },
    { y: 1994, c: "#ff8a00", n: t("Plano Real", "Real Plan"), d: t("URV em março, Real em 1º de julho (R$ 1 = CR$ 2.750).", "URV in March, the Real on 1 July (R$ 1 = CR$ 2,750).") },
  ];
  function chapters() {
    const hi = maxMonth(), a8994 = MB.ser("ipca").filter((p) => p[0] >= "1989-01" && p[0] <= "1994-06"), y93 = yearAcc(1993), jun = ipcaAt("1994-06"), jul = ipcaAt("1994-07");
    const post = MB.byYear(MB.ser("ipca")).filter((x) => +x[0] >= 1995 && +x[0] < new Date().getFullYear()), pw = MB.powerNow("1994-07");
    const c1 = `<section class="chap reveal">${figSvg(IL.gondola(), t("<b>Remarcar, remarcar, remarcar.</b> No comércio, o preço de ontem não valia mais hoje.", "<b>Re-mark, re-mark, re-mark.</b> In shops, yesterday's price no longer held today."))}
      <div><div class="chap-yr">${t("1980 – 1993", "1980 – 1993")}</div><h3>${t("Quando o dinheiro derretia", "When money melted away")}</h3>
      <p>${t("Durante mais de uma década os preços subiram todo mês. Quem recebia o salário corria para gastá-lo antes que perdesse valor: <b>dinheiro parado derretia</b>. O supermercado remarcava as etiquetas várias vezes ao dia, e a família fazia o “rancho” do mês de uma só vez.", "For over a decade prices rose every month. People who got paid rushed to spend before their money lost value: <b>idle cash melted</b>. Supermarkets re-marked labels several times a day, and families bought the month's groceries in a single trip.")}</p>
      ${curio(t("<b>Pistolas de etiquetar.</b> Funcionários do comércio passavam o dia trocando as etiquetas por valores mais altos — um símbolo da época.", "<b>Price-label guns.</b> Shop staff spent the day swapping labels for higher prices — a symbol of the era."), t("Fonte: Agência Senado e Jornal do Comércio (links no fim da sala)", "Source: Agência Senado and Jornal do Comércio (links at the end of the room)"))}
      ${a8994.length ? barsMini(a8994, hi?.[0]) : ""}
      <div class="pills">${y93 != null ? `<span class="pill hot">${t("inflação de 1993", "1993 inflation")}: <b>${pf(y93)}</b></span>` : ""}${hi ? `<span class="pill">${t("maior alta mensal da série", "highest monthly rise on record")}: <b>${pf(hi[1])}</b> (${MB.ymLabel(hi[0])})</span>` : ""}</div></div></section>`;
    const idx = (y) => yearAcc(y);
    const c2 = `<section class="chap reveal" style="display:block"><div class="chap-yr">${t("1986 – 1994", "1986 – 1994")}</div><h3>${t("Uma sequência de planos econômicos", "A sequence of economic plans")}</h3>
      <p style="max-width:78ch">${t(`Entre 1986 e 1994 o Brasil trocou de moeda <b>cinco vezes</b> e testou plano após plano. Toque em um plano para ver a inflação do ano, medida pelo IPCA do IBGE.`, `Between 1986 and 1994 Brazil changed currency <b>five times</b> and tried plan after plan. Tap a plan to see that year's inflation, measured by IBGE's IPCA.`)}</p>
      <div class="plans" id="plans">${PLANS().map((p, i) => `<button type="button" class="plan${p.go ? " go" : ""}${i === 3 ? " on" : ""}" style="--c:${p.c}" data-plan="${i}"><div class="y">${p.y}</div><h4>${p.n}</h4><p>${p.d}</p><div class="yy">${t("inflação no ano", "inflation that year")}: <b>${pf(idx(p.y))}</b></div></button>`).join("")}</div>
      <div class="chap-cta"><button class="btn btn-sm" type="button" data-room="sala-confisco">${t("Entrar na sala do confisco de 1990", "Enter the 1990 savings-freeze room")} →</button><button class="btn btn-sm" type="button" data-room="sala-moedas">${t("Ver todas as moedas", "See all the currencies")} →</button></div></section>`;
    const c3 = `<section class="chap reveal">${figSvg(IL.urv(), t("<b>A moeda que só existia no papel.</b> A URV servia de referência para preços e contratos, mas ninguém recebia uma cédula de URV.", "<b>The currency that only existed on paper.</b> The URV was a reference for prices and contracts, but nobody ever held a URV banknote."))}
      <div><div class="chap-yr">${t("Março – junho de 1994", "March – June 1994")}</div><h3>${t("A URV: a moeda virtual", "The URV: a virtual currency")}</h3>
      <p>${t("A partir de <b>1º de março de 1994</b>, preços e contratos passaram a ser referidos em <b>URV</b> (Unidade Real de Valor). O cruzeiro real ainda pagava as contas, mas a URV valia, a cada dia, mais cruzeiros reais. Era um ensaio público do que viria: o brasileiro aprendeu a pensar em uma unidade estável antes de ela virar dinheiro.", "From <b>1 March 1994</b>, prices and contracts began to be quoted in <b>URV</b> (Unidade Real de Valor). The cruzeiro real still paid the bills, but each day the URV was worth more cruzeiros reais. It was a public rehearsal of what was coming: Brazilians learned to think in a stable unit before it became money.")}</p>
      <div class="urv" id="urv"><div class="urv-row"><span class="d">1 ${t("mar", "Mar")} 1994</span><div class="bar"><i data-w="23.5"></i></div><span class="v" data-urv="647.5">CR$ 647,50</span></div><div class="urv-row"><span class="d">30 ${t("jun", "Jun")} 1994</span><div class="bar"><i data-w="100"></i></div><span class="v" data-urv="2750">CR$ 2.750,00</span></div><div class="urv-row"><span class="d">1 ${t("jul", "Jul")} 1994</span><div class="bar"><i data-w="100"></i></div><span class="v" style="color:var(--orange)">R$ 1,00</span></div></div>
      ${curio(t("<b>Plano FHC.</b> Antes de as cédulas do real circularem, o pacote ficou conhecido pelo nome do então ministro da Fazenda, Fernando Henrique Cardoso.", "<b>“Plano FHC”.</b> Before the real's banknotes circulated, the package was known by the name of the then finance minister, Fernando Henrique Cardoso."), t("Fonte: Agência Senado", "Source: Agência Senado"))}
      <div class="pills">${jun != null && jul != null ? `<span class="pill">IPCA ${MB.ymLabel("1994-06")}: <b>${pf(jun)}</b></span><span class="pill">IPCA ${MB.ymLabel("1994-07")}: <b>${pf(jul)}</b></span>` : ""}</div></div></section>`;
    const c4 = `<section class="chap reveal">${figSvg(IL.real(), t("<b>1º de julho de 1994.</b> R$ 1 passou a valer CR$ 2.750 — o valor da URV no dia anterior.", "<b>1 July 1994.</b> R$ 1 became worth CR$ 2,750 — the URV's value the day before."))}
      <div><div class="chap-yr">${t("1º de julho de 1994", "1 July 1994")}</div><h3>${t("Nasce o Real", "The Real is born")}</h3>
      <p>${t("Na virada, <b>CR$ 2.750 viraram R$ 1</b>. Tudo o que estava em URV foi convertido um a um e, ainda em julho, circularam as primeiras cédulas e moedas do real. Logo no mês seguinte, o ritmo da inflação mensal mudou de patamar.", "At the changeover, <b>CR$ 2,750 became R$ 1</b>. Everything quoted in URV was converted one for one and, still in July, the first real banknotes and coins began to circulate. Right in the following month, the pace of monthly inflation had changed level.")}</p>
      ${curio(t("<b>Código de barras.</b> Foi por volta do Plano Real que a leitura de código de barras começou a se espalhar pelos supermercados do país. Sem corrida para remarcar, o brasileiro deixou de estocar comida.", "<b>Barcodes.</b> Around the time of the Real Plan, barcode scanning began to spread through the country's supermarkets. With no race to re-mark, Brazilians stopped stockpiling food."), t("Fonte: Agência Senado e SBT News", "Source: Agência Senado and SBT News"))}
      <div class="pills"><span class="pill">R$ 1 = <b>${F(MB.MOEDAS[0].F, 0)}</b> ${t("mil-réis", "mil-réis")}</span></div></div></section>`;
    const post5 = post.length ? `<div class="bars-mini" aria-hidden="true">${post.map((x) => { const mx = Math.max(...post.map((p) => p[1])); return `<i style="height:${Math.max(4, (x[1] / mx) * 100)}%" title="${x[0]}: ${F(x[1], 1)}%"></i>`; }).join("")}</div><div class="bars-cap"><span>${post[0][0]}</span><span>${t("inflação de cada ano (IPCA)", "each year's inflation (IPCA)")}</span><span>${post.at(-1)[0]}</span></div>` : "";
    const c5 = `<section class="chap reveal" style="display:block"><div class="chap-yr">${t("1995 – hoje", "1995 – today")}</div><h3>${t("Depois do Real: a inflação baixou, o desgaste continua", "After the Real: inflation fell, the erosion goes on")}</h3>
      <p style="max-width:78ch">${t("A inflação deixou de ser de centenas de por cento ao ano. Mas estabilidade não é preço parado: <b>mesmo com inflação baixa, o dinheiro continua perdendo valor</b>.", "Inflation stopped being hundreds of percent a year. But stability does not mean frozen prices: <b>even with low inflation, money keeps losing value</b>.")}${pw != null ? t(` R$ 100 de julho de 1994 compram hoje o que <b>${MB.brl(pw * 100)}</b> comprariam naquela época.`, ` R$ 100 from July 1994 buy today what <b>${MB.brl(pw * 100)}</b> would then have bought.`) : ""}</p>
      ${post5}
      <div class="chap-cta"><button class="btn btn-sm" type="button" data-tab-go="poder">${t("Quanto vale o meu dinheiro? (Poder de compra)", "What is my money worth? (Purchasing power)")} →</button><button class="btn btn-sm" type="button" data-tab-go="inflacao">${t("Inflação de hoje", "Today's inflation")} →</button></div></section>`;
    return c1 + c2 + c3 + c4 + c5;
  }
  M.story = () => `<div class="room-title"><span class="rn">SALA 01</span><h2>${t("A história do dinheiro brasileiro", "The story of Brazilian money")}</h2></div>
    <p class="room-lead">${t("Do dinheiro que derretia ao Real: cinco capítulos, com ilustrações originais, fatos curiosos e números da série oficial do IBGE.", "From money that melted away to the Real: five chapters, with original illustrations, curious facts and numbers from IBGE's official series.")}</p>${chapters()}
    <p class="note-art">${t("As imagens deste museu são ilustrações originais. Fotografias e capas de jornal pertencem a seus autores — veja os arquivos indicados na sala do confisco.", "The images in this museum are original illustrations. Photographs and newspaper covers belong to their authors — see the archives listed in the savings-freeze room.")}</p>`;
  M.storyAfter = (root) => {
    const plans = root.querySelector("#plans");
    plans?.addEventListener("click", (e) => { const b = e.target.closest("[data-plan]"); if (!b) return; plans.querySelectorAll(".plan").forEach((x) => x.classList.toggle("on", x === b)); });
    const urv = root.querySelector("#urv"); if (!urv) return;
    const run = () => { urv.querySelectorAll(".bar i").forEach((i) => (i.style.width = i.dataset.w + "%")); urv.querySelectorAll("[data-urv]").forEach((el) => { const to = +el.dataset.urv; MB.countUp(el, to, (v) => "CR$ " + F(v, 2), 1600); }); };
    if (!("IntersectionObserver" in window)) { run(); return; }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 }); io.observe(urv); setTimeout(run, 4000);
  };

  /* ======================================================================
   * SALA 2 — O CONFISCO DE 1990 (Plano Collor I)
   * ====================================================================== */
  const LIM = 50000;
  const LAW = () => [
    { art: "Art. 5º", txt: "Os saldos dos depósitos à vista serão convertidos em cruzeiros, segundo a paridade estabelecida no § 2º do art. 1º, obedecido o limite de NCz$ 50.000,00 (cinqüenta mil cruzados novos).", plain: t("Conta-corrente: só até <b>NCz$ 50.000</b> viravam cruzeiros de imediato.", "Current accounts: only up to <b>NCz$ 50,000</b> were converted to cruzeiros right away.") },
    { art: "Art. 6º", txt: "Os saldos das cadernetas de poupança serão convertidos em cruzeiros na data do próximo crédito de rendimento, segundo a paridade estabelecida no § 2º do art. 1º, observado o limite de NCz$ 50.000,00 (cinqüenta mil cruzados novos).", plain: t("Poupança: o mesmo teto de <b>NCz$ 50.000</b>, a partir do próximo crédito de rendimento.", "Savings accounts: the same <b>NCz$ 50,000</b> cap, from the next interest credit.") },
    { art: "Art. 9º", txt: "Serão transferidos ao Banco Central do Brasil os saldos em cruzados novos não convertidos na forma dos arts. 5º, 6º e 7º, que serão mantidos em contas individualizadas em nome da instituição financeira depositante.", plain: t("O que passava do teto <b>foi transferido ao Banco Central</b>, em contas individualizadas em nome do banco. O governo falava em “transferência de titularidade”; a população chamou de <b>confisco</b>.", "Whatever exceeded the cap <b>was transferred to the central bank</b>, in individual accounts in the bank's name. The government spoke of a “transfer of ownership”; the public called it a <b>confiscation</b>.") },
  ];
  const DAYS = () => [
    { k: t("Qua", "Wed"), d: "14/03", h: t("Os bancos fecham", "Banks close"), art: IL.persiana(), cap: t("<b>Feriado bancário.</b> O Banco Central decreta três dias sem expediente nos bancos, de 14 a 16 de março.", "<b>Bank holiday.</b> The central bank decrees three days without banking, 14 to 16 March."), p: t("O Banco Central determinou <b>feriado bancário</b> de três dias, pedido para que o governo pudesse anunciar as medidas. Como todo o atendimento era feito dentro das agências, o país ficou sem acesso ao dinheiro guardado nos bancos.", "The central bank ordered a <b>three-day bank holiday</b>, requested so that the government could announce its measures. With all service done inside branches, the country was cut off from the money it kept in banks."), src: [["Poder360", "https://www.poder360.com.br/poder-economia/confisco-da-poupanca-por-collor-completa-35-anos"], ["História do Mundo", "https://www.historiadomundo.com.br/idade-contemporanea/plano-collor.htm"]] },
    { k: t("Qui", "Thu"), d: "15/03", h: t("Posse e medida provisória", "Inauguration and provisional measure"), art: IL.mp(), cap: t("<b>MP 168.</b> A medida provisória datada de 15 de março instituiu o cruzeiro e as regras do bloqueio.", "<b>MP 168.</b> The provisional measure dated 15 March created the cruzeiro and the freeze rules."), p: t("Fernando Collor toma posse como presidente. A <b>Medida Provisória nº 168</b>, datada desse dia, institui o <b>cruzeiro</b> (Cr$ 1 = NCz$ 1) e dispõe sobre a liquidez dos ativos financeiros. Em 12 de abril ela viraria a <b>Lei 8.024</b>.", "Fernando Collor takes office as president. <b>Provisional Measure no. 168</b>, dated that day, creates the <b>cruzeiro</b> (Cr$ 1 = NCz$ 1) and rules on the liquidity of financial assets. On 12 April it would become <b>Law 8,024</b>."), src: [["Planalto — Lei 8.024/1990", "https://www.planalto.gov.br/ccivil_03/leis/l8024.htm"]] },
    { k: t("Sex", "Fri"), d: "16/03", h: t("O anúncio", "The announcement"), art: IL.tv(), cap: t("<b>Rede nacional.</b> Na manhã de sexta-feira, o governo apresenta o Plano Brasil Novo.", "<b>National broadcast.</b> On Friday morning the government presents the Plano Brasil Novo."), p: t("Na manhã de sexta, o presidente fala em <b>rede nacional</b> e a ministra da Economia, <b>Zélia Cardoso de Mello</b>, apresenta o <b>Plano Brasil Novo</b> à imprensa, ao lado de Ibrahim Eris (Banco Central) e Antônio Kandir. Entram em cena a troca da moeda, o congelamento de preços e o <b>bloqueio dos saldos acima de NCz$ 50 mil</b>.", "On Friday morning the president speaks on <b>national broadcast</b> and the economy minister, <b>Zélia Cardoso de Mello</b>, presents the <b>Plano Brasil Novo</b> to the press, alongside Ibrahim Eris (central bank) and Antônio Kandir. In come the change of currency, a price freeze and the <b>freezing of balances above NCz$ 50,000</b>."), src: [["Jornal Opção", "https://jornalopcao.com.br/ultimas-noticias/plano-collor-confisco-da-poupanca-completa-30-anos-e-foi-chamado-de-transferencia-de-titularidade-689011/"], ["Poder360", "https://www.poder360.com.br/poder-economia/confisco-da-poupanca-por-collor-completa-35-anos"]] },
    { k: t("Sáb", "Sat"), d: "17/03", h: t("A manchete", "The headline"), art: null, p: t("No sábado, os jornais registram o impacto do anúncio. A <b>MP 172</b>, de 17 de março, já altera pontos da MP 168 antes mesmo de os bancos reabrirem. A capa do <b>Jornal do Brasil</b> resumiu o clima do dia seguinte ao anúncio.", "On Saturday the newspapers record the impact of the announcement. <b>MP 172</b>, of 17 March, already amends points of MP 168 before banks even reopen. The front page of <b>Jornal do Brasil</b> summed up the mood of the day after the announcement."), src: [["Hemeroteca Digital (Biblioteca Nacional)", "https://hemerotecadigital.bn.gov.br/"]] },
    { k: t("Seg", "Mon"), d: "19/03", h: t("As filas", "The queues"), art: IL.fila(), cap: t("<b>Segunda-feira.</b> Os bancos reabrem com filas na porta — e agências sem dinheiro suficiente.", "<b>Monday.</b> Banks reopen with queues at the door — and branches without enough cash."), p: t("Com a reabertura, o <b>teto de NCz$ 50 mil</b> passa a valer. Formam-se <b>filas enormes</b> nas agências; muita gente tenta sacar tudo o que pode, e há bancos sem dinheiro para atender a todos.", "With reopening, the <b>NCz$ 50,000 cap</b> takes effect. <b>Huge queues</b> form at branches; many try to withdraw all they can, and some banks lack cash to serve everyone."), src: [["Poder360", "https://www.poder360.com.br/poder-economia/confisco-da-poupanca-por-collor-completa-35-anos"]] },
  ];
  const headlineCard = () => `<div class="headline"><div class="hk"><span>Jornal do Brasil</span><span>17 · 03 · 1990</span></div><q>Reforma de Collor faz terremoto na economia</q><small>${t("Manchete citada em questão do vestibular UFPR 2021 (texto). ", "Headline quoted in a UFPR 2021 entrance-exam question (text). ")}${link("https://www.blogdovestibular.com/questoes/questao-resolvida-plano-collor-ufpr-2021.html", t("fonte", "source"))} · ${t("A capa original pode ser consultada na ", "The original cover can be consulted in the ")}${link("https://hemerotecadigital.bn.gov.br/", "Hemeroteca Digital")}.</small></div>`;
  function stepView(i) {
    const d = DAYS()[i];
    const art = d.art ? figSvg(d.art, d.cap) : `<figure class="frame fig-quote">${headlineCard()}</figure>`;
    return `<div class="step-view" data-step="${i}">${art}<div><h4>${d.d} · ${d.h}</h4><p>${d.p}</p><div class="src-line">${t("Fontes", "Sources")}: ${d.src.map(([n, u]) => link(u, n)).join(" · ")}</div></div></div>`;
  }
  const TL = () => [
    { d: "31/01/1991", h: t("Plano Collor II", "Collor Plan II"), p: t("Novo congelamento de preços e fim das aplicações no overnight.", "A new price freeze and the end of overnight investments."), s: [["História do Mundo", "https://www.historiadomundo.com.br/idade-contemporanea/plano-collor.htm"]] },
    { d: "16/09/1991", h: t("Começa a devolução", "Giving back begins"), p: t("O dinheiro bloqueado ficaria 18 meses retido; a lei previa a devolução em 12 parcelas mensais, a partir de 16/09/1991, com correção pelo BTN e juros de 6% ao ano.", "The frozen money was to stay locked for 18 months; the law provided for return in 12 monthly instalments from 16/09/1991, adjusted by the BTN plus 6% a year."), s: [["Planalto — Lei 8.024", "https://www.planalto.gov.br/ccivil_03/leis/l8024.htm"]] },
    { d: "11/12/2017", h: t("Acordo coletivo", "Collective agreement"), p: t("Bancos e entidades de poupadores assinam um acordo coletivo para encerrar as ações sobre perdas de correção dos planos econômicos; o STF o homologa em 1º/03/2018.", "Banks and savers' groups sign a collective agreement to end the lawsuits over lost adjustments from the economic plans; the Supreme Court approves it on 1 March 2018."), s: [["Poder360", "https://www.poder360.com.br/poder-economia/confisco-da-poupanca-por-collor-completa-35-anos"]] },
    { d: "18/05/2020", h: t("Pedido de desculpas", "An apology"), p: t("Trinta anos depois, o então senador Fernando Collor pede desculpas publicamente pelo bloqueio, dizendo que acreditou que as medidas eram o caminho certo e errou.", "Thirty years later, then-senator Fernando Collor publicly apologises for the freeze, saying he believed the measures were the right path and was wrong."), s: [["Poder360", "https://www.poder360.com.br/congresso/collor-pede-desculpas-pelo-confisco-da-poupanca-em-1990/"]] },
    { d: "05/2025", h: t("STF valida os planos", "Supreme Court upholds the plans"), hot: 1, p: t("No julgamento da ADPF 165, o STF declara constitucionais os planos Bresser, Verão, Collor I e Collor II e reabre por 24 meses o prazo para poupadores aderirem ao acordo coletivo.", "In the ADPF 165 judgment, the Supreme Court declares the Bresser, Verão, Collor I and Collor II plans constitutional and reopens, for 24 months, the window for savers to join the collective agreement."), s: [["STF — Notícias", "https://noticias.stf.jus.br/?p=97761"], ["Idec", "https://idec.org.br/planos-economicos"]] },
  ];
  const FAQ = () => [
    [t("Por que o governo fez isso?", "Why did the government do it?"), t("<p>Em março de 1990 a inflação medida pelo IPCA chegou a <b>82,4% em um único mês</b>. A ideia do plano era <b>enxugar o dinheiro disponível para gastar</b>, na aposta de que, com menos dinheiro circulando, os preços parariam de subir.</p><p>Foi uma de várias apostas daquele período; a discussão sobre ela segue até hoje entre economistas.</p>", "<p>In March 1990, inflation measured by the IPCA reached <b>82.4% in a single month</b>. The plan's idea was to <b>drain the money available to spend</b>, betting that with less money circulating prices would stop rising.</p><p>It was one of several bets of that period; economists still debate it today.</p>")],
    [t("Quanto dinheiro foi bloqueado?", "How much money was frozen?"), t("<p>Estimativas citadas pela imprensa falam em <b>cerca de 80%</b> do dinheiro aplicado no sistema financeiro. O teto de liberação era de <b>NCz$ 50.000</b> por saldo.</p>", "<p>Estimates cited in the press speak of <b>about 80%</b> of the money held in the financial system. The release cap was <b>NCz$ 50,000</b> per balance.</p>")],
    [t("A inflação caiu depois do plano?", "Did inflation fall after the plan?"), t("<p>Nos meses seguintes os preços desaceleraram — mas a inflação voltou a subir e o ano de 1990 terminou com alta de preços acima de mil por cento. O gráfico acima mostra, mês a mês, o que a série oficial registrou.</p>", "<p>In the following months prices slowed — but inflation picked up again and 1990 ended with price rises above a thousand percent. The chart above shows, month by month, what the official series recorded.</p>")],
    [t("E hoje: ainda dá para receber alguma coisa?", "And today: can anything still be claimed?"), t("<p>Em 2025 o STF reabriu, por <b>24 meses</b>, o prazo para poupadores aderirem ao acordo coletivo dos planos econômicos (o prazo termina em 2027). Quem teve poupança nos planos Bresser, Verão, Collor I ou Collor II pode procurar o banco, o Idec ou um advogado para saber se tem direito.</p><p class=\"muted\" style=\"font-size:13px\">Conteúdo histórico e informativo, sem caráter de aconselhamento jurídico.</p>", "<p>In 2025 the Supreme Court reopened, for <b>24 months</b>, the window for savers to join the collective agreement over the economic plans (the deadline ends in 2027). Those who held savings during the Bresser, Verão, Collor I or Collor II plans can ask their bank, the consumer group Idec or a lawyer whether they are entitled to anything.</p><p class=\"muted\" style=\"font-size:13px\">Historical and informational content; not legal advice.</p>")],
  ];
  const ARCH = () => [["Hemeroteca Digital Brasileira", "Biblioteca Nacional", "https://hemerotecadigital.bn.gov.br/"], ["Acervo Folha", "Folha de S.Paulo", "https://acervo.folha.uol.com.br/"], ["Acervo Estadão", "O Estado de S. Paulo", "https://acervo.estadao.com.br/"], ["Acervo O Globo", "O Globo", "https://acervo.oglobo.globo.com/"], ["Biblioteca Digital do Senado", t("recortes de jornais", "newspaper clippings"), "https://www2.senado.leg.br/bdsf/"], ["Museu de Valores", "Banco Central", "https://museuvalores.bcb.gov.br/"], ["Lei 8.024/1990", "Planalto", "https://www.planalto.gov.br/ccivil_03/leis/l8024.htm"], ["Conjur — Imagens da história", t("reportagem de 2009", "2009 report"), "https://www.conjur.com.br/2009-jun-25/imagens-historia-dia-collor-confiscou-poupanca/"]];

  /* gráfico real: inflação mês a mês, 1989–1991 */
  const chartCard = () => MB.card("mu_collor", {
    title: t("A inflação antes e depois de março de 1990", "Inflation before and after March 1990"), sub: t("IPCA de cada mês, de janeiro de 1989 a dezembro de 1991 (IBGE). As linhas marcam o Plano Verão, o Collor I e o Collor II.", "IPCA for each month, January 1989 to December 1991 (IBGE). Lines mark the Summer Plan, Collor I and Collor II."), src: ["sgs:ipca"], height: 330, noTable: false,
    build() {
      const a = MB.ser("ipca").filter((p) => p[0] >= "1989-01" && p[0] <= "1991-12"); if (!a.length) return null;
      const o = MB.baseOption({ yFmt: (v) => F(v, 0) + "%", tipFmt: (v) => F(v, 2) + "%" }); o.legend = { show: false };
      const s = MB.sBar("IPCA", C.btc, MB.toPts(a), { maxW: 22 }); const mar = MB.ymMs("1990-03");
      s.data.forEach((d) => { if (d.value[0] === mar) d.itemStyle.color = C.red; });
      const ev = [["1989-01-15", t("Verão", "Summer")], ["1990-03-16", "Collor I"], ["1991-01-31", "Collor II"]];
      s.markLine = { silent: true, symbol: "none", lineStyle: { color: C.ref, type: "dashed", width: 1 }, label: { color: C.text, fontSize: 10.5, formatter: (p) => p.data.nm, position: "end" }, data: ev.map(([d, nm]) => ({ xAxis: MB.isoMs(d), nm })) };
      o.grid.top = 26; o.series = [s];
      const p = ipcaAt("1990-03");
      return { option: o, big: p != null ? t(`Março de 1990: <span class="neg">${pf(p)}</span> em um mês`, `March 1990: <span class="neg">${pf(p)}</span> in one month`) : "", table: { cols: [t("Mês", "Month"), "IPCA"], rows: a.slice().reverse().map((x) => [MB.ymLabel(x[0]), F(x[1], 2) + "%"]) } };
    },
  });

  M.confisco = () => {
    const p3 = ipcaAt("1990-03"), y90 = yearAcc(1990), PN = MB.Pnow(), P2 = MB.P("1990-02"), P3 = MB.P("1990-03");
    const fm = PN && P2 && P3 ? PN / Math.sqrt(P2 * P3) : null, cap = fm ? LIM / MB.MOEDAS[5].F * fm : null;
    const ac = acervoFor("confisco");
    return `<div class="room-title"><span class="rn">SALA 02 ★</span><h2>${t("O confisco da poupança, 1990", "The 1990 savings freeze")}</h2></div>
    <p class="room-lead">${t("Uma sexta-feira de março, três dias de bancos fechados e um limite de NCz$ 50 mil: a história do Plano Collor I, contada com a lei, os números da época e as imagens que o museu pode mostrar.", "A Friday in March, three days of closed banks and a NCz$ 50,000 cap: the story of Collor Plan I, told with the law, the numbers of the time and the images the museum can show.")}</p>
    <div class="hero-c reveal"><div><div class="when-k">${t("Plano Brasil Novo · Plano Collor I", "Plano Brasil Novo · Collor Plan I")}</div><div class="when">16<em>·</em>03<em>·</em>1990</div><h3>${t("O dia em que o <u>dinheiro parou</u> nos bancos", "The day money <u>stopped</u> in the banks")}</h3>
      <p>${t("Um dia depois da posse, o governo anunciou a troca da moeda, o congelamento de preços e o <b>bloqueio dos saldos acima de NCz$ 50.000</b> em contas e poupanças. O que passava do limite ficou <b>18 meses</b> no Banco Central.", "A day after the inauguration, the government announced a change of currency, a price freeze and the <b>freezing of balances above NCz$ 50,000</b> in accounts and savings. What exceeded the cap stayed <b>18 months</b> at the central bank.")}</p>
      <div class="chips-c"><div class="fact hot"><b>NCz$ 50.000</b><span>${t("limite de liberação", "release cap")}</span></div><div class="fact or"><b>18 ${t("meses", "months")}</b><span>${t("retido no Banco Central", "held at the central bank")}</span></div>${p3 != null ? `<div class="fact"><b>${pf(p3)}</b><span>${t("inflação de março (IPCA)", "March inflation (IPCA)")}</span></div>` : ""}${y90 != null ? `<div class="fact"><b>${pf(y90)}</b><span>${t("inflação de 1990", "1990 inflation")}</span></div>` : ""}</div></div>
      <div class="frame" style="border:0;background:none">${`<div class="art" style="border-radius:12px;border:1px solid var(--line)">${IL.tv()}</div>`}</div></div>

    ${MB.sec("A", t("As cinco datas", "The five dates"), t("De quarta a segunda-feira: o que aconteceu, dia a dia. Toque em um dia.", "From Wednesday to Monday: what happened, day by day. Tap a day."), `<div class="steps" id="steps">${DAYS().map((d, i) => `<button type="button" class="step-b${i === 2 ? " on" : ""}" data-step="${i}"><small>${d.k} · ${d.d}</small><b>${d.h}</b></button>`).join("")}</div><div id="stepHost">${stepView(2)}</div>`)}

    ${MB.sec("B", t("O que dizia a lei", "What the law said"), t("Os três artigos da Lei 8.024/1990 que definiram o bloqueio, no texto oficial.", "The three articles of Law 8,024/1990 that defined the freeze, in the official text."), `${LAW().map((x) => `<div class="doc reveal"><div class="doc-k"><span>${x.art} · Lei 8.024, 12/04/1990</span><span>${t("texto oficial", "official text")}</span></div><blockquote>“${x.txt}”</blockquote><div class="plain">${x.plain}</div></div>`).join("")}<p class="src-line">${t("Atos oficiais são de domínio público. Fonte", "Official acts are in the public domain. Source")}: ${link("https://www.planalto.gov.br/ccivil_03/leis/l8024.htm", "planalto.gov.br")}</p>`)}

    ${MB.sec("C", t("E se fosse o seu dinheiro?", "What if it were your money?"), t("Digite um saldo e veja quanto teria sido liberado e quanto ficaria retido no Banco Central.", "Type a balance and see how much would have been released and how much would have been held at the central bank."), `<div class="sim-c" id="cfSim"><div class="calc"><div class="calc-in"><label>${t("Saldo", "Balance")}<input id="cfAmt" inputmode="decimal" value="${F(120000, 0)}"></label><label>${t("Em que unidade?", "In which unit?")}<select id="cfUnit"><option value="ncz">${t("NCz$ de março de 1990", "NCz$ of March 1990")}</option><option value="rs"${fm ? "" : " disabled"}>${t("R$ de hoje", "Today's R$")}</option></select></label></div><div class="calc-out" id="cfOut"></div></div></div>
      <div class="legal" style="margin-top:10px">${t("A conversão para reais de hoje usa a unidade do Real (R$ 1 = Cr$ 2.750.000, de 1990) e o índice de preços encadeado do site (IGP-DI/IPCA), com preços do meio de março de 1990. É uma ordem de grandeza, não um cálculo de indenização.", "The conversion to today's reais uses the Real's unit (R$ 1 = Cr$ 2,750,000 of 1990) and the site's chained price index (IGP-DI/IPCA), at mid-March 1990 prices. It is an order of magnitude, not a compensation calculation.")}${cap ? t(` Nessa conta, o teto de NCz$ 50.000 equivale a cerca de <b>${MB.brl(cap, 0)}</b> de hoje.`, ` On this reckoning, the NCz$ 50,000 cap is worth about <b>${MB.brl(cap, 0)}</b> today.`) : ""}</div>`)}

    ${MB.sec("D", t("O que a inflação registrou", "What inflation recorded"), t("A série oficial do IPCA, mês a mês, ao redor do plano.", "The official IPCA series, month by month, around the plan."), chartCard())}

    ${MB.sec("E", t("Mural: imagens e manchetes", "Mural: images and headlines"), t("Ilustrações originais do museu, uma manchete com fonte e o espaço para fotos licenciadas.", "The museum's original illustrations, a headline with its source and room for licensed photos."), `<div class="mural">${figSvg(IL.persiana(), t("<b>Agências fechadas</b> durante o feriado bancário, 14 a 16 de março.", "<b>Branches closed</b> during the bank holiday, 14 to 16 March."))}${figSvg(IL.fila(), t("<b>Fila na porta da agência</b> na segunda-feira, 19 de março.", "<b>Queue at the branch door</b> on Monday, 19 March."))}${figSvg(IL.caderneta(), t("<b>A caderneta de poupança</b> e o limite de NCz$ 50.000.", "<b>The savings passbook</b> and the NCz$ 50,000 cap."))}<figure class="frame fig-quote" style="grid-column:span 1">${headlineCard()}</figure>${ac.map(figImg).join("")}${!ac.length && MB.ACERVO_DICA !== false ? figEmpty() : ""}</div>
      <p class="note-art">${t("Por que não há fotos reais aqui? Fotografias e capas de jornal têm autor e licença. O museu usa ilustrações próprias e aponta os acervos oficiais abaixo; fotos licenciadas entram pelo arquivo <code>assets/museu/acervo.js</code>, com crédito.", "Why no real photos here? Photographs and newspaper covers have authors and licences. The museum uses its own illustrations and points to the official archives below; licensed photos go in through <code>assets/museu/acervo.js</code>, with credit.")}</p>`)}

    ${MB.sec("F", t("E depois?", "And afterwards?"), t("Do fim do bloqueio à decisão do Supremo, em 2025.", "From the end of the freeze to the Supreme Court decision in 2025."), `<ol class="tl">${TL().map((x) => `<li class="${x.hot ? "hot" : ""}"><span class="td">${x.d}</span><b>${x.h}</b><p>${x.p}</p><div class="src-line">${x.s.map(([n, u]) => link(u, n)).join(" · ")}</div></li>`).join("")}</ol>`)}

    ${MB.sec("G", t("Perguntas frequentes", "Frequently asked"), "", `<div class="faq">${FAQ().map(([q, a]) => `<details><summary>${q}</summary><div class="ans">${a}</div></details>`).join("")}</div>`)}

    ${MB.sec("H", t("Arquivos e fontes", "Archives and sources"), t("Para ver capas, fotos e documentos originais da época, consulte os acervos oficiais.", "To see the original covers, photos and documents of the time, consult the official archives."), `<div class="srcs">${ARCH().map(([n, s, u]) => `<a href="${u}" target="_blank" rel="noopener"><b>${n}</b> <span class="muted">${s}</span> ↗</a>`).join("")}</div>
      <p class="legal">${t("Fontes dos fatos desta sala: Lei 8.024/1990 e MPs 168, 172 e 180 (Planalto/Câmara); Poder360; Jornal Opção; Conjur; STF; Idec; Agência Senado; IBGE (IPCA). Não é aconselhamento jurídico.", "Sources for the facts in this room: Law 8,024/1990 and MPs 168, 172 and 180 (Planalto/Chamber of Deputies); Poder360; Jornal Opção; Conjur; Supreme Court; Idec; Agência Senado; IBGE (IPCA). Not legal advice.")}</p>`)}`;
  };

  /* interações da sala do confisco */
  const nomN = (v) => (!isFinite(v) ? "—" : F(v, v < 100 ? 2 : 0));
  function simUpdate(root) {
    const amtIn = MB.parseNum(root.querySelector("#cfAmt").value) || 0, unit = root.querySelector("#cfUnit").value, out = root.querySelector("#cfOut");
    const PN = MB.Pnow(), P2 = MB.P("1990-02"), P3 = MB.P("1990-03"), fm = PN && P2 && P3 ? PN / Math.sqrt(P2 * P3) : null, F0 = MB.MOEDAS[5].F;
    const ncz = unit === "rs" && fm ? (amtIn / fm) * F0 : amtIn, ok = Math.min(ncz, LIM), lock = Math.max(0, ncz - LIM), tot = ok + lock || 1;
    const hoje = (v) => (fm ? MB.brl((v / F0) * fm, 0) : "—");
    out.innerHTML = `<div class="out-big"><div class="l">${t("Saldo em março de 1990", "Balance in March 1990")}</div><div class="v">NCz$ ${nomN(ncz)}</div><div class="s">${fm ? t(`≈ <b>${hoje(ncz)}</b> em reais de hoje`, `≈ <b>${hoje(ncz)}</b> in today's reais`) : ""}</div></div>
      <div class="splitbar" role="img" aria-label="${t("Divisão entre liberado e bloqueado", "Split between released and frozen")}"><i class="ok" style="width:${(ok / tot) * 100}%"></i><i class="lock" style="width:${(lock / tot) * 100}%"></i></div>
      <div class="sim-legend"><span>${t("Liberado", "Released")}: <b>NCz$ ${nomN(ok)}</b>${fm ? ` · ${hoje(ok)}` : ""}</span><span>${t("Retido no Banco Central", "Held at the central bank")}: <b>NCz$ ${nomN(lock)}</b>${fm ? ` · ${hoje(lock)}` : ""}</span></div>
      <p class="sim-note">${lock > 0 ? t("O valor retido ficaria 18 meses no Banco Central e seria devolvido em 12 parcelas mensais a partir de 16/09/1991, corrigido pelo BTN mais 6% ao ano.", "The held amount would stay 18 months at the central bank and be returned in 12 monthly instalments from 16/09/1991, adjusted by the BTN plus 6% a year.") : t("Saldo dentro do limite: seria convertido em cruzeiros, sem retenção.", "Balance within the cap: it would be converted to cruzeiros, with no hold.")}</p>`;
  }
  M.confiscoAfter = (root) => {
    const steps = root.querySelector("#steps"), host = root.querySelector("#stepHost");
    steps?.addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (!b) return; steps.querySelectorAll(".step-b").forEach((x) => x.classList.toggle("on", x === b)); host.innerHTML = stepView(+b.dataset.step); });
    const sim = root.querySelector("#cfSim"); if (sim) { sim.addEventListener("input", () => simUpdate(sim)); sim.addEventListener("change", () => simUpdate(sim)); simUpdate(sim); }
  };
})();
