import {publicCatalog} from '../../../lib/server/catalog';
import {json} from '../../../lib/server/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
  return json(publicCatalog());
}
