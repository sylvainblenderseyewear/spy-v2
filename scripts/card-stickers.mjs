/**
 * Card stickers: the badge:: tags that put the legacy site's stickers on our product cards.
 *
 * spyoptic.com prints up to three stickers on a product tile, picked per colourway (frame + lens).
 * Our cards read the same stickers from product tags, one tag per sticker (the badge:: tags from
 * 6bf9413). This script works out those tags for every product.
 *
 * The script reads a product export and the legacy crawl and writes files. It never writes to the store.
 *
 *   node scripts/card-stickers.mjs <export.jsonl> <colourways.json> <out-dir>
 *   node scripts/card-stickers.mjs --self-test
 *
 * Export: run this bulk query in the Admin API and download its JSONL.
 *
 *   { products { edges { node { id title status productType tags options { name }
 *       variants { edges { node { id position title availableForSale selectedOptions { name value } } } } } } } }
 *
 * Legacy crawl: audit/legacy-stickers/colourways.json, every colourway the legacy PLPs list.
 *
 * A product stands for the colourway its card shows: the first variant in stock (Shopify's
 * selected_or_first_available_variant), so the stickers always match the photo. First match wins:
 *   1. legacy colourway  the legacy site lists this frame + lens: copy its stickers
 *   2. legacy frame      same frame, other lens: the frame's model stickers, lens stickers by rule
 *   3. legacy model      stickers every legacy colourway of the model has, lens stickers by rule
 *   4. not on legacy     lens stickers by rule, Mips on a "... MIPS" helmet (every legacy helmet has it)
 * Lens rule, same as the legacy site on 258 of 259 colourways: "Happy Boost" in the lens name gives
 * Happy Boost (not for a model the legacy site never gives it, like Megalith), "Murdered Out" gives
 * Cat. 4 + not for driving.
 *
 * Out:
 *   card-stickers.csv    one row per product: model, frame, shown lens, how it was decided, tags
 *   card-stickers.jsonl  tagsAdd variables, one product per line, for the products missing a tag:
 *                        mutation ($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { field message } } }
 *
 * It only adds tags. A badge:: tag the rules don't give stays (it may be a pick by hand) and the
 * CSV lists it as "extra".
 *
 * Exit codes: 0 done, 1 wrong arguments or a failed self-test, 2 bad input.
 */
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Legacy sticker art and its tag, in the legacy slot order. */
export const STICKERS = Object.freeze([
  { file: 'spy-bonuslens-2.png', tag: 'badge::bonus-lens' },
  { file: 'spy-deadbolt.png', tag: 'badge::deadbolt' },
  { file: 'pictohappyboost.png', tag: 'badge::happy-boost' },
  { file: 'ANSI_SVG_Z87_V1.svg', tag: 'badge::ansi-z87' },
  { file: 'ANSI_SVG_NEW_V4.svg', tag: 'badge::ansi-z87-2-plus' },
  { file: '26-SPY-Digital-PDP-Icon-MurdrdOut-CAT4.svg', tag: 'badge::cat-4' },
  { file: '26-SPY-Digital-PDP-Icon-MurdrdOut-WARNING.svg', tag: 'badge::not-for-driving' },
  { file: 'mipslogo.png', tag: 'badge::mips' },
]);
const TAG_OF = new Map(STICKERS.map(({ file, tag }) => [file, tag]));
const ORDER = STICKERS.map(({ tag }) => tag);

/** Stickers that follow the lens; the rest belong to the frame or the model. */
const LENS_TAGS = Object.freeze(['badge::happy-boost', 'badge::cat-4', 'badge::not-for-driving']);

/** Lower case, no accents or signs, "grey" as "gray", no "with": legacy and Shopify spell names a bit differently. */
export function normalise(text) {
  return String(text ?? '')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\bw\//g, ' with ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bgrey\b/g, 'gray')
    .replace(/\bpolarized\b/g, 'polar')
    .replace(/\bwith\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "No Colour Reference" is how the legacy site names a lens-only product's frame. */
const frameKey = (frame) => {
  const key = normalise(frame);
  return key === 'no colour reference' || key === 'no color reference' ? '' : key;
};

/** Legacy colourways read "Frame-Lens"; the first hyphen with no space around it splits them. */
export function splitColourway(colourway) {
  const match = String(colourway ?? '').match(/^(.*?\S)-(\S.*)$/);
  return match ? { frame: match[1].trim(), lens: match[2].trim() } : { frame: String(colourway ?? '').trim(), lens: '' };
}

/** Lens stickers from the lens name. */
export function lensTags(lens) {
  const text = ` ${normalise(lens)} `;
  const tags = [];
  if (text.includes(' happy boost ')) tags.push('badge::happy-boost');
  if (text.includes(' murdered out ')) tags.push('badge::cat-4', 'badge::not-for-driving');
  return tags;
}

const sortTags = (tags) => [...new Set(tags)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

/** Legacy colourways grouped by model, with their stickers as tags. */
export function legacyIndex(colourways) {
  const byModel = new Map();
  for (const entry of colourways) {
    const tags = entry.stickers.map((file) => {
      if (!TAG_OF.has(file)) throw new InputError(`unknown legacy sticker "${file}" on ${entry.model} ${entry.colourway}`);
      return TAG_OF.get(file);
    });
    const { frame, lens } = splitColourway(entry.colourway);
    const model = normalise(entry.model);
    if (!byModel.has(model)) byModel.set(model, []);
    byModel.get(model).push({ colourway: entry.colourway, frame: frameKey(frame), lens: normalise(lens), tags });
  }
  return byModel;
}

/** Tags every given colourway has. */
const common = (entries) => (entries.length ? entries.map((e) => e.tags).reduce((a, b) => a.filter((t) => b.includes(t))) : []);

/** The variant a card shows: first in stock, else the first one. */
export function shownVariant(variants) {
  const sorted = [...variants].sort((a, b) => a.position - b.position);
  return sorted.find((v) => v.availableForSale) ?? sorted[0] ?? null;
}

const lensOf = (variant) => variant?.selectedOptions?.find((o) => o.name === 'Lens')?.value ?? '';

/** Model from the collection:: tag, frame from the title once the model name is cut off. */
export function modelAndFrame(product) {
  const tag = (product.tags ?? []).find((t) => /^collection::/i.test(t));
  const model = tag ? tag.replace(/^collection::/i, '').trim() : '';
  const words = normalise(product.title).split(' ');
  const modelWords = normalise(model).split(' ').filter(Boolean);
  const startsWithModel = modelWords.length && modelWords.every((word, i) => words[i] === word);
  const frame = startsWithModel ? words.slice(modelWords.length).join(' ') : normalise(product.title);
  return { model, frame: frameKey(frame) };
}

/** The badge:: tags one product should carry, and why. */
export function decide(product, legacy) {
  const { model, frame } = modelAndFrame(product);
  const variant = shownVariant(product.variants ?? []);
  const lens = lensOf(variant);
  const lensKey = normalise(lens);
  // Colour-only placeholders have no Lens option and carry the lens in the title: "Model Frame Lens"
  const hasLens = (product.variants ?? []).some((v) => v.selectedOptions?.some((o) => o.name === 'Lens'));
  const lensText = hasLens ? lens : frame;
  const entries = legacy.get(normalise(model));

  let basis;
  let legacyColourway = '';
  let tags;
  if (!entries) {
    basis = 'not on legacy';
    tags = lensTags(lensText);
    // Every helmet on the legacy site is a "... MIPS" model and carries the Mips sticker
    if (` ${normalise(model)} `.includes(' mips ')) tags.push('badge::mips');
  } else {
    const exact = hasLens
      ? entries.find((e) => e.frame === frame && e.lens === lensKey)
      : entries.find((e) => [e.frame, e.lens].filter(Boolean).join(' ') === frame);
    if (exact) {
      basis = 'legacy colourway';
      legacyColourway = exact.colourway;
      tags = [...exact.tags];
    } else {
      const sameFrame = entries.filter((e) => e.frame === frame);
      basis = sameFrame.length ? 'legacy frame' : 'legacy model';
      const modelTags = common(sameFrame.length ? sameFrame : entries).filter((t) => !LENS_TAGS.includes(t));
      // Some models (Megalith) have Happy Boost lenses but never the sticker on the legacy site
      const hbLenses = entries.filter((e) => ` ${e.lens} `.includes(' happy boost '));
      const hbNeverShown = hbLenses.length > 0 && hbLenses.every((e) => !e.tags.includes('badge::happy-boost'));
      tags = [...modelTags, ...lensTags(lensText).filter((t) => !(hbNeverShown && t === 'badge::happy-boost'))];
    }
  }

  // Worth knowing on review: another lens of the same product would get other lens stickers
  const shown = lensTags(lens).join(' ');
  const others = (product.variants ?? [])
    .filter((v) => v !== variant && lensTags(lensOf(v)).join(' ') !== shown)
    .map((v) => `${v.position}:${lensTags(lensOf(v)).map((t) => t.replace('badge::', '')).join('+') || 'none'}`);

  return {
    model,
    frame,
    lens,
    variantPosition: variant?.position ?? '',
    basis,
    legacyColourway,
    tags: sortTags(tags),
    note: others.length ? `other lenses differ (${[...new Set(others)].join(', ')})` : '',
  };
}

/** Products with their variants from a bulk export (children follow their parent, keyed by __parentId). */
function readExport(path) {
  const products = new Map();
  const variants = [];
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
      if (String(row?.id).includes('/ProductVariant/')) variants.push(row);
      else if (String(row?.id).includes('/Product/')) products.set(row.id, { ...row, variants: [] });
    });
  for (const variant of variants) products.get(variant.__parentId)?.variants.push(variant);
  return [...products.values()];
}

/** One row per product, and the tags to add. */
export function plan(products, legacy) {
  const rows = [];
  const writes = [];
  for (const product of products) {
    const decision = decide(product, legacy);
    const now = (product.tags ?? []).filter((t) => /^badge::/i.test(t)).map((t) => t.toLowerCase().trim());
    const toAdd = decision.tags.filter((t) => !now.includes(t));
    const extra = now.filter((t) => !decision.tags.includes(t));
    rows.push({
      product_id: product.id,
      title: product.title ?? '',
      status: product.status ?? '',
      product_type: product.productType ?? '',
      model: decision.model,
      frame: decision.frame,
      shown_lens: decision.lens,
      shown_variant: decision.variantPosition,
      basis: decision.basis,
      legacy_colourway: decision.legacyColourway,
      tags_wanted: decision.tags.join(' '),
      tags_now: now.join(' '),
      to_add: toAdd.join(' '),
      extra: extra.join(' '),
      note: decision.note,
    });
    if (toAdd.length) writes.push({ id: product.id, tags: toAdd });
  }
  return { rows, writes };
}

function toCsv(rows) {
  const columns = Object.keys(rows[0] ?? {});
  const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return `${[columns.map(cell).join(','), ...rows.map((row) => columns.map((column) => cell(row[column])).join(','))].join('\n')}\n`;
}

const tally = (values) => [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1]);

/** Small legacy set and products with the tags they must get. Run with --self-test after changing a rule. */
function selfTest() {
  const legacy = legacyIndex([
    { model: 'REBAR ANSI', colourway: 'Matte Black-Happy Boost Polar with Black Mirror', stickers: ['pictohappyboost.png', 'ANSI_SVG_NEW_V4.svg'] },
    { model: 'REBAR ANSI', colourway: 'Sand Matte-Happy Gray', stickers: ['ANSI_SVG_NEW_V4.svg'] },
    { model: 'MAINLINE ANSI', colourway: 'ANSI RX Matte Gray-Happy Boost Polar with Ice Blue Mirror', stickers: ['ANSI_SVG_Z87_V1.svg'] },
    { model: 'BOWERY', colourway: 'Black II-Happy Gray Polar', stickers: ['26-SPY-Digital-PDP-Icon-MurdrdOut-CAT4.svg', '26-SPY-Digital-PDP-Icon-MurdrdOut-WARNING.svg'] },
    { model: 'MARAUDER', colourway: 'EVERBLACK-Happy Bronze & Happy LL Persimmon', stickers: ['spy-bonuslens-2.png', 'spy-deadbolt.png'] },
    { model: 'REPLACEMENT LENS MARAUDER', colourway: 'No Colour Reference-Happy Boost LL Coral', stickers: ['pictohappyboost.png'] },
    { model: 'MEGALITH', colourway: 'Black Metal-Happy Boost Bronze with Black Mirror & Happy LL Yellow', stickers: [] },
  ]);
  // A lens of null means the product has no Lens option; soldOut lists positions out of stock
  const product = (title, model, lenses, soldOut = []) => ({
    id: title,
    title,
    tags: [`collection::${model}`],
    variants: lenses.map((lens, i) => ({
      position: i + 1,
      availableForSale: !soldOut.includes(i + 1),
      selectedOptions: lens == null ? [] : [{ name: 'Lens', value: lens }],
    })),
  });
  const cases = [
    // exact legacy colourway, spelt a little differently
    [product('Rebar ANSI Matte Black', 'REBAR ANSI', ['Happy Boost Polar w/ Black Mirror']), 'badge::happy-boost badge::ansi-z87-2-plus'],
    // legacy has no Happy Boost on this lens; copy the legacy, not the rule
    [product('Mainline ANSI ANSI RX Matte Gray', 'MAINLINE ANSI', ['Happy Boost Polar with Ice Blue Mirror']), 'badge::ansi-z87'],
    // frame not listed: model stickers + lens rule
    [product('Rebar ANSI Matte Olive', 'REBAR ANSI', ['Happy Boost Polar']), 'badge::happy-boost badge::ansi-z87-2-plus'],
    // first lens sold out: the card shows the second one
    [product('Rebar ANSI Sand Matte', 'REBAR ANSI', ['Happy Boost Polar', 'Happy Gray'], [1]), 'badge::ansi-z87-2-plus'],
    // lens-only product: "No Colour Reference" frame
    [product('Replacement Lens Marauder', 'REPLACEMENT LENS MARAUDER', ['Happy Boost LL Coral']), 'badge::happy-boost'],
    // goggle with no lens option: model stickers only
    [product('Marauder Trippy Threads', 'MARAUDER', [null]), 'badge::bonus-lens badge::deadbolt'],
    // no lens option, lens in the title: the legacy colourway still matches
    [product('Replacement Lens Marauder Happy Boost LL Coral', 'REPLACEMENT LENS MARAUDER', [null]), 'badge::happy-boost'],
    [product('Rebar ANSI Matte Black Happy Boost Polar with Black Mirror', 'REBAR ANSI', [null]), 'badge::happy-boost badge::ansi-z87-2-plus'],
    // not on legacy
    [product('Bowery Gloss Black', 'BOWERY 2', ['Happy Gray Polar Murdered Out Black']), 'badge::cat-4 badge::not-for-driving'],
    [product('Astronomic MIPS Black', 'ASTRONOMIC MIPS', [null]), 'badge::mips'],
    [product('Montana Black', 'MONTANA', ['Happy Gray']), ''],
    // the legacy site never puts Happy Boost on a Megalith, so the lens rule stays off
    [product('Megalith EVERBLACK Happy Boost LL Coral', 'MEGALITH', [null]), ''],
  ];
  const failures = cases
    .map(([p, want]) => ({ title: p.title, want, got: decide(p, legacy).tags.join(' ') }))
    .filter(({ want, got }) => want !== got);
  const checks = [
    [splitColourway('ANSI RX Matte Gray-Happy Boost Polar').frame, 'ANSI RX Matte Gray'],
    [splitColourway('Black/Honey Tort-Happy Dark Brown Fade').lens, 'Happy Dark Brown Fade'],
    [normalise('Happy  Grey Green Polarized'), 'happy gray green polar'],
    [lensTags('Happy Boost Ice Blue Mirror + HB LL Coral').join(' '), 'badge::happy-boost'],
  ].filter(([got, want]) => got !== want);
  for (const { title, want, got } of failures) console.error(`  "${title}": want "${want}", got "${got}"`);
  for (const [got, want] of checks) console.error(`  want "${want}", got "${got}"`);
  const total = cases.length + 4;
  console.log(`${total - failures.length - checks.length}/${total} examples pass`);
  return failures.length || checks.length ? 1 : 0;
}

class InputError extends Error {}

const USAGE = `Usage:
  node scripts/card-stickers.mjs <export.jsonl> <colourways.json> <out-dir>
  node scripts/card-stickers.mjs --self-test
The export query is at the top of the script.`;

function main(argv) {
  const flags = new Set(argv.filter((arg) => arg.startsWith('--')));
  const args = argv.filter((arg) => !arg.startsWith('--'));
  const unknownFlags = [...flags].filter((flag) => !['--self-test', '--help'].includes(flag));
  if (flags.has('--help')) {
    console.log(USAGE);
    return 0;
  }
  if (flags.has('--self-test')) return selfTest();
  if (args.length !== 3 || unknownFlags.length) {
    if (unknownFlags.length) console.error(`Unknown option: ${unknownFlags.join(' ')}`);
    console.error(USAGE);
    return 1;
  }

  const [input, legacyPath, outDir] = args;
  const products = readExport(input);
  if (!products.length) throw new InputError(`${input} has no products`);
  if (!products.some((p) => p.variants.length)) throw new InputError(`${input} has no variants; use the export query at the top of this script`);
  const legacy = legacyIndex(JSON.parse(readFileSync(legacyPath, 'utf8')).colourways ?? []);

  const { rows, writes } = plan(products, legacy);
  mkdirSync(outDir, { recursive: true });
  const csvPath = join(outDir, 'card-stickers.csv');
  const jsonlPath = join(outDir, 'card-stickers.jsonl');
  writeFileSync(csvPath, toCsv(rows));
  writeFileSync(jsonlPath, writes.map((write) => JSON.stringify(write)).join('\n') + (writes.length ? '\n' : ''));

  const tagged = rows.filter((row) => row.tags_wanted);
  console.log(`${rows.length} products · ${tagged.length} get stickers · ${writes.length} need a tag added`);
  console.log(`basis: ${tally(tagged.map((row) => row.basis)).map(([basis, n]) => `${basis} ${n}`).join(' · ')}`);
  console.log(`tags: ${tally(tagged.flatMap((row) => row.tags_wanted.split(' '))).map(([tag, n]) => `${tag.replace('badge::', '')} ${n}`).join(' · ')}`);
  console.log(`wrote ${csvPath} and ${jsonlPath}`);
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
    console.error(`card-stickers: ${error.message}`);
    process.exitCode = error instanceof InputError ? 2 : 1;
  }
}
