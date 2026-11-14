import { configuration } from '../src/lib/server/commerce.mjs';
import { openPostgresStore } from '../src/lib/server/postgres-store.mjs';
try { process.loadEnvFile(); } catch {}
const config=configuration(),required=['DATABASE_URL','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','SMTP_HOST','SMTP_USER','SMTP_PASSWORD','EMAIL_FROM','ORDER_NOTIFICATION_EMAIL'];
const report={missing:required.filter(name=>!process.env[name]),database:'not configured',razorpayCredentials:'not configured',emailConfigured:Boolean(config.smtpHost&&config.smtpUser&&config.smtpPassword&&config.emailFrom&&config.founderEmail),liveEnabled:config.ready&&!config.test};
if(process.env.DATABASE_URL){let db;try{db=await openPostgresStore(process.env.DATABASE_URL,`grainlabs_${config.test?'test':config.keyId?.startsWith('rzp_live_')?'live':'local'}`);const health=await db.health();report.database=health.tls&&health.certificateVerified?'connected over verified TLS':'TLS verification failed';}catch{report.database='connection failed';}finally{await db?.close();}}
if(config.keyId&&config.secret){try{const response=await fetch('https://api.razorpay.com/v1/orders?count=1',{redirect:'error',signal:AbortSignal.timeout(12000),headers:{Authorization:`Basic ${Buffer.from(`${config.keyId}:${config.secret}`).toString('base64')}`}});report.razorpayCredentials=response.ok?'accepted (read-only check)':'rejected or unavailable';}catch{report.razorpayCredentials='provider unreachable';}}
report.remainingExternalChecks=['Dashboard automatic capture','Reachable HTTPS webhook and signed delivery','Razorpay sandbox success/failure/retry','SMTP inbox delivery','Approved label, merchant details, shipping and policies'];
console.log(JSON.stringify(report,null,2));
if(report.missing.length||report.database!=='connected over verified TLS'||report.razorpayCredentials!=='accepted (read-only check)')process.exitCode=1;
