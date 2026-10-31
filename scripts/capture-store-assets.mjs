// Instructional previews: actual status UI with simulated Chrome API responses.
// This is NOT an installed-extension browser test.
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), out=path.join(root,'store-assets');
await mkdir(out,{recursive:true});
const css=await readFile('extension/status.css','utf8');
const js=await readFile('extension/status.js','utf8');
const icon=(await readFile('extension/icons/icon-128.png')).toString('base64');
const vector=(await readFile('extension/icons/source.svg')).toString('base64');
const logo=`<img src="data:image/svg+xml;base64,${vector}">`;
const base=(await readFile('extension/status.html','utf8')).replace(/<footer>.*?<\/footer>/s, '').replaceAll('private windows', 'incognito windows');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
const shots=[
 ['01-open-extension','STEP 1 OF 4 / AFTER INSTALLING','Open the<br>extension.','<ol><li>Click the <strong>puzzle-piece Extensions icon</strong> in Chrome’s toolbar.</li><li>Select <strong>TopLock-Antincognito</strong>.</li><li>You’ll see <strong>Setup required</strong>, as shown here.</li></ol>','Can’t find the icon? Open Chrome’s ⋮ menu → Extensions → Manage Extensions.',false,false],
 ['02-open-settings','STEP 2 OF 4 / OPEN SETTINGS','Click “Open<br>extension<br>settings”.','<ol><li>In TopLock-Antincognito, click the <strong>highlighted button</strong>.</li><li>Chrome opens the extension’s <strong>Details</strong> page.</li></ol>','Alternative: type chrome://extensions in the address bar, find TopLock-Antincognito, and click Details.',false,false],
 ['03-allow-incognito','STEP 3 OF 4 / GIVE PERMISSION','Turn on “Allow<br>in incognito”.','<ol><li>On Chrome’s extension <strong>Details</strong> page, scroll to <strong>Allow in incognito</strong>.</li><li>Click its switch to turn it <strong>on</strong>.</li><li>Reopen TopLock-Antincognito from the Extensions menu.</li></ol>','Save work in any open incognito windows first. Enabling this setting will close them.',false,true],
 ['04-confirm-active','STEP 4 OF 4 / CONFIRM IT WORKS','Check for<br>“Automatic<br>closing is on”.','<ol><li>Reopen the extension and click <strong>Check status</strong>.</li><li>Look for the <strong>green confirmation</strong> shown here.</li><li>Try opening an incognito window. It should close automatically.</li></ol>','Normal browsing stays open. Incognito windows may briefly appear before closing.',true,false]
];
for(const [name,kicker,title,copy,note,active,expanded] of shots){
 const ui=base.replace('<link rel="stylesheet" href="status.css">',`<style>${css}</style>`).replace('<script src="status.js" defer></script>','').replace('src="icons/icon-48.png"',`src="data:image/png;base64,${icon}"`);
 const document=`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#dedccd;color:#25271f;font-family:Arial,sans-serif}.frame{height:800px;padding:40px 54px;display:grid;grid-template-columns:1fr 450px;gap:50px}.left{padding-top:3px}.brand{font:32px Georgia;letter-spacing:-2px}.brand small{display:block;font:8px Arial;letter-spacing:2px;margin-top:5px}.kicker{font-size:11px;letter-spacing:2px;border-top:1px solid #90947e;padding-top:24px;margin-top:44px}h1{font-size:55px;line-height:1.03;letter-spacing:-2.5px;margin:26px 0}.instructions{font-size:22px;line-height:1.5;max-width:575px}.instructions ol{padding-left:26px}.instructions li{padding-left:8px;margin-bottom:18px}p{font-size:21px;line-height:1.4;max-width:530px}.note{font-size:15px;border-left:3px solid #a94f34;padding-left:18px;margin-top:28px;max-width:480px}.preview{font-size:10px;letter-spacing:1px;color:#595e4f;margin-top:30px}.right{align-self:center;border:1px solid #989b85;box-shadow:12px 12px 0 #c8c7b6;background:#dedccd}.bar{padding:12px 18px;background:#595e4f;color:#f0eddd;font-size:10px;letter-spacing:1px;display:flex;justify-content:space-between}iframe{display:block;width:448px;height:666px;border:0;background:#dedccd}</style></head><body><div class="frame"><div class="left"><div class="brand">TopLock<small>TOOLS FOR INTENTION.</small></div><div class="kicker">${kicker}</div><h1>${title}</h1><div class="instructions">${copy}</div><p class="note">${note}</p><div class="preview">INSTRUCTIONAL PREVIEW · PERMISSION STATE SIMULATED</div></div><div class="right"><div class="bar"><span>TOPLOCK-ANTINCOGNITO</span><span>CHROME EXTENSION</span></div><iframe></iframe></div></div></body></html>`;
 await page.setContent(document);
 const frame=page.frames()[1];await frame.setContent(ui);
 await frame.evaluate((allowed)=>{window.chrome={runtime:{id:'instructional-preview',sendMessage:async()=>({allowed})},tabs:{create:async()=>{}}}},active);
 await frame.addStyleTag({content:"html { zoom: .85; } .actions span { font-family: DejaVu Sans, sans-serif; }"});
 await frame.addScriptTag({content:js});
 await frame.locator(`#status[data-state="${active?'active':'inactive'}"]`).waitFor();
 if(expanded){
  await page.locator('.right').evaluate(el=>el.innerHTML=`<div class="bar">CHROME DETAILS · SETTING ILLUSTRATION</div><div style="height:666px;padding:46px 28px;background:#f5f4ed;color:#25271f"><p style="font-size:13px;letter-spacing:1px">TOPLOCK-ANTINCOGNITO / DETAILS</p><h2 style="font-size:30px;margin:30px 0">Find this setting</h2><div style="border:3px solid #a94f34;padding:24px 18px;margin:40px 0;display:flex;align-items:center;gap:20px"><strong style="font-size:23px">Allow in incognito</strong><span style="display:inline-block;width:62px;height:34px;flex-shrink:0;border-radius:24px;background:#595e4f;padding:4px;text-align:right"><span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:white"></span></span></div><p style="font-size:25px"><strong>Switch it ON.</strong></p><p style="font-size:18px;line-height:1.6;margin-top:24px">This lets the extension detect and close incognito windows.</p><p style="font-size:13px;line-height:1.5;margin-top:55px;color:#626b62">Setting illustration, not a Chrome screenshot. The exact layout varies by Chrome version.</p></div>`);
 }

 if(name.startsWith('02'))await frame.locator('#open-settings').evaluate(el=>{el.style.outline='2px solid #a94f34';el.style.outlineOffset='7px'});
 if(name.startsWith('04'))await frame.locator('#status').evaluate(el=>{el.style.outline='3px solid #595e4f';el.style.outlineOffset='6px'});
 await page.screenshot({path:path.join(out,name+'.png')});
}
// Promo artwork is laid out in the browser at the exact store upload dimensions.
for(const [name,width,height] of [['small-promo',440,280],['marquee-promo',1400,560]]){
 const small=width===440;
 await page.setViewportSize({width,height});
 await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#dedccd;color:#25271f;font-family:Arial,sans-serif}.tile{height:${height}px;border:12px solid #25271f;padding:${small?'20px':'42px 54px'};position:relative;overflow:hidden}.brand{font-family:Georgia,serif;font-size:${small?'23px':'36px'};letter-spacing:-1px}.sub{font-size:${small?'9px':'13px'};letter-spacing:2px;margin-top:8px}h1{font-size:${small?'48px':'108px'};line-height:.91;letter-spacing:${small?'-3px':'-7px'};margin:${small?'23px 0 12px':'40px 0 24px'};position:relative;z-index:2}p{font-size:${small?'12px':'22px'};line-height:1.4;margin:0;max-width:${small?'270px':'740px'}}img{width:${small?'54px':'240px'};height:${small?'54px':'240px'};position:absolute;right:${small?'22px':'62px'};top:${small?'22px':'164px'}}.rule{position:absolute;bottom:${small?'18px':'34px'};left:${small?'20px':'54px'};right:${small?'20px':'54px'};border-top:1px solid #929781;padding-top:10px;font-size:${small?'8px':'11px'};letter-spacing:1.4px}</style></head><body><div class="tile"><div class="brand">TopLock</div><div class="sub">ANTINCOGNITO / CHROME EXTENSION</div>${logo}<h1>STAY FOCUSED.<br>STAY ON TASK.</h1><p>Automatically close incognito windows<br>after they open.</p><div class="rule">SMALL TOOLS. MORE INTENTION.</div></div></body></html>`);
 await page.screenshot({path:path.join(out,name+'.png')});
}
await browser.close();
await writeFile(path.join(out,'README.txt'),`TopLock-Antincognito store artwork\n\n01–04: 1280 x 800 instructional previews captured in Chromium.\nPanels 1, 2 and 4 use the actual extension HTML/CSS/JS with simulated Chrome runtime permission responses. Panel 3 is an explicitly labelled setting illustration.\nThe managed browser prohibits installing extensions and incognito mode. These are NOT evidence\nof a live installed extension, actual Chrome settings, or window blocking. Each preview is labelled.\nCapture genuine installed-state screenshots on an unrestricted browser before final submission.\n\nSmall promotional tile: 440 x 280 PNG.\nMarquee promotional tile: 1400 x 560 PNG.\nPromotional tiles are original typographic browser-rendered layouts, not browser screenshots.\n\nRegenerate: node scripts/capture-store-assets.mjs\n`);
console.log('Created four labelled previews and two promotional tiles in '+out);
