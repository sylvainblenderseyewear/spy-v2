// Starts `shopify theme dev` and retries when startup fails.
// Our link to Shopify drops some requests ("socket hang up",
// "The operation was aborted."), so a plain retry usually works.
const { spawn, spawnSync, execSync } = require('node:child_process');

const STORE = 'spydevsylv.myshopify.com';
const PORT = 9292;
const MAX_TRIES = 5;
const STARTUP_MS = 120000; // a crash after this is not a startup error
const RETRY_DELAY_MS = 3000;

let stopping = false;
let child = null;

// Free the port from an old dev server left open by a closed terminal.
function freePort() {
  if (process.platform !== 'win32') return;
  try {
    execSync(
      `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -EA SilentlyContinue | % { Stop-Process -Id $_.OwningProcess -Force }"`,
      { stdio: 'ignore' }
    );
  } catch {}
}

function run(attempt) {
  const started = Date.now();
  const cmd = ['shopify theme dev', `--store=${STORE}`, ...process.argv.slice(2)].join(' ');
  child = spawn(cmd, { stdio: 'inherit', shell: true });

  child.on('exit', (code) => {
    const early = Date.now() - started < STARTUP_MS;
    if (stopping || code === 0 || !early || attempt >= MAX_TRIES) {
      process.exit(code ?? 0);
    }
    console.log(`\n[dev-start] Startup failed (try ${attempt}/${MAX_TRIES}), retrying in ${RETRY_DELAY_MS / 1000}s...\n`);
    setTimeout(() => {
      freePort();
      run(attempt + 1);
    }, RETRY_DELAY_MS);
  });
}

// Ctrl+C reaches the child too; we just must not retry after it.
process.on('SIGINT', () => { stopping = true; });
process.on('SIGTERM', () => { stopping = true; child?.kill(); });

// Log in once before the retry loop. If login happens inside `theme dev`,
// each retry asks for a new code and the one you approved goes stale.
function ensureLogin() {
  const res = spawnSync(`shopify theme list --store=${STORE} --role=live`, { stdio: 'inherit', shell: true });
  if (res.status !== 0) {
    console.log('\n[dev-start] Shopify login failed. Run `npm start` again and approve the new code.\n');
    process.exit(res.status ?? 1);
  }
}

ensureLogin();
freePort();
run(1);
