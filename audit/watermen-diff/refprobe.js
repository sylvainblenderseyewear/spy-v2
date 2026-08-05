const { chromium } = require('playwright-core');
const EXE='C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const SEL=process.argv[2];
(async()=>{const b=await chromium.launch({executablePath:EXE});
const p=await b.newPage({viewport:{width:parseInt(process.argv[3]||'1440'),height:1200}});
await p.goto('http://127.0.0.1:8899/waterman/Watermen%20Collection.html',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(3500);
console.log(await p.evaluate((sel)=>{
  const root=document.querySelector(sel);
  if(!root) return 'not found';
  const out=[];const rec=(el,d)=>{[...el.children].forEach(c=>{const r=c.getBoundingClientRect();const cs=getComputedStyle(c);
    if(cs.display==='none'||['SCRIPT','STYLE'].includes(c.tagName)) return;
    out.push('  '.repeat(d)+`${c.tagName}.${(c.className||'').toString().replace(/\s+/g,' ').slice(0,46)} w${r.width.toFixed(1)} h${r.height.toFixed(1)} x${r.left.toFixed(1)} y${(r.top+window.scrollY).toFixed(0)} pad[${cs.padding}] mar[${cs.margin}] ${cs.fontSize}/${cs.fontWeight}/${cs.lineHeight} ls${cs.letterSpacing} ${cs.textAlign} ${cs.display} c${cs.color} bg${cs.backgroundColor} :: ${(c.children.length?'':(c.innerText||'').replace(/\s+/g,' ').slice(0,34))}`);
    if(d<7)rec(c,d+1);});};
  const r=root.getBoundingClientRect();const cs=getComputedStyle(root);
  out.unshift(`ROOT ${root.tagName}.${(root.className||'').toString().slice(0,40)} w${r.width.toFixed(1)} h${r.height.toFixed(1)} x${r.left.toFixed(1)} pad[${cs.padding}] mar[${cs.margin}]`);
  rec(root,0);return out.join('\n');},SEL));
await b.close();})();
