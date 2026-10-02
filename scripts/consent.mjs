/*
  Consent test for the GA4 pixel.

  Checks the four paths the opt-in rewrite has to get right:
    A  no click      -> nothing leaves the browser, ever
    B  Accept        -> queued hits replay, consent reads granted
    C  Decline       -> nothing leaves the browser
    D  returning     -> a saved choice is honoured without asking again

  Run:  SPY_PASSWORD=xxxx node scripts/consent.mjs
        HEADED=1 to watch it
*/
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

// .env is gitignored — put SPY_PASSWORD there and it stays out of the shell history
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  // no .env, fall back to the real environment
}

const STORE = process.env.SPY_STORE || 'https://spyoptic-com.myshopify.com';
const PASSWORD = process.env.SPY_PASSWORD || '';
const HEADED = process.env.HEADED === '1';

const TAGGING = 'sgtm.spyoptic.com';
const GTAG_LIB = 'googletagmanager.com/gtag/js';

// Pandectes renders late, so give it room
const BANNER = 2500;

function watch(page, hits) {
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes(TAGGING)) hits.collect.push(u);
    else if (u.includes(GTAG_LIB)) hits.lib.push(u);
  });
}

function gcs(url) {
  try {
    return new URL(url).searchParams.get('gcs') || '?';
  } catch {
    return '?';
  }
}

function eventName(url) {
  try {
    return new URL(url).searchParams.get('en') || '(config)';
  } catch {
    return '?';
  }
}

// The store is still password protected before launch
async function unlock(page) {
  if (!page.url().includes('/password')) return;
  if (!PASSWORD) throw new Error('store is locked — set SPY_PASSWORD');
  await page.fill('input[type="password"]', PASSWORD);
  await page.press('input[type="password"]', 'Enter');
  await page.waitForLoadState('domcontentloaded');
}

// Button labels vary by Pandectes version, so try a few
async function clickBanner(page, which) {
  const names = which === 'accept' ? [/^accept/i, /allow/i] : [/^decline/i, /^reject/i, /deny/i];
  for (const name of names) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      return true;
    }
  }
  return false;
}

async function consentState(page) {
  return page
    .evaluate(() => window.Shopify?.customerPrivacy?.currentVisitorConsent?.() ?? null)
    .catch(() => null);
}

async function browse(page, paths) {
  for (const p of paths) {
    // the store loads slowly, 30s is not enough
    await page.goto(STORE + p, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await unlock(page);
    await page.waitForTimeout(BANNER);
  }
}

function report(label, hits, expectation) {
  const names = hits.collect.map(eventName);
  const codes = [...new Set(hits.collect.map(gcs))];
  const pass = expectation(hits);
  console.log(`\n${pass ? 'PASS' : 'FAIL'}  ${label}`);
  console.log(`      collect: ${hits.collect.length}   gtag.js: ${hits.lib.length}`);
  if (names.length) console.log(`      events:  ${names.join(' ')}`);
  if (codes.length) console.log(`      gcs:     ${codes.join(' ')}`);
  return pass;
}

async function run() {
  const browser = await chromium.launch({ channel: 'chrome', headless: !HEADED });
  const results = [];

  // A — browse without touching the banner
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const hits = { collect: [], lib: [] };
    watch(page, hits);
    await browse(page, ['/', '/collections/sunglasses']);
    console.log('\nA  consent state:', JSON.stringify(await consentState(page)));
    results.push(report('A  no click — expect 0 collect, 0 gtag.js', hits, (h) => h.collect.length === 0 && h.lib.length === 0));
    await ctx.close();
  }

  // B — browse one page first, then Accept, and C — Decline
  for (const choice of ['accept', 'decline']) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const hits = { collect: [], lib: [] };
    watch(page, hits);

    await browse(page, ['/']);
    const before = hits.collect.length;

    const clicked = await clickBanner(page, choice);
    if (!clicked) console.log(`\n!  ${choice}: no banner button found — check the selectors`);
    await page.waitForTimeout(BANNER);
    await browse(page, ['/collections/sunglasses']);

    console.log(`\n${choice === 'accept' ? 'B' : 'C'}  consent state:`, JSON.stringify(await consentState(page)));
    console.log(`      before the click: ${before} collect`);

    if (choice === 'accept') {
      results.push(
        report('B  Accept — expect a replayed burst, gcs G111', hits, (h) => before === 0 && h.collect.length > 0 && h.collect.every((u) => gcs(u) === 'G111'))
      );

      // D — a second tab in the same session, choice already saved
      const tab = await ctx.newPage();
      const back = { collect: [], lib: [] };
      watch(tab, back);
      await browse(tab, ['/']);
      results.push(report('D  returning visitor — expect tracking with no second click', back, (h) => h.collect.length > 0));
      await tab.close();
    } else {
      results.push(report('C  Decline — expect 0 collect', hits, (h) => h.collect.length === 0));
    }

    await ctx.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

run().catch((e) => {
  console.error('\n' + e.message);
  process.exit(1);
});
