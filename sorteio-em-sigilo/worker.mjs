const enc=new TextEncoder(),dec=new TextDecoder();
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
function json(status,data,extra={}){return new Response(JSON.stringify(data),{status,headers:{...headers,...extra}})}
class InputError extends Error{constructor(message,status=422){super(message);this.status=status}}
function field(v,max,required=false){if(typeof v!=='string')throw new InputError('Campo inválido.');v=v.trim();if(v.length>max||(required&&!v)||/[\u0000-\u001f\u007f]/.test(v))throw new InputError('Campo inválido ou muito longo.');return v}
function random(n){const a=new Uint32Array(1),lim=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=lim);return a[0]%n}
export function draw(n){if(!Number.isInteger(n)||n<2||n>100)throw new InputError('Informe de 2 a 100 participantes.');const p=Array.from({length:n},(_,i)=>i);do{for(let i=n-1;i>0;i--){const j=random(i+1);[p[i],p[j]]=[p[j],p[i]]}}while(p.some((v,i)=>v===i));return p}
function b64(a){return btoa(String.fromCharCode(...a)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function un64(s){if(!/^[A-Za-z0-9_-]+$/.test(s)||s.length%4===1)throw Error('Invalid token');const a=Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(s.length/4)*4,'=')),c=>c.charCodeAt(0));if(b64(a)!==s)throw Error('Invalid token');return a}
async function key(secret){if(typeof secret!=='string'||!/^[0-9a-f]{64}$/i.test(secret))throw new InputError('Servidor ainda não configurado.',503);return crypto.subtle.importKey('raw',Uint8Array.from(secret.match(/../g),x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt','decrypt'])}
const aad=enc.encode('sorteio-v2');
async function seal(data,k){const iv=crypto.getRandomValues(new Uint8Array(12)),c=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},k,enc.encode(JSON.stringify(data))));return 'v2.'+b64(new Uint8Array([...iv,...c]))}
async function openToken(t,k){let d;try{if(!t.startsWith('v2.'))throw Error();const a=un64(t.slice(3));if(a.length<29)throw Error();d=JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:a.slice(0,12),additionalData:aad},k,a.slice(12))))}catch{throw new InputError('Convite inválido.',404)}if(!Number.isFinite(d.exp)||d.exp<=Date.now())throw new InputError('Convite expirado.',410);return d}
async function body(req){if((req.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')throw new InputError('Use JSON.',415);if(Number(req.headers.get('content-length'))>65536)throw new InputError('Pedido muito grande.',413);if(!req.body)throw new InputError('JSON inválido.',400);const reader=req.body.getReader(),chunks=[];let total=0;while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>65536){await reader.cancel();throw new InputError('Pedido muito grande.',413)}chunks.push(value)}const buf=new Uint8Array(total);let i=0;for(const c of chunks){buf.set(c,i);i+=c.length}try{const x=JSON.parse(dec.decode(buf));if(!x||typeof x!=='object'||Array.isArray(x))throw Error();return x}catch{throw new InputError('JSON inválido.',400)}}
export async function handleApi(req,env){
 if(req.method!=='POST')return json(405,{error:'Use POST.'},{Allow:'POST'});
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json(403,{error:'Origem não autorizada.'});
 try{const d=await body(req),k=await key(env.DRAW_SECRET);
 if(d.action==='create'){
  if(!Array.isArray(d.names)||d.names.length<2||d.names.length>100)throw new InputError('Informe de 2 a 100 participantes.');
  const names=d.names.map(n=>field(n,80,true)),norm=n=>n.normalize('NFKC').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
  if(new Set(names.map(norm)).size!==names.length)throw new InputError('Existem nomes duplicados.');
  const event=field(d.event,100,true),date=field(d.date??'',10),budget=field(d.budget??'',60);
  if(date){const dt=new Date(date+'T00:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==date)throw new InputError('Data inválida.')}
  const p=draw(names.length),exp=Date.now()+90*86400000;
  const records=await Promise.all(names.map(async(name,i)=>({name,token:await seal({event,date,budget,from:name,to:names[p[i]],exp},k)})));
  return json(201,{records,expires_at:new Date(exp).toISOString()});
 }
 if(d.action==='preview'||d.action==='reveal'){const v=await openToken(field(d.token,4096,true),k),out={event:v.event,date:v.date,budget:v.budget,from:v.from};if(d.action==='reveal')out.to=v.to;return json(200,out)}
 return json(404,{error:'Operação inexistente.'});
 }catch(e){return e instanceof InputError?json(e.status,{error:e.message}):json(500,{error:'Não foi possível concluir a operação.'})}
}
export default {async fetch(req,env){const path=new URL(req.url).pathname;if(path==='/api')return handleApi(req,env);if(path.startsWith('/api/'))return json(404,{error:'Operação inexistente.'});return env.ASSETS.fetch(req)}};
