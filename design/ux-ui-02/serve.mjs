/** Serveur local de références, limité à 127.0.0.1. Responsable : Jonathan Kakesa. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,resolve,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);const target=resolve(root,'.'+(path==='/'?'/index.html':path));if(!target.startsWith(root+sep)){res.writeHead(403);res.end();return;}const body=await readFile(target);res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"});res.end(body);}catch{res.writeHead(404);res.end('Ressource indisponible');}}).listen(Number(process.env.DESIGN_PORT||4173),'127.0.0.1',()=>console.log('Références locales Fluentia : http://127.0.0.1:'+Number(process.env.DESIGN_PORT||4173)));
