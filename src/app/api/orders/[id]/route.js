import {getRuntime} from '../../../../lib/server/runtime';
import {api,json} from '../../../../lib/server/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=api(async(request,context)=>{const {id}=await context.params;const {shop}=await getRuntime();return json(await shop.status(id,request.headers.get('authorization')?.replace(/^Bearer /,'')));});
