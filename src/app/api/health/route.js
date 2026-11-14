import {getRuntime} from '../../../lib/server/runtime';
import {api,json} from '../../../lib/server/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=api(async()=>{const {db}=await getRuntime();if(db.health)await db.health();else db.prepare('SELECT 1').get();return json({status:'ok',database:'connected'});});
