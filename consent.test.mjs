import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('analytics fails closed, loads once on consent and disables on revocation',()=>{
 const events={},scripts=[];
 const ctx={window:{},URL,location:{origin:'https://ratalab.it',pathname:'/'},document:{referrer:'https://ratalab.it/?importo=99999',addEventListener:(n,cb)=>events[n]=cb,createElement:()=>({}),head:{append:s=>scripts.push(s)}}};
 vm.runInNewContext(readFileSync(new URL('./consent.js',import.meta.url),'utf8'),ctx);
 assert.equal(scripts.length,0);
 events.cookieyes_banner_load({detail:{categories:{analytics:false}}});assert.equal(scripts.length,0);
 events.cookieyes_consent_update({detail:{accepted:['analytics']}});assert.equal(scripts.length,1);
 events.cookieyes_consent_update({detail:{accepted:['analytics']}});assert.equal(scripts.length,1);
 const config=ctx.window.dataLayer.find(a=>a[0]==='config');assert.equal(config[2].page_referrer,'https://ratalab.it/');
 events.cookieyes_consent_update({detail:{accepted:[]}});assert.equal(ctx.window['ga-disable-G-C3XJEK0GNB'],true);
 const count=ctx.window.dataLayer.length;ctx.window.gtag('event','test');assert.equal(ctx.window.dataLayer.length,count);
});
