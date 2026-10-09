import {authorize,error,method} from '../_lib/core.js';
export default async function handler(req,res){if(!method(req,res,'GET'))return;try{const user=await authorize(req);res.setHeader('Cache-Control','no-store');res.json({ok:true,role:user.role});}catch(e){error(res,e)}}
