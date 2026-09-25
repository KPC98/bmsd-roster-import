// BMSD Roster Import — self-contained, no server, no hardcoded node IDs.
// Finds the "Comp" COMPONENT_SET in the current file, then creates one instance
// per team (variant Players=N matched to roster size) with player photos.
let stage = 'start';
const imagesByTeam = {};
let teamOrder = [];
let compSet = null, targetPage = null, ax = 0, yStart = 0;

function b64ToBytes(b64) {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

figma.showUI(__html__, { width: 400, height: 140, title: 'BMSD Roster Import' });

figma.ui.onmessage = async msg => {
  try {
    if (msg.type === 'start') {
      stage = 'find comp set';
      teamOrder = msg.teams;
      await figma.loadAllPagesAsync();
      const sets = figma.root.findAll(n => n.type === 'COMPONENT_SET' && n.name === 'Comp');
      if (!sets.length) { figma.closePlugin('Component set "Comp" not found in this file.'); return; }
      compSet = sets[0];
      let p = compSet;
      while (p && p.type !== 'PAGE') p = p.parent;
      targetPage = p;
      ax = compSet.absoluteTransform[0][2];
      yStart = compSet.absoluteTransform[1][2] + compSet.height + 200;
    } else if (msg.type === 'image') {
      stage = 'decode ' + msg.team + '/' + msg.name;
      const img = figma.createImage(b64ToBytes(msg.b64));
      (imagesByTeam[msg.team] = imagesByTeam[msg.team] || []).push({ name: msg.name, hash: img.hash });
    } else if (msg.type === 'done') {
      stage = 'import';
      const variants = {};
      for (const c of compSet.children) {
        if (c.type !== 'COMPONENT') continue;
        const m = /^Players=(\d+)$/.exec(c.name);
        if (m) variants[+m[1]] = c;
      }
      let y = yStart;
      const created = [], skipped = [];
      for (const team of teamOrder) {
        const imgs = (imagesByTeam[team] || []).slice().sort((a, b) => a.name.localeCompare(b.name));
        if (!imgs.length) continue;
        const variant = variants[imgs.length];
        if (!variant) { skipped.push(team + ' (' + imgs.length + ' players)'); continue; }

        const inst = variant.createInstance();
        targetPage.appendChild(inst);
        inst.name = team;
        inst.x = ax;
        inst.y = y;

        const slots = inst.children.filter(c => c.type === 'RECTANGLE');
        for (let i = 0; i < Math.min(slots.length, imgs.length); i++) {
          slots[i].fills = [{ type: 'IMAGE', imageHash: imgs[i].hash, scaleMode: 'FILL' }];
          slots[i].name = imgs[i].name;
        }
        created.push(inst);
        y += inst.height + 200;
      }
      if (created.length) figma.viewport.scrollAndZoomIntoView(created);
      let msgOut = 'Imported ' + created.length + ' team frames';
      if (skipped.length) msgOut += ' — skipped (no variant): ' + skipped.join(', ');
      figma.closePlugin(msgOut);
    }
  } catch (e) {
    figma.closePlugin('Error at [' + stage + ']: ' + e.message);
  }
};
