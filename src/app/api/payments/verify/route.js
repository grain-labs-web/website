import {getRuntime} from '../../../../lib/server/runtime';
import {api,json,input} from '../../../../lib/server/http';
export const runtime='nodejs';
export const POST=api(async request=>{const data=await input(request);const {shop}=await getRuntime();return json(await shop.verify(data));});
