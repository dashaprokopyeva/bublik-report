import {validateTelegram,db,issueSession,error,method,sameOrigin} from '../_lib/core.js';
export default async function handler(req,res){if(!method(req,res,'POST'))return;
 res.setHeader('Cache-Control','no-store');
 try{
  if(!sameOrigin(req))throw Object.assign(new Error('Bad origin'),{status:403});
  const user=validateTelegram(req.body?.initData);
  const {data, error:dbError}=await db().from('allowed_users').select('telegram_id,role,is_active').eq('telegram_id',String(user.id)).maybeSingle();
  if(dbError)throw dbError;
  if(!data?.is_active)throw Object.assign(new Error('Нет приглашения'),{status:403});
  const token=await issueSession(user.id);
  res.setHeader('Set-Cookie',`bublik_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);
  res.status(200).json({ok:true,role:data.role});
 }catch(e){error(res,e)}
}
