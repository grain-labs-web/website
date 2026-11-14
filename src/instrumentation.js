export async function register(){
  if(process.env.NEXT_RUNTIME==='nodejs'){
    const {startOrderWorker}=await import('./lib/server/runtime');
    startOrderWorker();
  }
}
