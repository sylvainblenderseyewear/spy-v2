// Colour group (sort_by.color) for each product, from its frame colour (spec.frame_color).
// Same 17 groups as Blenders. Reads a bulk product export (JSONL), writes a review CSV and the
// JSONL for a productUpdate bulk mutation. Changes nothing in the store by itself.
//
//   node scripts/colour-groups.mjs <export.jsonl> <out-dir> [--only-missing]
//
// Export lines look like {"id","title","status","productType","metafield":{"value"}}; add
// `group: metafield(namespace:"sort_by", key:"color") { value }` to the export for --only-missing.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const GROUPS = ['Black', 'Blue', 'Brown', 'Champagne', 'Clear', 'Gold', 'Green', 'Grey', 'Orange',
  'Pink', 'Purple', 'Rainbow', 'Red', 'Silver', 'Tortoise', 'White', 'Yellow'];

// The first colour word in the name wins ("Black Honey Tort" is Black); finishes are ignored
const WORDS = {
  Black: ['black', 'onyx', 'everblack', 'colorblack', 'coal'],
  White: ['white', 'everwhite', 'alabaster', 'whitewall'],
  Grey: ['gray', 'grey', 'gunmetal', 'smoke', 'granite'],
  Silver: ['silver'],
  Clear: ['crystal', 'clear'],
  Tortoise: ['tortoise', 'tort', 'honey', 'java'],
  Brown: ['brown', 'bronze', 'coffee', 'mahogany', 'sepia', 'sand', 'tan', 'khaki', 'beige'],
  Blue: ['blue', 'navy', 'teal', 'turquoise'],
  Green: ['green', 'olive', 'army', 'sage', 'mint', 'seaweed'],
  Red: ['red', 'redline', 'burgundy', 'burgandy', 'brick', 'crimson'],
  Pink: ['pink', 'peach', 'rose', 'blush', 'salmon'],
  Purple: ['purple', 'lilac', 'lavender', 'plum', 'violet'],
  Orange: ['orange', 'coral', 'creamsicle', 'persimmon'],
  Yellow: ['yellow', 'hivis', 'hi vis'],
  Gold: ['gold'],
  Champagne: ['champagne'],
  Rainbow: ['rainbow'],
};
// Prints only count when no colour word is there ("Checkers Red" stays Red)
const PRINTS = ['usa', 'tie-dye', 'psychedelic', 'splatter', 'trippy'];
const PLACEHOLDER = /^\s*(no colou?r reference|n\/a|-)?\s*$/i;

export function colourGroup(frameColour) {
  const name = String(frameColour || '');
  if (PLACEHOLDER.test(name)) return '';
  const text = ` ${name.toLowerCase().replace(/[^a-z0-9-]+/g, ' ')} `;
  let best = null;
  for (const [group, words] of Object.entries(WORDS)) {
    for (const word of words) {
      const at = text.indexOf(` ${word} `);
      if (at >= 0 && (!best || at < best.at || (at === best.at && word.length > best.length))) best = { at, length: word.length, group };
    }
  }
  if (best) return best.group;
  return PRINTS.some((word) => text.includes(` ${word} `)) ? 'Rainbow' : '';
}

const [input, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const onlyMissing = process.argv.includes('--only-missing');
if (input && outDir) {
  const products = readFileSync(input, 'utf8').trim().split('\n').map((line) => JSON.parse(line)).filter((p) => p.id?.includes('/Product/'));
  const csv = [['product_id', 'title', 'status', 'product_type', 'frame_color', 'color_group']];
  const lines = [];
  const counts = new Map();
  for (const p of products) {
    const frame = (p.metafield?.value || '').trim();
    const group = colourGroup(frame);
    csv.push([p.id, p.title, p.status, p.productType || '', frame, group]);
    counts.set(group || '(none)', (counts.get(group || '(none)') || 0) + 1);
    if (!group || (onlyMissing && p.group?.value)) continue;
    lines.push(JSON.stringify({ product: { id: p.id, metafields: [{ namespace: 'sort_by', key: 'color', type: 'single_line_text_field', value: group }] } }));
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'colour-groups.csv'), `${csv.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')}\n`);
  writeFileSync(join(outDir, 'colour-groups-bulk.jsonl'), `${lines.join('\n')}\n`);
  console.log(`${products.length} products · ${lines.length} to write`);
  console.log([...counts].sort((a, b) => b[1] - a[1]).map(([g, n]) => `${g} ${n}`).join(' | '));
}
