import {getRuntime} from '../../../../lib/server/runtime';
import {api,json,rawBody} from '../../../../lib/server/http';
export const runtime='nodejs';
export const POST=api(async request=>{const raw=await rawBody(request);const {shop}=await getRuntime();await shop.webhook(raw,request.headers.get('x-razorpay-signature'),request.headers.get('x-razorpay-event-id'));return json({received:true});});
