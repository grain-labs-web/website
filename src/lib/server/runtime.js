import 'server-only';
import path from 'node:path';
import { configuration, openStore, commerce, notificationAdapter } from './commerce.mjs';
import { openPostgresStore } from './postgres-store.mjs';

const runtimeKey=Symbol.for('grainlabs.commerce.runtime'), workerKey=Symbol.for('grainlabs.commerce.worker');

export function getRuntime() {
  if (!globalThis[runtimeKey]) globalThis[runtimeKey]=(async()=>{
    const config=configuration();
    const mode=config.test?'test':config.keyId?.startsWith('rzp_live_')?'live':'local';
    if(mode==='live'&&!process.env.DATABASE_URL)throw new Error('Live checkout needs a database.');
    const db=process.env.DATABASE_URL
      ? await openPostgresStore(process.env.DATABASE_URL,`grainlabs_${mode}`)
      : openStore(process.env.ORDER_DB_PATH||path.join(process.cwd(),'data',`orders-${mode}.sqlite`));
    const notify=notificationAdapter(config);
    return {db,config,shop:commerce({db,config,notify}),notificationReady:Boolean(notify)};
  })().catch(error=>{delete globalThis[runtimeKey];throw error;});
  return globalThis[runtimeKey];
}

// This storefront targets a persistent Node.js host. A serverless host would
// require an independently scheduled worker rather than relying on this timer.
export function startOrderWorker(){
  if(globalThis[workerKey])return;
  const tick=async()=>{if(!configuration().ready)return;try{const {shop}=await getRuntime();await shop.work();}catch{console.error('Order worker unavailable; durable work will retry.');}};
  const timer=setInterval(()=>void tick(),15000);timer.unref();globalThis[workerKey]=timer;
}
