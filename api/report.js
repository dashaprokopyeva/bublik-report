import {createRequire} from 'node:module';
import {authorize,error,method} from '../_lib/core.js';
const require=createRequire(import.meta.url);
const report=require('../private/report.cjs');
export default async function handler(req,res){if(!method(req,res,'GET'))return;
 try{await authorize(req);res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"frame-ancestors 'none'");res.status(200).send(Buffer.from(report,'base64').toString('utf8'));}catch(e){error(res,e)}
}
