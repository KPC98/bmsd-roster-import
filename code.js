// BMSD Roster Import v1.1 — self-contained, no server, no hardcoded node IDs.
// Creates the "Comp" COMPONENT_SET (Players=4/5/6) if the file doesn't have one,
// then builds one instance per team with player photos.
let stage = 'start';
const imagesByTeam = {};
let teamOrder = [];
let compSet = null, targetPage = null, ax = 0, yStart = 0;

const WIDTH_TARGET = 2290; // BMSD comp frame width
const HEIGHT = 1000;
function spacingFor(n) { return n > 1 ? Math.round(((WIDTH_TARGET - 1000 * n) / (n - 1)) * 100) / 100 : 0; }
const SLOT_FILL = [{ type: 'SOLID', color: { r: 0.149, g: 0.192, b: 0.290 } }]; // slate placeholder #26314A
const LABEL_FONT = { family: 'Inter', style: 'Bold' };
let labelFontReady = false;
async function ensureLabelFont() {
  if (labelFontReady) return;
  try { await figma.loadFontAsync(LABEL_FONT); labelFontReady = true; } catch (e) {}
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

function buildVariant(prefix, n) {
  const c = figma.createComponent();
  const sp = spacingFor(n);
  try { c.name = prefix + '=' + n; } catch (e) {}
  try { c.layoutMode = 'HORIZONTAL'; } catch (e) {}
  try { c.primaryAxisSpacing = sp; } catch (e) {}
  try { c.primaryAxisSizingMode = 'AUTO'; } catch (e) {}
  try { c.counterAxisSizingMode = 'AUTO'; } catch (e) {}
  try { c.clipsContent = false; } catch (e) {}
  try { c.fills = []; } catch (e) {}
  const slots = [];
  for (let i = 0; i < n; i++) {
    // slot = frame(slate rect + temp number) so variants stay visible pre-import
    const s = figma.createFrame();
    s.name = 'slot ' + (i + 1);
    s.resize(1000, 1000);
    s.layoutMode = 'NONE';
    s.clipsContent = true;
    s.fills = [];
    const r = figma.createRectangle();
    r.name = 'photo';
    r.resize(1000, 1000);
    r.fills = SLOT_FILL;
    s.appendChild(r);
    if (labelFontReady) {
      try {
        const t = figma.createText();
        t.fontName = LABEL_FONT;
        t.characters = String(i + 1);
        t.fontSize = 400;
        t.fills = [{ type: 'SOLID', color: { r: 0.92, g: 0.94, b: 0.97 } }];
        s.appendChild(t);
        t.x = (1000 - t.width) / 2;
        t.y = (1000 - t.height) / 2;
      } catch (e) {}
    }
    c.appendChild(s);
    slots.push(s);
  }
  // verify auto-layout actually applied; otherwise fall back to manual positioning
  const autoOk = c.layoutMode === 'HORIZONTAL' && c.children.length === n &&
    n > 1 && Math.abs((c.children[1].x - c.children[0].x) - (1000 + sp)) < 1;
  if (!autoOk) {
    try { c.layoutMode = 'NONE'; } catch (e) {}
    try { c.resize(WIDTH_TARGET, HEIGHT); } catch (e) {}
    slots.forEach((s, i) => { try { s.x = i * (1000 + sp); s.y = 0; } catch (e) {} });
  }
  return c;
}

// slot accessor: works for both plain-rect comps (BMSD original) and framed slots (plugin-created)
function slotNodes(inst) {
  return inst.children.map(c => {
    if (c.type === 'RECTANGLE') return { container: c, rect: c };
    if (c.type === 'FRAME') {
      const r = c.children.find(k => k.type === 'RECTANGLE');
      if (r) return { container: c, rect: r };
    }
    return null;
  }).filter(Boolean);
}

figma.showUI(__html__, { width: 400, height: 140, title: 'BMSD Roster Import' });

figma.ui.onmessage = async msg => {
  try {
    if (msg.type === 'start') {
      teamOrder = msg.teams;
      stage = 'load pages';
      await figma.loadAllPagesAsync();
      stage = 'resolve page';
      targetPage = figma.currentPage;
      if (!targetPage) targetPage = figma.root.children.find(p => p.type === 'PAGE');
      if (!targetPage) { figma.closePlugin('No page found in this file.'); return; }

      stage = 'find sets';
      const sets = figma.root.findAll(n => n.type === 'COMPONENT_SET' && n.name === 'Comp');
      if (sets.length) {
        compSet = sets[0];
      } else {
        stage = 'build variants';
        await ensureLabelFont();
        const comps = [4, 5, 6].map(n => buildVariant('Players', n));
        stage = 'combine as variants';
        compSet = figma.combineAsVariants(comps, targetPage);
        try { compSet.name = 'Comp'; } catch (e) {}
        try {
          compSet.x = 0;
          compSet.y = 0;
        } catch (e) {}
      }
      stage = 'position anchor';
      ax = compSet.absoluteTransform[0][2];
      yStart = compSet.absoluteTransform[1][2] + compSet.height + 200;
    } else if (msg.type === 'image') {
      stage = 'decode ' + msg.team + '/' + msg.name;
      const img = figma.createImage(b64ToBytes(msg.b64));
      (imagesByTeam[msg.team] = imagesByTeam[msg.team] || []).push({ name: msg.name, hash: img.hash });
    } else if (msg.type === 'done') {
      stage = 'import';
      const variants = {};
      let prefix = 'Players';
      for (const c of compSet.children) {
        if (c.type !== 'COMPONENT') continue;
        const m = /^([^=]+)=(\d+)$/.exec(c.name);
        if (m) { prefix = m[1]; variants[+m[2]] = c; }
      }
      // auto-add any missing variant a team needs
      for (const team of teamOrder) {
        const n = (imagesByTeam[team] || []).length;
        if (n && !variants[n]) {
          await ensureLabelFont();
          const c = buildVariant(prefix, n);
          compSet.appendChild(c);
          variants[n] = c;
        }
      }

      let y = yStart;
      const created = [];
      for (const team of teamOrder) {
        const imgs = (imagesByTeam[team] || []).slice().sort((a, b) => a.name.localeCompare(b.name));
        if (!imgs.length) continue;
        const variant = variants[imgs.length];
        if (!variant) continue;

        const inst = variant.createInstance();
        targetPage.appendChild(inst);
        inst.name = team;
        inst.x = ax;
        inst.y = y;

        const slots = slotNodes(inst);
        for (let i = 0; i < Math.min(slots.length, imgs.length); i++) {
          slots[i].rect.fills = [{ type: 'IMAGE', imageHash: imgs[i].hash, scaleMode: 'FILL' }];
          slots[i].container.name = imgs[i].name;
          // drop the temporary character once the real photo is in
          slots[i].container.children.filter(k => k.type === 'TEXT').forEach(k => { try { k.remove(); } catch (e) {} });
        }
        created.push(inst);
        y += inst.height + 200;
      }
      if (created.length) figma.viewport.scrollAndZoomIntoView(created);
      figma.closePlugin('Imported ' + created.length + ' team frames');
    }
  } catch (e) {
    figma.closePlugin('Error at [' + stage + ']: ' + e.message);
  }
};
