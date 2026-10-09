import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { SignJWT, jwtVerify } from 'jose';

export function env(name) { const v=process.env[name]; if(!v) throw new Error('Missing env: '+name); return v; }
export function db() { return createClient(env('SUPABASE_URL'),env('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}}); }
export function validateTelegram(initData) {
 if(typeof initData!=='string'||initData.length>10000) throw new Error('Invalid initData');
 const p=new URLSearchParams(initData); const hash=p.get('hash');
 if(!hash||!/^[a-f0-9]{64}$/i.test(hash)) throw new Error('Missing hash');
 const entries=[...p.entries()].filter(([k])=>k!=='hash'&&k!=='signature');
 if(new Set([...p.keys()]).size!==[...p.keys()].length) throw new Error('Duplicate fields');
 const check=entries.sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>`${k}=${v}`).join('\n');
 const secret=crypto.createHmac('sha256','WebAppData').update(env('TELEGRAM_BOT_TOKEN')).digest();
 const digest=crypto.createHmac('sha256',secret).update(check).digest();
 if(!crypto.timingSafeEqual(Buffer.from(hash,'hex'),digest)) throw new Error('Invalid Telegram signature');
 const ts=Number(p.get('auth_date')); const now=Math.floor(Date.now()/1000);
 if(!Number.isSafeInteger(ts)||ts>now+60||now-ts>3600) throw new Error('Expired Telegram login');
 const user=JSON.parse(p.get('user')||'null');
 if(!user||!Number.isSafeInteger(user.id)||user.id<=0) throw new Error('Invalid Telegram user');
 return user;
}
const secret=()=>new TextEncoder().encode(env('SESSION_SECRET'));
export async function issueSession(id) { return new SignJWT({telegram_id:String(id)}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('8h').sign(secret()); }
function cookies(req){ return Object.fromEntries(String(req.headers.cookie||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{let i=v.indexOf('=');return [v.slice(0,i),v.slice(i+1)]})); }
export async function authorize(req,admin=false) {
 const token=cookies(req).bublik_session;
 if(!token) throw Object.assign(new Error('Unauthorized'),{status:401});
 let payload; try {({payload}=await jwtVerify(token,secret(),{algorithms:['HS256']}));}catch{throw Object.assign(new Error('Invalid session'),{status:401});}
 const {data,error}=await db().from('allowed_users').select('telegram_id,role,is_active').eq('telegram_id',payload.telegram_id).maybeSingle();
 if(error) throw error;
 if(!data||!data.is_active) throw Object.assign(new Error('Not invited'),{status:403});
 if(admin&&data.role!=='admin') throw Object.assign(new Error('Admin required'),{status:403});
 return data;
}
export function error(res,e){console.error(e.message);res.status(e.status||500).json({error:e.status?e.message:'Server error'});}
export function method(req,res,m){if(req.method!==m){res.setHeader('Allow',m);res.status(405).end();return false;}return true;}
export function sameOrigin(req){const origin=req.headers.origin; if(!origin) return false; const expected=env('SITE_ORIGIN');return origin===expected;}
export function safeFilename(name){return String(name||'upload.xlsx').replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/g,'_').slice(0,110);}
export async function storeExcel(buffer,name,actor,source){
 if(buffer.length>10*1024*1024||buffer.length<4) throw Object.assign(new Error('File size invalid (max 10MB)'),{status:400});
 const ext=String(name||'').toLowerCase(); if(!/\.xlsx?$/.test(ext))throw Object.assign(new Error('Only xlsx/xls'),{status:400});
 const isXlsx=buffer.subarray(0,2).toString()==='PK';const isXls=buffer.subarray(0,8).toString('hex')==='d0cf11e0a1b11ae1';
 if(!((ext.endsWith('.xlsx')&&isXlsx)||(ext.endsWith('.xls')&&isXls)))throw Object.assign(new Error('Invalid Excel file signature'),{status:400});
 const sha=crypto.createHash('sha256').update(buffer).digest('hex');
 const path=`${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeFilename(name)}`;
 const client=db();const {error:uploadError}=await client.storage.from('excel-uploads').upload(path,buffer,{contentType:'application/octet-stream',upsert:false});
 if(uploadError)throw uploadError;
 const {error:logError}=await client.from('excel_uploads').insert({storage_path:path,original_name:String(name).slice(0,255),sha256:sha,uploaded_by:String(actor),source});
 if(logError)throw logError;
 return {path,sha256:sha};
}
