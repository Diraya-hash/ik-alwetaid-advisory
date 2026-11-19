// Lane-aware layered layout + orthogonal routing + SVG renderer + quality metrics. Runs in Chromium so text
// is measured with the real fonts and shaping engine (layout-service approach, 02 §6.4a).
(function () {
  const FONT = { ar: '"IBM Plex Sans Arabic"', en: 'Inter' };
  const FS = 13, LH = 19, PAD = 10, HEADER_W = 128, LANE_PAD = 22, GAP = 64, CH_STEP = 7;
  // Finding (Phase 0 run 3): a canvas context created before web fonts finish loading keeps returning
  // fallback-font metrics. Create the measuring context lazily, per layout call, after the font gate.
  let ctx = null;
  const measure = (t, lang, weight = 500) => { ctx.font = `${weight} ${FS}px ${FONT[lang]}`; return ctx.measureText(t).width; };
  function wrap(text, lang, maxW, weight = 500) {
    const words = text.split(/\s+/); const lines = []; let cur = "";
    for (const w of words) { const t = cur ? cur + " " + w : w; if (measure(t, lang, weight) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } }
    if (cur) lines.push(cur); return lines;
  }

  function layout(model, lang, dir, opts = {}) {
    const t0 = performance.now();
    ctx = document.createElement("canvas").getContext("2d");
    const nodes = model.nodes.map(n => ({ ...n, text: n.label[lang] }));
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    for (const n of nodes) {
      if (n.type === "task") {
        n.lines = wrap(n.text, lang, 150); const tw = Math.max(...n.lines.map(l => measure(l, lang)));
        n.w = Math.max(116, Math.ceil(tw) + 2 * PAD + 4); n.h = Math.max(52, n.lines.length * LH + 2 * PAD); n.ow = n.w; n.oh = n.h; n.labelOutside = false;
      } else {
        const s = n.type === "gateway" ? 44 : 32; n.w = s; n.h = s;
        n.lines = wrap(n.text, lang, 104); const tw = Math.max(...n.lines.map(l => measure(l, lang)));
        n.ow = Math.max(s, Math.ceil(tw) + 4); n.oh = s + 6 + n.lines.length * LH; n.labelOutside = true;
      }
    }
    // back-edge detection by DFS (model order)
    const out = {}; model.edges.forEach(e => (out[e.from] ||= []).push(e));
    const state = {}, back = new Set();
    const dfs = v => { state[v] = 1; for (const e of out[v] || []) { if (state[e.to] === 1) back.add(e.id); else if (!state[e.to]) dfs(e.to); } state[v] = 2; };
    nodes.filter(n => n.type === "start").forEach(n => dfs(n.id)); nodes.forEach(n => { if (!state[n.id]) dfs(n.id); });
    // longest-path layering on forward edges
    const fwd = model.edges.filter(e => !back.has(e.id));
    const layer = Object.fromEntries(nodes.map(n => [n.id, 0]));
    for (let it = 0; it < nodes.length; it++) { let ch = false; for (const e of fwd) if (layer[e.to] < layer[e.from] + 1) { layer[e.to] = layer[e.from] + 1; ch = true; } if (!ch) break; }
    nodes.forEach(n => (n.layer = layer[n.id]));
    const nL = Math.max(...nodes.map(n => n.layer)) + 1;
    const laneIdx = Object.fromEntries(model.lanes.map((l, i) => [l.id, i]));
    // cells & ordering
    const cells = {};
    for (const n of nodes) (cells[`${n.layer}|${n.lane}`] ||= []).push(n);
    // column widths
    // Option fixedColumns: every column gets the max possible node width (task max 174, labels max 108), so text edits
    // don't shift downstream columns (edit-stability finding).
    const colW = Array.from({ length: nL }, (_, i) => opts.fixedColumns ? 180 : Math.max(...nodes.filter(n => n.layer === i).map(n => n.ow)));
    const colX = []; let x = HEADER_W + 24; for (let i = 0; i < nL; i++) { colX.push(x); x += colW[i] + GAP; }
    const W = x - GAP + 24;
    // back-edge channels per lane (below lane content)
    const backEdges = model.edges.filter(e => back.has(e.id) || byId[e.to].layer <= byId[e.from].layer);
    const chanCount = {}; backEdges.forEach(e => { const lane = [byId[e.from].lane, byId[e.to].lane].sort((a, b) => laneIdx[b] - laneIdx[a])[0]; e._chanLane = lane; e._chan = (chanCount[lane] = (chanCount[lane] || 0) + 1); });
    // lane heights
    const lanes = model.lanes.map(l => {
      let content = 0;
      for (let i = 0; i < nL; i++) { const c = cells[`${i}|${l.id}`] || []; content = Math.max(content, c.reduce((s, n) => s + n.oh, 0) + Math.max(0, c.length - 1) * 18); }
      return { ...l, text: l.label[lang], content, h: Math.max(96, content + 2 * LANE_PAD + (chanCount[l.id] || 0) * CH_STEP + (chanCount[l.id] ? 8 : 0)) };
    });
    let y = 0; for (const l of lanes) { l.y = y; y += l.h; } const H = y;
    for (const l of lanes) for (let i = 0; i < nL; i++) {
      const c = cells[`${i}|${l.id}`] || []; const tot = c.reduce((s, n) => s + n.oh, 0) + Math.max(0, c.length - 1) * 18;
      let cy = l.y + LANE_PAD + (l.content - tot) / 2;
      for (const n of c) { n.ox = colX[i] + (colW[i] - n.ow) / 2; n.oy = cy; n.x = n.ox + (n.ow - n.w) / 2; n.y = n.oy; cy += n.oh + 18; }
    }
    // edges
    const box = n => ({ x: n.x, y: n.y, w: n.w, h: n.h });
    const gapUse = {};
    function hits(pts, ignore) {
      let c = 0;
      for (let i = 0; i < pts.length - 1; i++) for (const n of nodes) {
        if (ignore.includes(n.id)) continue;
        const b = { x: n.ox - 2, y: n.oy - 2, w: n.ow + 4, h: n.oh + 4 }; if (segRect(pts[i], pts[i + 1], b)) c++;
      }
      return c;
    }
    const outCount = {}; model.edges.forEach(e => (outCount[e.from] = (outCount[e.from] || 0) + 1));
    const edges = model.edges.map(e => {
      const s = byId[e.from], t = byId[e.to];
      let pts, labelAt;
      const sLane = laneIdx[s.lane], tLane = laneIdx[t.lane];
      if (back.has(e.id) || t.layer <= s.layer) {
        // back edge: leave from the upstream side into the gap before the source column, run along the lane-bottom
        // channel, enter the target from below (avoids passing through nodes stacked in the source column)
        const lane = lanes.find(l => l.id === e._chanLane); const cy = lane.y + lane.h - 6 - (e._chan - 1) * CH_STEP;
        const gx = colX[s.layer] - GAP / 2 + 6 + (e._chan - 1) * CH_STEP;
        const sy = s.y + s.h / 2, tx = t.x + t.w / 2;
        pts = [[s.x, sy], [gx, sy], [gx, cy], [tx, cy], [tx, t.y + t.h]];
        labelAt = 0;
      } else if (s.type === "gateway" && outCount[s.id] > 1 && tLane !== sLane) {
        // gateway branch to another lane: exit from the bottom/top vertex, then run horizontally into the target
        const down = tLane > sLane, sx = s.x + s.w / 2, sy = down ? s.y + s.h : s.y, ty = t.y + t.h / 2;
        pts = [[sx, sy], [sx, ty], [t.x, ty]]; labelAt = 0;
      } else {
        const sy = s.y + s.h / 2, ty = t.y + t.h / 2, sx = s.x + s.w, tx = t.x;
        const k1 = (gapUse[`a${s.layer}`] = (gapUse[`a${s.layer}`] || 0) + 1);
        const g1 = colX[s.layer] + colW[s.layer] + GAP / 2 - 10 + (k1 - 1) * CH_STEP;
        const k2 = (gapUse[`b${t.layer}`] = (gapUse[`b${t.layer}`] || 0) + 1);
        const g2 = colX[t.layer] - GAP / 2 + 10 - (k2 - 1) * CH_STEP;
        const A = Math.abs(sy - ty) < 1 ? [[sx, sy], [tx, ty]] : [[sx, sy], [g1, sy], [g1, ty], [tx, ty]];
        const B = Math.abs(sy - ty) < 1 ? A : [[sx, sy], [g2, sy], [g2, ty], [tx, ty]];
        pts = hits(B, [s.id, t.id]) < hits(A, [s.id, t.id]) ? B : A; labelAt = 0;
      }
      return { ...e, text: e.label ? e.label[lang] : null, pts, back: back.has(e.id), labelAt };
    });
    let res = { model: model.id, lang, dir, W, H, lanes, nodes, edges, headerW: HEADER_W };
    if (dir === "rtl") res = mirror(res);
    res.layoutMs = +(performance.now() - t0).toFixed(1);
    return res;
  }

  function mirror(r) {
    const W = r.W, mx = x => W - x;
    r.nodes.forEach(n => { n.x = W - n.x - n.w; n.ox = W - n.ox - n.ow; });
    r.edges.forEach(e => (e.pts = e.pts.map(([x, y]) => [mx(x), y])));
    r.headerSide = "right"; return r;
  }

  function segRect(a, b, r) {
    const [x1, y1] = a, [x2, y2] = b;
    if (Math.max(x1, x2) < r.x || Math.min(x1, x2) > r.x + r.w || Math.max(y1, y2) < r.y || Math.min(y1, y2) > r.y + r.h) return false;
    return true; // axis-aligned segments: bbox overlap == intersection
  }
  function segX(a, b, c, d) { // crossing of axis-aligned segments (one H one V), excluding shared endpoints
    const h1 = a[1] === b[1], h2 = c[1] === d[1]; if (h1 === h2) return false;
    const [H1, H2, V1, V2] = h1 ? [a, b, c, d] : [c, d, a, b];
    const x = V1[0], y = H1[1];
    const inH = x > Math.min(H1[0], H2[0]) + 0.5 && x < Math.max(H1[0], H2[0]) - 0.5;
    const inV = y > Math.min(V1[1], V2[1]) + 0.5 && y < Math.max(V1[1], V2[1]) - 0.5;
    return inH && inV;
  }

  function metrics(r) {
    let overlaps = 0; const N = r.nodes;
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const a = N[i], b = N[j];
      if (a.ox < b.ox + b.ow && b.ox < a.ox + a.ow && a.oy < b.oy + b.oh && b.oy < a.oy + a.oh) overlaps++;
    }
    let edgeNode = 0;
    for (const e of r.edges) for (let i = 0; i < e.pts.length - 1; i++) for (const n of N) {
      if (n.id === e.from || n.id === e.to) continue;
      if (segRect(e.pts[i], e.pts[i + 1], { x: n.ox + 1, y: n.oy + 1, w: n.ow - 2, h: n.oh - 2 })) edgeNode++;
    }
    let crossings = 0; const E = r.edges;
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++)
      for (let a = 0; a < E[i].pts.length - 1; a++) for (let b = 0; b < E[j].pts.length - 1; b++)
        if (segX(E[i].pts[a], E[i].pts[a + 1], E[j].pts[b], E[j].pts[b + 1])) crossings++;
    // collinear overlapping segments between different edges (> 4px shared length)
    let collinear = 0;
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
      if (E[i].to === E[j].to) continue; // fan-in merging into one target is acceptable BPMN convention
      for (let a = 0; a < E[i].pts.length - 1; a++) for (let b = 0; b < E[j].pts.length - 1; b++) {
        const [p1, p2] = [E[i].pts[a], E[i].pts[a + 1]], [q1, q2] = [E[j].pts[b], E[j].pts[b + 1]];
        const v1 = Math.abs(p1[0] - p2[0]) < 0.5, v2 = Math.abs(q1[0] - q2[0]) < 0.5, h1 = Math.abs(p1[1] - p2[1]) < 0.5, h2 = Math.abs(q1[1] - q2[1]) < 0.5;
        if (v1 && v2 && Math.abs(p1[0] - q1[0]) < 0.5) { const o = Math.min(Math.max(p1[1], p2[1]), Math.max(q1[1], q2[1])) - Math.max(Math.min(p1[1], p2[1]), Math.min(q1[1], q2[1])); if (o > 4) collinear++; }
        else if (h1 && h2 && Math.abs(p1[1] - q1[1]) < 0.5) { const o = Math.min(Math.max(p1[0], p2[0]), Math.max(q1[0], q2[0])) - Math.max(Math.min(p1[0], p2[0]), Math.min(q1[0], q2[0])); if (o > 4) collinear++; }
      }
    }
    // edges crossing ANY node's external label area (incl. their own source/target)
    let edgeLabel = 0;
    for (const e of E) for (let i = 0; i < e.pts.length - 1; i++) for (const n of N) {
      if (!n.labelOutside) continue;
      const lb = { x: n.ox + 1, y: n.y + n.h + 3, w: n.ow - 2, h: n.oh - n.h - 4 };
      if (segRect(e.pts[i], e.pts[i + 1], lb)) edgeLabel++;
    }
    let dirOK = 0, dirN = 0;
    for (const e of E) { if (e.back) continue; dirN++; const s = e.pts[0][0], t = e.pts[e.pts.length - 1][0]; if (r.dir === "ltr" ? t >= s : t <= s) dirOK++; }
    let laneOK = 0;
    for (const n of N) { const l = r.lanes.find(l => l.id === n.lane); if (n.oy >= l.y && n.oy + n.oh <= l.y + l.h) laneOK++; }
    return { nodes: N.length, edges: E.length, nodeOverlaps: overlaps, edgeThroughNode: edgeNode, edgeCrossings: crossings, collinearOverlaps: collinear, edgeThroughLabel: edgeLabel,
      flowDirectionCorrectPct: +(100 * dirOK / dirN).toFixed(1), nodesInsideLanePct: +(100 * laneOK / N.length).toFixed(1) };
  }

  function render(r) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", r.W); svg.setAttribute("height", r.H); svg.setAttribute("viewBox", `0 0 ${r.W} ${r.H}`);
    svg.setAttribute("font-family", FONT[r.lang]); svg.setAttribute("font-size", FS); svg.setAttribute("font-weight", 500); // must equal the measuring font spec
    svg.innerHTML = `<defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#0B1F3A"/></marker></defs>`;
    const el = (tag, attrs, parent = svg) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
    const hx = r.dir === "rtl" ? r.W - r.headerW : 0;
    r.lanes.forEach((l, i) => {
      el("rect", { x: 0, y: l.y, width: r.W, height: l.h, fill: i % 2 ? "#F4FAFF" : "#FFFFFF", stroke: "#9CC8F8" });
      el("rect", { x: hx, y: l.y, width: r.headerW, height: l.h, fill: "#EAF4FF", stroke: "#9CC8F8" });
      const lines = wrap(l.text, r.lang, r.headerW - 20, 600);
      const t = el("text", { x: hx + r.headerW / 2, y: l.y + l.h / 2 - (lines.length - 1) * LH / 2 + 4, "text-anchor": "middle", "font-weight": 600, fill: "#0B1F3A", direction: r.lang === "ar" ? "rtl" : "ltr", "data-maxw": r.headerW - 20 });
      lines.forEach((ln, k) => { const ts = el("tspan", { x: hx + r.headerW / 2, dy: k ? LH : 0 }, t); ts.textContent = ln; });
    });
    for (const e of r.edges) {
      el("polyline", { points: e.pts.map(p => p.join(",")).join(" "), fill: "none", stroke: e.back ? "#596779" : "#0B1F3A", "stroke-width": 1.4, "stroke-dasharray": e.back ? "5 3" : "", "marker-end": "url(#arr)" });
      if (e.text) { const [x0, y0] = e.pts[0], [x1, y1] = e.pts[1]; const vertical = Math.abs(x0 - x1) < 1;
        const lx = vertical ? x0 + (r.dir === "rtl" ? -14 : 14) : x0 + Math.sign(x1 - x0) * 16, ly = vertical ? y0 + Math.sign(y1 - y0) * 14 + 4 : y0 - 6;
        const t = el("text", { x: lx, y: ly, "text-anchor": "middle", "font-size": 11, fill: "#3C4C61", direction: r.lang === "ar" ? "rtl" : "ltr" }); t.textContent = e.text; }
    }
    for (const n of r.nodes) {
      const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
      if (n.type === "task") el("rect", { x: n.x, y: n.y, width: n.w, height: n.h, rx: 8, fill: "#FFFFFF", stroke: "#1464F4", "stroke-width": 1.5 });
      if (n.type === "gateway") { el("polygon", { points: `${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}`, fill: "#FFF7E6", stroke: "#9A5808", "stroke-width": 1.5 }); }
      if (n.type === "start") el("circle", { cx, cy, r: n.w / 2, fill: "#E8F5EE", stroke: "#1F7A4D", "stroke-width": 1.5 });
      if (n.type === "end") el("circle", { cx, cy, r: n.w / 2, fill: "#FDE6E6", stroke: "#B91C1C", "stroke-width": 3 });
      const maxw = n.type === "task" ? n.w - 2 * PAD : n.ow;
      const y0 = n.labelOutside ? n.y + n.h + 6 + 12 : cy - (n.lines.length - 1) * LH / 2 + 4.5;
      const t = el("text", { x: cx, y: y0, "text-anchor": "middle", fill: "#0B1F3A", direction: r.lang === "ar" ? "rtl" : "ltr", "data-maxw": maxw, "data-node": n.id });
      n.lines.forEach((ln, k) => { const ts = el("tspan", { x: cx, dy: k ? LH : 0 }, t); ts.textContent = ln; });
    }
    document.body.innerHTML = ""; document.body.appendChild(svg);
    // label-fit check with REAL rendered text lengths
    let lines = 0, overflow = 0, maxDelta = 0;
    svg.querySelectorAll("text[data-maxw]").forEach(t => {
      const mw = +t.getAttribute("data-maxw");
      t.querySelectorAll("tspan").forEach(ts => { lines++; const L = ts.getComputedTextLength(); if (L > mw + 1) overflow++; });
    });
    // canvas-vs-SVG measurement parity
    r.nodes.forEach(n => n.lines.forEach((ln, k) => {
      const ts = svg.querySelector(`text[data-node="${n.id}"]`).querySelectorAll("tspan")[k];
      maxDelta = Math.max(maxDelta, Math.abs(ts.getComputedTextLength() - measure(ln, r.lang)));
    }));
    return { labelLines: lines, labelOverflow: overflow, measureParityMaxDeltaPx: +maxDelta.toFixed(2) };
  }

  window.BPMN = { layout, metrics, render };
})();
