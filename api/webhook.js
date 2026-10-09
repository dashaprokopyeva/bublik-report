import crypto from 'node:crypto';
import {db,error,env,method,storeExcel} from '../_lib/core.js';
export default async function handler(req,res){if(!method(req,res,'POST'))return;
 try{
  const actual=String(req.headers['x-telegram-bot-api-secret-token']||'');const expected=env('TELEGRAM_WEBHOOK_SECRET');
  if(actual.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return res.status(403).end();
  const msg=req.body?.message;const doc=msg?.document;const sender=msg?.from?.id;
  if(!doc||!sender)return res.status(200).json({ok:true});
  const {data}=await db().from('allowed_users').select('role,is_active').eq('telegram_id',String(sender)).maybeSingle();
  if(!data?.is_active||data.role!=='admin')return res.status(200).json({ok:true});
  if(doc.file_size>10*1024*1024)return res.status(200).json({ok:true});
  if(!/\.xlsx?$/i.test(doc.file_name||''))return res.status(200).json({ok:true});
  const token=env('TELEGRAM_BOT_TOKEN');
  const info=await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(doc.file_id)}`).then(r=>r.json());
  if(!info.ok||!info.result?.file_path)throw new Error('Telegram getFile failed');
  const download=await fetch(`https://api.telegram.org/file/bot${token}/${info.result.file_path}`);
  if(!download.ok)throw new Error('Telegram download failed');
  const bytes=Buffer.from(await download.arrayBuffer());
  await storeExcel(bytes,doc.file_name,sender,'telegram');
  // Telegram retries on non-2xx. For production, add update_id idempotency and queue processing.
  res.status(200).json({ok:true});
 }catch(e){error(res,e)}
}
