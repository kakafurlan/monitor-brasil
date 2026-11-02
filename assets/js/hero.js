/* Monitor Brasil — mapa de pontos do Brasil no banner (decorativo: deixa claro que o assunto é o Brasil).
 * Rasteriza os estados em uma máscara e desenha uma malha de pontos com ondas laranja e "pulsos" (como transações). */
(() => {
  "use strict";
  const MB = window.MB;
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let geo = null, dots = [], W = 0, H = 0, dpr = 1, mouse = { x: -999, y: -999 }, pulses = [], raf = 0, last = 0, step = 8, compact = false, building = false;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function loadGeo() {
    if (geo) return geo;
    try { geo = MB.geoData?.("br") || (await (await fetch("assets/geo/br-states.json")).json()); } catch { geo = { features: [] }; }
    return geo;
  }
  async function build() {
    if (building) return; building = true;
    const g = await loadGeo();
    const r = canvas.getBoundingClientRect(); W = Math.max(40, Math.round(r.width)); H = Math.max(40, Math.round(r.height));
    dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lon0 = -74.2, lon1 = -34.5, lat0 = -34.2, lat1 = 5.6, k = Math.cos((15 * Math.PI) / 180);
    const gw = (lon1 - lon0) * k, gh = lat1 - lat0, sc = Math.min((W * 0.94) / gw, (H * 0.92) / gh);
    const ox = (W - gw * sc) / 2, oy = (H - gh * sc) / 2;
    const proj = (lon, lat) => [ox + (lon - lon0) * k * sc, oy + (lat1 - lat) * sc];
    const m = document.createElement("canvas"); m.width = W; m.height = H; const mc = m.getContext("2d", { willReadFrequently: true });
    mc.fillStyle = "#fff"; mc.beginPath();
    for (const f of g.features) {
      const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) for (const ring of poly) ring.forEach(([lo, la], i) => { const [x, y] = proj(lo, la); i ? mc.lineTo(x, y) : mc.moveTo(x, y); }), mc.closePath();
    }
    mc.fill("evenodd");
    const px = mc.getImageData(0, 0, W, H).data;
    step = compact ? Math.max(4.5, Math.min(6, H / 30)) : Math.max(6, Math.min(9, W / 78));
    dots = [];
    let row = 0;
    for (let y = step / 2; y < H; y += step * 0.866, row++) {
      for (let x = (row % 2 ? step : step / 2); x < W; x += step) {
        if (px[((y | 0) * W + (x | 0)) * 4 + 3] > 120) dots.push({ x, y, ph: Math.random() * 6.283, s: 0.75 + Math.random() * 0.5 });
      }
    }
    building = false;
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    if (compact && now - last < 45) return; // ~22 fps no modo compacto
    last = now;
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    const rad = step * 0.2;
    for (const d of dots) {
      const sweep = Math.max(0, Math.sin(d.x * 0.011 + d.y * 0.007 - t * 0.85)); const w = sweep ** 7;
      let a = 0.3 + 0.12 * Math.sin(t * 0.9 + d.ph) + w * 0.5, r = rad * d.s * (1 + w * 0.6);
      const dx = d.x - mouse.x, dy = d.y - mouse.y, dd = dx * dx + dy * dy;
      let hot = w;
      if (dd < 9000) { const q = 1 - Math.sqrt(dd) / 95; a += q * 0.6; r += q * rad * 1.2; hot = Math.max(hot, q); }
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = hot > 0.25 ? "#ff8a00" : d.s > 1.05 ? "#c4bdff" : "#7b61ff";
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 6.283); ctx.fill();
    }
    /* pulsos laranja (cada um lembra uma transação saindo de um ponto) */
    if (!reduce && !compact && dots.length && pulses.length < 4 && Math.random() < 0.035) { const d = dots[(Math.random() * dots.length) | 0]; pulses.push({ x: d.x, y: d.y, t0: now }); }
    pulses = pulses.filter((p) => now - p.t0 < 2200);
    for (const p of pulses) {
      const k = (now - p.t0) / 2200;
      ctx.globalAlpha = (1 - k) * 0.7; ctx.strokeStyle = "#ff8a00"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3 + k * 44, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 1 - k; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const banner = canvas.closest(".banner");
  banner?.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  banner?.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
  let rt; const rebuild = (delay = 150) => { clearTimeout(rt); rt = setTimeout(async () => { await build(); canvas.style.opacity = "1"; }, delay); };
  window.addEventListener("resize", () => rebuild(200));
  /* a faixa do banner anima a altura ao trocar de aba: reconstrói quando o tamanho real mudar e estabilizar */
  if ("ResizeObserver" in window) new ResizeObserver(() => { const r = canvas.getBoundingClientRect(); if (Math.abs(r.width - W) > 3 || Math.abs(r.height - H) > 3) { canvas.style.opacity = "0"; rebuild(220); } }).observe(canvas);
  /** chamado pelo roteador de abas: painel = mapa grande; demais = faixa compacta */
  MB.hero = {
    mode(isCompact) {
      if (compact === isCompact && dots.length) return;
      compact = isCompact; canvas.style.opacity = "0"; rebuild(780);
    },
    init(isCompact) { compact = isCompact; build().then(() => { canvas.style.opacity = "1"; }); },
  };
  canvas.style.transition = "opacity .35s ease";
})();
