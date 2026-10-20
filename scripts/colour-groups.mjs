/**
 * Colour groups for the search page's Color filter.
 *
 * Every product gets one colour group in the metafield sort_by.color, picked from its frame
 * colour (spec.frame_color) by the first colour word in the name. The groups are Blenders' 17;
 * they are also the choices of the sort_by.color definition, so change both together.
 *
 * The script reads a product export and writes files. It never writes to the store.
 *
 *   node scripts/colour-groups.mjs <export.jsonl> <out-dir> [--overwrite]
 *   node scripts/colour-groups.mjs --self-test
 *
 * Export: run this bulk query in the Admin API and download its JSONL.
 *
 *   { products { edges { node { id title status productType
 *       frameColor: metafield(namespace: "spec", key: "frame_color") { value }
 *       colorGroup: metafield(namespace: "sort_by", key: "color") { value } } } } }
 *
 * Out:
 *   colour-groups.csv    one row per product: frame colour, the word that decided, the group in the
 *                        store, the group the rules give, and what this run does about it
 *   colour-groups.jsonl  metafieldsSet variables, one product per line, for the products to write:
 *                        mutation ($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { field message } } }
 *
 * Products that already have a group keep it (it may be a pick made by hand in the admin);
 * --overwrite writes every product whose group differs from the rules.
 *
 * Exit codes: 0 done, 1 wrong arguments or a failed self-test, 2 bad input.
 */
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const NAMESPACE = 'sort_by';
export const KEY = 'color';
export const TYPE = 'single_line_text_field';

/** The definition's choices, in the admin's order. */
export const GROUPS = Object.freeze(['Black', 'Blue', 'Brown', 'Champagne', 'Clear', 'Gold', 'Green', 'Grey', 'Orange',
  'Pink', 'Purple', 'Rainbow', 'Red', 'Silver', 'Tortoise', 'White', 'Yellow']);

/** Colour words per group, as they appear in SPY's frame colour names (lower case, no accents). */
const WORDS = Object.freeze({
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
});

/** Prints name no single colour; they only count when the name has no colour word ("Checkers Red" is Red). */
const PRINTS = Object.freeze(['usa', 'tie dye', 'psychedelic', 'splatter', 'trippy']);
const PRINT_GROUP = 'Rainbow';

/** Placeholders the data migration left in spec.frame_color. */
const PLACEHOLDER = /^(no colou?r reference|n\/a|-)?$/i;

const RULES = Object.freeze(Object.entries(WORDS).flatMap(([group, words]) => words.map((word) => Object.freeze({ word, group }))));

// Fail on load, not at write time, if a rule names a group the definition does not allow
for (const { word, group } of [...RULES, { word: PRINTS.join(', '), group: PRINT_GROUP }]) {
  if (!GROUPS.includes(group)) throw new Error(`colour-groups: "${word}" points at "${group}", which is not a choice of ${NAMESPACE}.${KEY}`);
}
const seen = new Map();
for (const { word, group } of RULES) {
  if (seen.has(word)) throw new Error(`colour-groups: "${word}" is in both ${seen.get(word)} and ${group}`);
  seen.set(word, group);
}

/** Lower case, no accents, any other sign a space, padded so that words match whole. */
function normalise(name) {
  const text = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return ` ${text} `;
}

/**
 * The colour group for a frame colour name, and the word that decided it.
 * The first colour word wins: "Black Honey Tort" is Black, "Honey Tort Black" is Tortoise.
 * A placeholder or a name without a colour word gives group "" (left for a pick by hand).
 *
 * @param {string} frameColour
 * @returns {{ group: string, word: string }}
 */
export function colourGroup(frameColour) {
  const name = String(frameColour ?? '').trim();
  if (PLACEHOLDER.test(name)) return { group: '', word: '' };
  const text = normalise(name);
  let best = null;
  for (const rule of RULES) {
    const at = text.indexOf(` ${rule.word} `);
    if (at < 0) continue;
    // Same start: the longer word ("redline" over "red")
    if (!best || at < best.at || (at === best.at && rule.word.length > best.word.length)) best = { at, ...rule };
  }
  if (best) return { group: best.group, word: best.word };
  const print = PRINTS.find((word) => text.includes(` ${word} `));
  return print ? { group: PRINT_GROUP, word: print } : { group: '', word: '' };
}

/** Products from a bulk export, with the line number of any line that is not JSON. */
function readExport(path) {
  const products = [];
  readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (!line.trim()) return;
      let row;
      try {
        row = JSON.parse(line);
      } catch (error) {
        throw new InputError(`${path}:${index + 1} is not JSON (${error.message})`);
      }
      if (String(row?.id).includes('/Product/')) products.push(row);
    });
  return products;
}

/**
 * One row per product, and the metafields to write.
 * Write: products without a group; with overwrite, every product whose group differs.
 */
export function plan(products, { overwrite = false } = {}) {
  const rows = [];
  const writes = [];
  for (const product of products) {
    // Exports made before the query above used the plain alias "metafield" for the frame colour
    const frameColour = String(product.frameColor?.value ?? product.metafield?.value ?? '').trim();
    const current = String(product.colorGroup?.value ?? '').trim();
    const { group, word } = colourGroup(frameColour);

    // fill: no group yet · change: differs, with --overwrite · keep: the store's group stays
    // (maybe a pick by hand) · pick by hand: no colour word and no group · in step: same group
    let action;
    if (!group) action = current ? 'keep' : 'pick by hand';
    else if (group === current) action = 'in step';
    else if (!current) action = 'fill';
    else action = overwrite ? 'change' : 'keep';

    rows.push({
      product_id: product.id,
      title: product.title ?? '',
      status: product.status ?? '',
      product_type: product.productType ?? '',
      frame_color: frameColour,
      matched_word: word,
      store_group: current,
      rule_group: group,
      action,
    });
    if (action === 'fill' || action === 'change') writes.push({ ownerId: product.id, namespace: NAMESPACE, key: KEY, type: TYPE, value: group });
  }
  return { rows, writes };
}

function toCsv(rows) {
  const columns = Object.keys(rows[0] ?? {});
  const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return `${[columns.map(cell).join(','), ...rows.map((row) => columns.map((column) => cell(row[column])).join(','))].join('\n')}\n`;
}

const tally = (values) => [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);

/** Names and the group they must give. Run with --self-test after changing the words. */
const EXAMPLES = Object.freeze([
  ['Matte Black', 'Black'],
  ['Black Honey Tort', 'Black'],
  ['Honey Tort Black', 'Tortoise'],
  ['Crystal Smoke Matte Dark Gunmetal', 'Clear'],
  ['Matte Colorblack 2.0 Dark Gray', 'Black'],
  ['Black-Gold', 'Black'],
  ['Black/Blue Horn', 'Black'],
  ['Café Brown', 'Brown'],
  ['Redline', 'Red'],
  ['Checkers Red', 'Red'],
  ['Checkers HiVis', 'Yellow'],
  ['Classic Camo Tort', 'Tortoise'],
  ['Matte Sand', 'Brown'],
  ['Coral', 'Orange'],
  ['Silver Clear Matte', 'Silver'],
  ['Matte USA', 'Rainbow'],
  ['Tie-Dye', 'Rainbow'],
  ['tie dye', 'Rainbow'],
  ['SEND NOODS', ''],
  ['No Colour Reference', ''],
  ['', ''],
]);

function selfTest() {
  const failures = EXAMPLES.map(([name, want]) => ({ name, want, got: colourGroup(name).group })).filter(({ want, got }) => want !== got);
  for (const { name, want, got } of failures) console.error(`  "${name}": want "${want}", got "${got}"`);
  console.log(`${EXAMPLES.length - failures.length}/${EXAMPLES.length} examples pass`);
  return failures.length ? 1 : 0;
}

class InputError extends Error {}

const USAGE = `Usage:
  node scripts/colour-groups.mjs <export.jsonl> <out-dir> [--overwrite]
  node scripts/colour-groups.mjs --self-test
The export query is at the top of the script.`;

function main(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const args = argv.filter((arg) => !arg.startsWith('--'));
  const unknownFlags = [...flags].filter((flag) => !['--overwrite', '--self-test', '--help'].includes(flag));
  if (flags.has('--help')) {
    console.log(USAGE);
    return 0;
  }
  if (flags.has('--self-test')) return selfTest();
  if (args.length !== 2 || unknownFlags.length) {
    if (unknownFlags.length) console.error(`Unknown option: ${unknownFlags.join(' ')}`);
    console.error(USAGE);
    return 1;
  }

  const [input, outDir] = args;
  const overwrite = flags.has('--overwrite');
  const products = readExport(input);
  if (!products.length) throw new InputError(`${input} has no products`);
  // Without the store's groups a run would overwrite picks made by hand
  if (!overwrite && !products.some((product) => 'colorGroup' in product)) {
    throw new InputError(`${input} has no colorGroup field, so groups picked by hand cannot be kept. Add it to the export query (top of this script) or pass --overwrite.`);
  }

  const { rows, writes } = plan(products, { overwrite });
  mkdirSync(outDir, { recursive: true });
  const csvPath = join(outDir, 'colour-groups.csv');
  const jsonlPath = join(outDir, 'colour-groups.jsonl');
  writeFileSync(csvPath, toCsv(rows));
  writeFileSync(jsonlPath, writes.map((metafield) => JSON.stringify({ metafields: [metafield] })).join('\n') + (writes.length ? '\n' : ''));

  const placeholders = rows.filter((row) => !row.rule_group && PLACEHOLDER.test(row.frame_color)).length;
  console.log(`${rows.length} products · rules give a group to ${rows.filter((row) => row.rule_group).length} · ${placeholders} placeholder frame colours`);
  console.log(`groups: ${tally(rows.map((row) => row.rule_group || '(none)')).map(([group, n]) => `${group} ${n}`).join(' | ')}`);
  console.log(`this run: ${tally(rows.map((row) => row.action)).map(([action, n]) => `${action} ${n}`).join(' · ')}`);
  console.log(`wrote ${csvPath} and ${jsonlPath} (${writes.length} to write)`);
  return 0;
}

// Run from the command line only, never on import
const isMain = (() => {
  try {
    return Boolean(process.argv[1]) && realpathSync.native(process.argv[1]) === realpathSync.native(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMain) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`colour-groups: ${error.message}`);
    process.exitCode = error instanceof InputError ? 2 : 1;
  }
}
