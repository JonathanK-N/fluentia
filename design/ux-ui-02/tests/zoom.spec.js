/** Zoom navigateur réel, sans zoom CSS. Responsable : Jonathan Kakesa. */
import {test,expect,chromium} from '@playwright/test';
import {resolve} from 'node:path';
import {readFileSync,writeFileSync} from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const screens=JSON.parse(readFileSync(new URL('../catalogue.json',import.meta.url))).screens;
test('zoom réel Chromium à 200 % sur les 62 références',async({browserName},info)=>{
 test.skip(browserName!=='chromium','API de zoom d’extension propre à Chromium ; aucun succès revendiqué pour ce test sur Firefox/WebKit.');
 const extension=resolve('tests/fixtures/zoom');
 const context=await chromium.launchPersistentContext('',{channel:'chromium',headless:true,viewport:null,args:['--window-size=1440,1000',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
 try{const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const page=await context.newPage();await page.goto('http://127.0.0.1:4173/#P01');await expect(page.locator('h1')).toBeVisible();const initialWidth=await page.evaluate(()=>innerWidth);
  const zoom=await worker.evaluate(async()=>{const [tab]=await chrome.tabs.query({url:'http://127.0.0.1:4173/*'});await chrome.tabs.setZoom(tab.id,2);return chrome.tabs.getZoom(tab.id);});expect(zoom).toBe(2);await expect.poll(()=>page.evaluate(()=>innerWidth)).toBeLessThanOrEqual(Math.ceil(initialWidth/2)+1);
  for(const screen of screens){await page.goto('http://127.0.0.1:4173/#'+screen.id);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),screen.id).toBe(true);if(['P01','S01','S13'].includes(screen.id)){expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);await page.screenshot({path:info.outputPath(`${screen.id}-zoom-200.png`),fullPage:true});}}
  writeFileSync(info.outputPath('zoom.json'),JSON.stringify({zoom,initialWidth,zoomedWidth:await page.evaluate(()=>innerWidth),screensChecked:screens.length},null,2));
 }finally{await context.close();}
});
