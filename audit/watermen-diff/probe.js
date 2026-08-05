const { chromium } = require('playwright-core');
const EXE='C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const SEL=process.argv[2];
(async()=>{const b=await chromium.launch({executablePath:EXE});
const p=await b.newPage({viewport:{width:parseInt(process.argv[3]||'1440'),height:1200}});
await p.goto('http://127.0.0.1:9292/pages/watermen',{waitUntil:'load',timeout:60000});
await p.waitForTimeout(4500);
console.log(await p.evaluate((sel)=>{
  const root=document.querySelector(sel);
  if(!root) return 'not found';
  const out=[];const rec=(el,d)=>{[...el.children].forEach(c=>{const r=c.getBoundingClientRect();const cs=getComputedStyle(c);
    if(cs.display==='none') return;
    out.push('  '.repeat(d)+`${c.tagName}.${(c.className||'').toString().replace(/\s+/g,' ').slice(0,46)} w${r.width.toFixed(1)} h${r.height.toFixed(1)} x${r.left.toFixed(1)} y${(r.top+ (document.querySelector('.page-wrapper')?.scrollTop||0)).toFixed(0)} pad[${cs.padding}] mar[${cs.margin}] ${cs.fontSize}/${cs.fontWeight}/${cs.lineHeight} ${cs.display} maxw${cs.maxWidth}`);
    if(d<6)rec(c,d+1);});};
  const r=root.getBoundingClientRect();const cs=getComputedStyle(root);
  out.unshift(`ROOT ${root.tagName}.${(root.className||'').toString().slice(0,40)} w${r.width.toFixed(1)} h${r.height.toFixed(1)} x${r.left.toFixed(1)} pad[${cs.padding}] mar[${cs.margin}] maxw${cs.maxWidth}`);
  rec(root,0);return out.join('\n');},SEL));
await b.close();})();
