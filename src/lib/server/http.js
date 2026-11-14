import {CheckoutError} from './commerce.mjs';

export function json(body,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function api(handler){return async(...args)=>{try{return await handler(...args);}catch(error){return json({error:error.status?error.message:error instanceof SyntaxError?'Invalid request.':'This request could not be completed. Please try again.'},error.status||(error instanceof SyntaxError?400:500));}};}
export async function rawBody(request){
  const declared=Number(request.headers.get('content-length'));
  if(Number.isFinite(declared)&&declared>65536)throw new CheckoutError(413,'Request too large.');
  if(!request.body)return Buffer.alloc(0);
  const reader=request.body.getReader(),chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw new CheckoutError(413,'Request too large.');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
  return Buffer.concat(chunks);
}
const rateKey=Symbol.for('grainlabs.request.rates');
export function checkWrite(request){
  const fallback = process.env.URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://127.0.0.1:5175';
  const origin=new URL(process.env.PUBLIC_ORIGIN||fallback).origin;
  if(request.headers.get('origin')!==origin||!request.headers.get('content-type')?.startsWith('application/json'))throw new CheckoutError(403,'Request not allowed.');
  const rates=globalThis[rateKey]??=new Map(),now=Date.now();
  for(const [key,value] of rates)if(now-value.start>60000)rates.delete(key);
  // Only opt into forwarded IPs when a trusted proxy replaces incoming values.
  const key=process.env.TRUST_PROXY_HEADERS==='true'?(request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'):'shared';
  const rate=rates.get(key)||{start:now,count:0};rate.count++;rates.set(key,rate);
  if(rate.count>(key==='shared'?120:30))throw new CheckoutError(429,'Please wait a minute before trying again.');
}
export async function input(request){checkWrite(request);return JSON.parse((await rawBody(request)).toString('utf8'));}
