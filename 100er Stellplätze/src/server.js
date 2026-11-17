import http from 'node:http';
import {Pool} from 'pg';
import {readFile} from 'node:fs/promises';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {validateSnapshot} from './validation.js';
const {DATABASE_URL,TEST_ACCESS_PASSWORD}=process.env;
if(!DATABASE_URL||!TEST_ACCESS_PASSWORD||TEST_ACCESS_PASSWORD.length<32){console.error('DATABASE_URL and 32+ character TEST_ACCESS_PASSWORD required');process.exit(1);}
const pool=new Pool({connectionString:DATABASE_URL,max:5,connectionTimeoutMillis:10000});
await pool.query(await readFile(new URL('../sql/001_init.sql',import.meta.url),'utf8'));
const html=await readFile(new URL('../public/index.html',import.meta.url));
const sessions=new Map();
const ttl=8*60*60*1000;
function json(res,status,body,extra={}){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra});res.end(JSON.stringify(body));}
function page(res,status,body){res.writeHead(status,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"frame-ancestors 'none'"});res.end(body);}
function cookies(req){return Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=').map(decodeURIComponent)).filter(x=>x.length===2));}
function authorized(req){const id=cookies(req).paletten_test_session;const expiry=id&&sessions.get(id);if(!expiry||expiry<Date.now()){if(id)sessions.delete(id);return false;}return true;}
function samePassword(input){const a=createHash('sha256').update(String(input)).digest(),b=createHash('sha256').update(TEST_ACCESS_PASSWORD).digest();return timingSafeEqual(a,b);}
function safeOrigin(req){const origin=req.headers.origin;return !origin||origin===`https://${req.headers.host}`||origin===`http://localhost:${process.env.PORT||10000}`;}
const loginHtml=`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Paletten TEST Anmeldung</title><body style="font:16px Segoe UI,Arial;max-width:440px;margin:10vh auto;padding:20px"><h2>Paletten-Dashboard – TEST</h2><p>Nur Testdaten. Nicht für den Lagerbetrieb freigegeben.</p><form method="POST" action="/login"><label>Testzugangspasswort<input type="password" name="password" autocomplete="current-password" required style="display:block;width:100%;padding:12px;margin:12px 0"></label><button style="padding:12px">Anmelden</button></form></body></html>`;
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://${req.headers.host}`);
  if(url.pathname==='/health'&&req.method==='GET'){try{await pool.query('SELECT 1');return json(res,200,{status:'ok',database:'connected'});}catch{return json(res,503,{status:'unavailable'});}}
  if(url.pathname==='/login'&&req.method==='GET')return page(res,200,loginHtml);
  if(url.pathname==='/login'&&req.method==='POST'){
   if(!safeOrigin(req))return json(res,403,{error:'Origin mismatch'});
   let raw='';for await(const c of req){raw+=c;if(raw.length>2048)return json(res,413,{error:'Too large'});}
   const pass=new URLSearchParams(raw).get('password')||'';
   if(!samePassword(pass))return page(res,401,loginHtml.replace('</form>','<p style="color:red">Ungültiges Passwort</p></form>'));
   const session=randomBytes(32).toString('hex');sessions.set(session,Date.now()+ttl);
   res.writeHead(303,{location:'/', 'set-cookie':`paletten_test_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`});return res.end();
  }
  if(url.pathname==='/logout'&&req.method==='POST'){
   if(!safeOrigin(req))return json(res,403,{error:'Origin mismatch'});
   sessions.delete(cookies(req).paletten_test_session);res.writeHead(303,{location:'/login','set-cookie':'paletten_test_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'});return res.end();
  }
  if(!authorized(req)){if(url.pathname==='/api/state')return json(res,401,{error:'Unauthorized'});res.writeHead(303,{location:'/login'});return res.end();}
  if(url.pathname==='/'&&req.method==='GET')return page(res,200,html);
  if(url.pathname!=='/api/state'||!['GET','PUT'].includes(req.method))return json(res,404,{error:'Not found'});
  if(req.method==='GET'){
   const {rows}=await pool.query('SELECT revision,payload FROM dashboard_state WHERE id=1');
   return json(res,200,{revision:Number(rows[0].revision),state:rows[0].payload});
  }
  if(!safeOrigin(req)||req.headers['x-requested-with']!=='PalettenTest')return json(res,403,{error:'CSRF check failed'});
  let raw='';for await(const c of req){raw+=c;if(Buffer.byteLength(raw)>2_000_000)return json(res,413,{error:'Too large'});}
  let input;try{input=JSON.parse(raw)}catch{return json(res,400,{error:'Invalid JSON'});}
  const error=validateSnapshot(input);if(error)return json(res,400,{error});
  const result=await pool.query('UPDATE dashboard_state SET payload=$1::jsonb,revision=revision+1,updated_at=now() WHERE id=1 AND revision=$2 RETURNING revision',[JSON.stringify(input.state),input.revision]);
  if(!result.rowCount)return json(res,409,{error:'Revision conflict; reload and verify'});
  return json(res,200,{revision:Number(result.rows[0].revision)});
 }catch(error){console.error('Request failed:',error.message);return json(res,500,{error:'Server error'});}
});
const port=Number(process.env.PORT||10000);server.listen(port,'0.0.0.0',()=>console.log('Paletten TEST backend listening on '+port));
process.on('SIGTERM',()=>server.close(()=>pool.end()));
