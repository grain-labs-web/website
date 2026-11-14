// Explicit opt-in: writes synthetic records to an isolated QA schema. No payments or emails.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openPostgresStore } from '../src/lib/server/postgres-store.mjs';
import { commerce, configuration, signature } from '../src/lib/server/commerce.mjs';
try { process.loadEnvFile(); } catch {}

test('Neon TLS, concurrent creation, atomic capture/outbox, retries and reconnect persistence', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for the opt-in database test.');
  const schema=`grainlabs_qa_${randomUUID().replaceAll('-','')}`;
  let db=await openPostgresStore(process.env.DATABASE_URL,schema);
  let second=await openPostgresStore(process.env.DATABASE_URL,schema);
  const config={...configuration({SHIPPING_PAISE:'0',DELIVERY_PIN_PREFIXES:'560'}),ready:true,test:true,keyId:'rzp_test_qa',secret:'qa-only',webhookSecret:'qa-webhook-only'};
  const input={checkoutId:randomUUID(),token:'a'.repeat(64),quantity:2,amount:1,customer:{name:'Grain Labs synthetic QA',phone:'9000000000',email:'qa@example.invalid',address:'Synthetic address - do not fulfil',city:'Bengaluru',state:'Karnataka',pin:'560001'}};
  let creates=0,current='created',amount=59800;
  const provider={create:async order=>{creates++;return{id:'order_qa',receipt:order.id,amount:order.amount,currency:'INR'};},find:async id=>({id:'order_qa',receipt:id,amount:59800,currency:'INR'}),payment:async id=>({id,order_id:'order_qa',amount,currency:'INR',status:current})};
  const sent=[];let failFounder=true;
  const notify=async job=>{if(job.recipient==='founder'&&failFounder){failFounder=false;throw new Error('Synthetic mail outage');}sent.push(job.recipient);};
  const callback={id:input.checkoutId,token:input.token,razorpay_order_id:'order_qa',razorpay_payment_id:'pay_qa',razorpay_signature:signature('order_qa|pay_qa',config.secret)};
  try {
    assert.deepEqual(await db.health(),{connected:true,tls:true,certificateVerified:true,schema});
    let shop=commerce({db,config,provider,notify}),other=commerce({db:second,config,provider,notify});
    const results=await Promise.all([shop.create(input),other.create(input)]);
    assert.equal(creates,1);assert.equal(results[0].amount,59800);assert.equal(results[0].shipping,0);assert.equal(results[0].customer,undefined);
    await assert.rejects(shop.status(input.checkoutId,'wrong'),/not found/);
    const stored=await db.prepare('SELECT * FROM orders WHERE id=?').get(input.checkoutId);
    assert.equal(JSON.parse(stored.customer).name,input.customer.name);assert.notEqual(stored.token_hash,input.token);
    current='captured';amount=1;await assert.rejects(shop.verify(callback),/amount/);assert.equal((await shop.status(input.checkoutId,input.token)).status,'created');
    amount=59800;await Promise.all([shop.verify(callback),other.verify(callback)]);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM notifications').get()).n,2);
    current='failed';await other.verify(callback);assert.equal((await shop.status(input.checkoutId,input.token)).status,'paid');
    const raw=Buffer.from(JSON.stringify({event:'payment.captured',payload:{payment:{entity:{id:'pay_qa'}}}}));
    await Promise.all([shop.webhook(raw,signature(raw,config.webhookSecret),'qa-event'),other.webhook(raw,signature(raw,config.webhookSecret),'qa-event')]);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM events').get()).n,1);
    current='captured';await Promise.all([shop.work(),other.work()]);
    assert.equal(sent.filter(x=>x==='customer').length,1);
    await db.prepare('UPDATE notifications SET next_attempt=0').run();await shop.work();assert.equal(sent.filter(x=>x==='founder').length,1);
    assert.equal((await db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE status='sent'").get()).n,2);
    assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM payment_attempts').get()).n,2);
    // A failing transaction cannot leave a partial state update behind.
    await assert.rejects(db.transaction(async tx=>{await tx.prepare("UPDATE orders SET status='payment_failed' WHERE id=?").run(input.checkoutId);throw new Error('rollback check');}));
    await second.close();second=null;await db.close();db=await openPostgresStore(process.env.DATABASE_URL,schema);
    shop=commerce({db,config,provider});assert.equal((await shop.status(input.checkoutId,input.token)).status,'paid');
    assert.equal((await db.prepare('SELECT * FROM events WHERE id=?').get('qa-event')).done,1);
    console.log(JSON.stringify({qaSchema:schema,orders:1,verifiedPaymentStates:2,webhooks:1,emailJobs:2,persistence:'verified',externalPayments:0,externalEmails:0}));
  } finally {if(second)await second.close();await db.close();}
});
