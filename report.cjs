import {authorize,error,method,sameOrigin,storeExcel} from '../_lib/core.js';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){if(!method(req,res,'POST'))return;
 try{
  if(!sameOrigin(req))throw Object.assign(new Error('Bad origin'),{status:403});
  const user=await authorize(req,true);
  const parts=[];let n=0;for await(const chunk of req){n+=chunk.length;if(n>10*1024*1024)throw Object.assign(new Error('Max 10MB'),{status:413});parts.push(chunk);}
  const name=req.headers['x-file-name']?decodeURIComponent(String(req.headers['x-file-name'])):'upload.xlsx';
  const result=await storeExcel(Buffer.concat(parts),name,user.telegram_id,'web');
  res.status(201).json({ok:true,...result});
 }catch(e){error(res,e)}
}
