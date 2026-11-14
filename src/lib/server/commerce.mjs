import { DatabaseSync } from 'node:sqlite';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import nodemailer from 'nodemailer';
import { asyncSqliteStore } from './postgres-store.mjs';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const signature = (body, secret) => createHmac('sha256', secret).update(body).digest('hex');
export function validSignature(body, secret, received) {
  return typeof received === 'string' && /^[a-f0-9]{64}$/.test(received) && timingSafeEqual(Buffer.from(signature(body, secret), 'hex'), Buffer.from(received, 'hex'));
}
export class CheckoutError extends Error { constructor(status, message) { super(message); this.status = status; } }
export function configuration(env = process.env) {
  const shipping = env.SHIPPING_PAISE ?? '0';
  const shippingPaise = shipping !== undefined && /^\d+$/.test(shipping) ? Number(shipping) : null;
  const test = /^rzp_test_/.test(env.RAZORPAY_KEY_ID || '');
  const live = /^rzp_live_/.test(env.RAZORPAY_KEY_ID || '') && env.LIVE_PAYMENTS_APPROVED === 'true' && env.LAUNCH_DETAILS_APPROVED === 'true';
  const mailReady=[env.SMTP_HOST,env.SMTP_USER,env.SMTP_PASSWORD,env.EMAIL_FROM,env.ORDER_NOTIFICATION_EMAIL].every(Boolean);
  const ready = Boolean((test || (live && mailReady)) && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_WEBHOOK_SECRET && Number.isSafeInteger(shippingPaise) && shippingPaise <= 100000 && (test || env.DELIVERY_PIN_PREFIXES));
  return { price: 29900, shippingPaise, currency: 'INR', ready, test, keyId: env.RAZORPAY_KEY_ID,
    secret: env.RAZORPAY_KEY_SECRET, webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    pinPrefixes: (env.DELIVERY_PIN_PREFIXES || '1,2,3,4,5,6,7,8,9').split(',').map(s => s.trim()).filter(s => /^\d{1,6}$/.test(s)),
    smtpHost:env.SMTP_HOST,smtpPort:Number(env.SMTP_PORT)||465,smtpUser:env.SMTP_USER,smtpPassword:env.SMTP_PASSWORD,emailFrom:env.EMAIL_FROM,founderEmail:env.ORDER_NOTIFICATION_EMAIL };
}
export function validateOrder(input, config) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CheckoutError(400,'Invalid order.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) throw new CheckoutError(400, 'Choose between 1 and 20 packs.');
  if (typeof input.checkoutId !== 'string' || !/^[a-f0-9-]{36}$/.test(input.checkoutId) || typeof input.token !== 'string' || !/^[a-f0-9]{64}$/.test(input.token)) throw new CheckoutError(400, 'Invalid checkout session. Reload checkout.');
  const customer = {};
  for (const [key, max, required] of [['name',100,true],['phone',10,true],['email',254,true],['address',400,true],['city',100,true],['state',100,true],['pin',6,true],['landmark',150,false]]) {
    const value = input.customer?.[key];
    if (value !== undefined && typeof value !== 'string') throw new CheckoutError(400, 'Invalid delivery details.');
    customer[key] = (value || '').trim();
    if ((required && !customer[key]) || customer[key].length > max || /[\x00-\x1f\x7f]/.test(customer[key])) throw new CheckoutError(400, `Check your ${key}.`);
  }
  if (!/^[6-9]\d{9}$/.test(customer.phone) || !/^[1-9]\d{5}$/.test(customer.pin) || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(customer.email)) throw new CheckoutError(400, 'Check your mobile number, email and PIN code.');
  if (!config.pinPrefixes.some(prefix => customer.pin.startsWith(prefix))) throw new CheckoutError(400, 'Delivery is not available to this PIN code.');
  return { customer, quantity: input.quantity, amount: config.price * input.quantity + config.shippingPaise };
}
export function razorpayProvider(config, fetcher = fetch) {
  async function request(route, options = {}) {
    const response = await fetcher(`https://api.razorpay.com/v1/${route}`, { ...options, redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.secret}`).toString('base64')}`, 'Content-Type': 'application/json' } });
    if (!response.ok) throw new CheckoutError(502, 'The payment provider could not complete this request.');
    return response.json();
  }
  return { create: order => request('orders', { method: 'POST', body: JSON.stringify({ amount: order.amount, currency: 'INR', receipt: order.id, notes: { grain_order: order.id } }) }),
    payment: id => request(`payments/${encodeURIComponent(id)}`),
    payments: async id => (await request(`orders/${encodeURIComponent(id)}/payments`)).items || [],
    // Recover an uncertain create response by its unique receipt; never blindly create again.
    find: async receipt => { const result = await request(`orders?receipt=${encodeURIComponent(receipt)}`); return result.items?.find(order => order.receipt === receipt) || null; } };
}
export function openStore(filename) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, fingerprint TEXT NOT NULL, customer TEXT NOT NULL, quantity INTEGER NOT NULL, amount INTEGER NOT NULL, shipping INTEGER NOT NULL, provider_id TEXT UNIQUE, payment_id TEXT, status TEXT NOT NULL, created INTEGER NOT NULL, checked INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS payment_attempts (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, payment_id TEXT NOT NULL, status TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL, recorded INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, payment_id TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL DEFAULT 0);`);
  if (!db.prepare('PRAGMA table_info(orders)').all().some(column => column.name === 'checked')) db.exec('ALTER TABLE orders ADD COLUMN checked INTEGER NOT NULL DEFAULT 0');
  return db;
}
export function commerce({ db: rawDb, config, provider = razorpayProvider(config), notify = null }) {
  const db = rawDb.transaction ? rawDb : asyncSqliteStore(rawDb);
  const inflight = new Map();
  const get = (id, store = db) => store.prepare('SELECT * FROM orders WHERE id=?').get(id);
  function checkToken(order, token) { if (!order || typeof token !== 'string' || hash(token) !== order.token_hash) throw new CheckoutError(404, 'Order not found.'); return order; }
  async function authorize(id, token) { return checkToken(await get(id), token); }
  function publicOrder(order) { return { id: order.id, reference: `GL-${order.id.slice(0,8).toUpperCase()}`, quantity: order.quantity, amount: order.amount, shipping: order.shipping, status: order.status, providerId: order.provider_id, currency: 'INR', keyId: config.keyId, test: config.test }; }
  async function create(input) {
    if (!config.ready) throw new CheckoutError(503, 'Checkout is temporarily unavailable. No order has been placed.');
    const validated = validateOrder(input, config), fingerprint = hash(JSON.stringify(validated));
    // The database arbitrates the first creator across connections/processes.
    const { order, isNew } = await db.transaction(async tx => {
      await tx.lock(input.checkoutId);
      let order = await get(input.checkoutId, tx);
      const isNew = !order;
      if (order) { checkToken(order, input.token); if (order.fingerprint !== fingerprint) throw new CheckoutError(409, 'This checkout already has different details. Start a new checkout.'); }
      else {
        await tx.prepare('INSERT INTO orders (id,token_hash,fingerprint,customer,quantity,amount,shipping,status,created) VALUES (?,?,?,?,?,?,?,?,?)').run(input.checkoutId, hash(input.token), fingerprint, JSON.stringify(validated.customer), validated.quantity, validated.amount, config.shippingPaise, 'creation_pending', Date.now());
        order = await get(input.checkoutId, tx);
      }
      return { order, isNew };
    });
    if (order.provider_id) return publicOrder(order);
    if (inflight.has(order.id)) return inflight.get(order.id);
    const task = (async () => {
      try {
        const result = isNew ? await provider.create(order) : await provider.find(order.id);
        if (!result) throw new CheckoutError(409, 'Payment setup is being reconciled. Please retry this checkout shortly; do not start another payment.');
        if (!/^order_[a-zA-Z0-9]+$/.test(result.id) || result.amount !== order.amount || result.currency !== 'INR' || result.receipt !== order.id) throw new CheckoutError(502, 'Payment order could not be verified.');
        await db.prepare("UPDATE orders SET provider_id=?,status='created' WHERE id=? AND status NOT IN ('paid','refunded')").run(result.id, order.id);
        return publicOrder(await get(order.id));
      } catch (error) { if (error instanceof CheckoutError) throw error; throw new CheckoutError(502, 'Payment setup is pending. Retry this same checkout shortly.'); }
    })();
    inflight.set(order.id, task); try { return await task; } finally { inflight.delete(order.id); }
  }
  async function applyPayment(payment, eventId = null) {
    const found = await db.prepare('SELECT * FROM orders WHERE provider_id=?').get(payment.order_id);
    if (!found) throw new CheckoutError(409, 'Payment order is not available yet.');
    return db.transaction(async tx => {
      await tx.lock(found.id);
      const order = await get(found.id, tx);
      if (payment.amount !== order.amount || payment.currency !== 'INR') throw new CheckoutError(400, 'Payment amount does not match this order.');
      if (!['captured','authorized','failed','created','refunded'].includes(payment.status)) throw new CheckoutError(400, 'Unknown payment state.');
      const next = payment.status === 'captured' ? 'paid' : payment.status === 'authorized' ? 'payment_pending' : payment.status === 'failed' ? 'payment_failed' : payment.status === 'refunded' ? 'refunded' : 'created';
      // Persist only trusted payment facts, never raw card/bank/provider objects.
      await tx.prepare('INSERT OR IGNORE INTO payment_attempts(id,order_id,payment_id,status,amount,currency,recorded) VALUES(?,?,?,?,?,?,?)').run(hash(`${order.id}|${payment.id}|${payment.status}`),order.id,payment.id,payment.status,payment.amount,payment.currency,Date.now());
      if (!['paid','refunded'].includes(order.status) || next === 'refunded') await tx.prepare('UPDATE orders SET status=?,payment_id=? WHERE id=?').run(next, payment.id, order.id);
      if (next === 'paid' && order.status !== 'refunded') for (const recipient of ['customer','founder']) await tx.prepare('INSERT OR IGNORE INTO notifications(id,order_id) VALUES(?,?)').run(`paid:${recipient}:${order.id}`,order.id);
      if (eventId) await tx.prepare('UPDATE events SET done=1 WHERE id=?').run(eventId);
      return publicOrder(await get(order.id, tx));
    });
  }
  async function verify(input) {
    const order = await authorize(input.id,input.token);
    if (input.razorpay_order_id !== order.provider_id || !/^pay_[a-zA-Z0-9]+$/.test(input.razorpay_payment_id || '') || !validSignature(`${order.provider_id}|${input.razorpay_payment_id}`,config.secret,input.razorpay_signature)) throw new CheckoutError(400,'Payment signature could not be verified.');
    const payment = await provider.payment(input.razorpay_payment_id);
    if (payment.id !== input.razorpay_payment_id || payment.order_id !== order.provider_id) throw new CheckoutError(400,'Payment does not belong to this order.');
    return applyPayment(payment);
  }
  async function webhook(raw, received, eventId) {
    if (!config.webhookSecret || !validSignature(raw,config.webhookSecret,received)) throw new CheckoutError(400,'Invalid webhook signature.');
    const payload = JSON.parse(raw.toString('utf8'));
    if (!['payment.captured','payment.authorized','payment.failed','order.paid'].includes(payload.event)) return;
    const paymentId = payload.payload?.payment?.entity?.id;
    if (!/^pay_[a-zA-Z0-9]+$/.test(paymentId || '')) throw new CheckoutError(400,'Missing payment identifier.');
    const id = typeof eventId === 'string' && eventId.length <= 200 ? eventId : hash(raw);
    await db.prepare('INSERT OR IGNORE INTO events(id,payment_id) VALUES(?,?)').run(id,paymentId);
    const event = await db.prepare('SELECT * FROM events WHERE id=?').get(id);
    if (event.payment_id !== paymentId) throw new CheckoutError(400,'Conflicting event identifier.');
  }
  let working = false;
  async function work() {
    if (working) return; working = true;
    try {
      for (const order of await db.prepare("SELECT * FROM orders WHERE provider_id IS NULL AND status IN ('creating','creation_pending') ORDER BY checked LIMIT 10").all()) {
        if(inflight.has(order.id)) continue;
        await db.prepare('UPDATE orders SET checked=? WHERE id=?').run(Date.now(),order.id);
        try { const found=await provider.find(order.id);if(found && /^order_[a-zA-Z0-9]+$/.test(found.id) && found.receipt===order.id && found.amount===order.amount && found.currency==='INR') await db.prepare("UPDATE orders SET provider_id=?,status='created' WHERE id=? AND provider_id IS NULL").run(found.id,order.id); } catch { /* reconcile; never create another provider order */ }
      }
      for (const event of await db.prepare('SELECT * FROM events WHERE done=0 LIMIT 20').all()) {
        try { const payment = await provider.payment(event.payment_id); if(payment.id === event.payment_id) await applyPayment(payment,event.id); } catch { /* durable retry; no PII or secrets logged */ }
      }
      // Also reconcile known abandoned/missing-callback orders against current provider state.
      if (provider.payments) for (const order of await db.prepare("SELECT * FROM orders WHERE provider_id IS NOT NULL AND status IN ('created','payment_pending','payment_failed') ORDER BY checked LIMIT 10").all()) {
        await db.prepare('UPDATE orders SET checked=? WHERE id=?').run(Date.now(),order.id);
        try { const items=await provider.payments(order.provider_id);for(const payment of items) if(payment.order_id===order.provider_id && /^pay_[a-zA-Z0-9]+$/.test(payment.id)) await applyPayment(payment); } catch { /* retry on next worker tick */ }
      }
      if (!notify) return;
      const now=Date.now();
      for (const job of await db.prepare("SELECT * FROM notifications WHERE status IN ('pending','processing') AND next_attempt<=? LIMIT 10").all(now)) {
        const claim=await db.prepare("UPDATE notifications SET status='processing',next_attempt=? WHERE id=? AND status IN ('pending','processing') AND next_attempt<=?").run(now+300000,job.id,now);
        if (!claim.changes) continue;
        const order=await get(job.order_id);
        if(order.status !== 'paid') { await db.prepare("UPDATE notifications SET status='cancelled' WHERE id=?").run(job.id); continue; }
        try { await notify({ id:job.id, recipient:job.id.split(':')[1], type:'order.paid', order:publicOrder(order), customer:JSON.parse(order.customer) }); await db.prepare("UPDATE notifications SET status='sent',attempts=attempts+1 WHERE id=?").run(job.id); }
        catch { await db.prepare("UPDATE notifications SET status='pending',attempts=attempts+1,next_attempt=? WHERE id=?").run(Date.now()+Math.min(3600000,30000*2**Math.min(job.attempts,7)),job.id); }
      }
    } finally { working=false; }
  }
  return { create,verify,webhook,work,status:async(id,token)=>publicOrder(await authorize(id,token)) };
}
export function notificationAdapter(config, transportFactory = nodemailer.createTransport) {
  if (![config.smtpHost,config.smtpUser,config.smtpPassword,config.emailFrom,config.founderEmail].every(Boolean)) return null;
  const transport=transportFactory({host:config.smtpHost,port:config.smtpPort,secure:config.smtpPort===465,requireTLS:true,auth:{user:config.smtpUser,pass:config.smtpPassword},tls:{rejectUnauthorized:true},disableFileAccess:true,disableUrlAccess:true,logger:false,debug:false,connectionTimeout:10000,socketTimeout:15000});
  return async job => {
    const {order,customer}=job,amount=`₹${(order.amount/100).toFixed(2)}`,founder=job.recipient==='founder';
    const text=[order.test?'TEST ORDER — no fulfilment required.':'Payment verified. Order received.',`Order: ${order.reference}`,`Women’s Oats · 70 g × ${order.quantity}`,`Paid: ${amount} (includes shipping)`,founder?`Customer: ${customer.name}\nEmail: ${customer.email}\nMobile: ${customer.phone}\nDeliver to: ${customer.address}\n${customer.city}, ${customer.state} ${customer.pin}\nLandmark: ${customer.landmark || '—'}`:`Hello ${customer.name},\nThank you for your Grain Labs order. Please keep this reference for support. Delivery timing follows the merchant’s published shipping policy.`].join('\n\n');
    const result=await transport.sendMail({from:config.emailFrom,to:founder?config.founderEmail:customer.email,subject:`${order.test?'[TEST] ':''}Grain Labs ${founder?'new paid order':'order confirmation'} · ${order.reference}`,text,messageId:`<${hash(job.id)}@grain-labs-orders.local>`});
    if(!result.accepted?.length) throw new Error('Email delivery pending.');
  };
}
