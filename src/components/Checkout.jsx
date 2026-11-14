'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import {loadRazorpay} from '../lib/razorpay-client';

const storageKey='grain-checkout-session';
const money=paise=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(paise/100);
function saveSession(session){try{sessionStorage.setItem(storageKey,JSON.stringify(session));}catch{}}
function createSession(){const bytes=crypto.getRandomValues(new Uint8Array(32));return {checkoutId:crypto.randomUUID(),token:[...bytes].map(n=>n.toString(16).padStart(2,'0')).join(''),created:Date.now()};}

export default function Checkout({catalog,initialQuantity}){
  const [quantity,setQuantity]=useState(initialQuantity),[order,setOrder]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[awaiting,setAwaiting]=useState(false),[initialized,setInitialized]=useState(false),[paymentOpen,setPaymentOpen]=useState(false);
  const session=useRef(null),busyRef=useRef(false),instance=useRef(null),alive=useRef(false);
  const paid=order?.status==='paid',refunded=order?.status==='refunded',pending=order?.status==='payment_pending'||awaiting;
  const locked=Boolean(order),total=catalog.shipping===null?null:catalog.price*quantity+catalog.shipping;
  const api=useCallback(async(url,body)=>{
    const response=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{Authorization:`Bearer ${session.current.token}`},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    let result;try{result=await response.json();}catch{throw new Error('The server could not be reached. Please try again.');}
    if(!response.ok)throw new Error(result.error||'Please try again.');return result;
  },[]);
  const apply=useCallback(result=>{
    if(!alive.current)return;
    setOrder(result);setQuantity(result.quantity);
    if(result.status==='paid'){setAwaiting(false);setMessage('');try{sessionStorage.removeItem(storageKey);}catch{};}
    else if(result.status==='payment_failed'){setAwaiting(false);session.current.awaitingVerification=false;saveSession(session.current);setMessage('Payment failed. You can retry payment for this same order.');}
    else if(result.status==='payment_pending')setMessage('Payment is awaiting capture. Do not pay again; check status shortly.');
    else if(result.status==='refunded')setMessage('This payment is refunded. Please contact the merchant for support.');
  },[]);
  const check=useCallback(async()=>{try{apply(await api(`/api/orders/${session.current.checkoutId}`));}catch(error){if(alive.current)setMessage(error.message);}},[api,apply]);
  useEffect(()=>{
    alive.current=true;let cancelled=false;
    let saved;try{saved=JSON.parse(sessionStorage.getItem(storageKey));}catch{}
    if(!saved||!/^[a-f0-9-]{36}$/.test(saved.checkoutId)||!/^[a-f0-9]{64}$/.test(saved.token)||!Number.isFinite(saved.created)||Date.now()-saved.created>86400000||saved.created>Date.now())saved=createSession();
    session.current=saved;saveSession(saved);setAwaiting(Boolean(saved.awaitingVerification));
    (async()=>{
      if(catalog.paymentReady){try{const result=await api(`/api/orders/${saved.checkoutId}`);if(!cancelled&&result.providerId)apply(result);}catch{}}
      if(!cancelled)setInitialized(true);
    })();
    return()=>{cancelled=true;alive.current=false;instance.current?.close();};
  },[catalog.paymentReady,api,apply]);
  useEffect(()=>{if(!order||paid||refunded)return;let polls=0;const timer=setInterval(()=>{if(polls++>=20){clearInterval(timer);return;}void check();},3000);return()=>clearInterval(timer);},[order?.id,paid,refunded,check]);

  async function pay(event){
    event.preventDefault();if(busyRef.current||!catalog.paymentReady||pending||paid||refunded||!initialized)return;
    busyRef.current=true;setBusy(true);setMessage('Preparing secure payment…');
    try{
      let current=order,customer;
      if(!current){customer=Object.fromEntries(new FormData(event.currentTarget));current=await api('/api/orders',{...session.current,quantity,customer});apply(current);}
      else{current=await api(`/api/orders/${session.current.checkoutId}`);apply(current);}
      if(['paid','payment_pending','refunded'].includes(current.status))return;
      await loadRazorpay();if(!alive.current)return;
      const checkout=new window.Razorpay({key:current.keyId,order_id:current.providerId,amount:current.amount,currency:current.currency,name:'Grain Labs',description:`Women’s Oats · 70 g × ${current.quantity}`,prefill:customer?{name:customer.name,email:customer.email,contact:customer.phone}:undefined,theme:{color:'#ad175e'},modal:{ondismiss:()=>{if(!alive.current)return;setPaymentOpen(false);setMessage('Payment window closed. Your order is not confirmed until payment is verified.');void check();}},handler:async response=>{
        session.current.awaitingVerification=true;saveSession(session.current);
        if(alive.current){setAwaiting(true);setPaymentOpen(false);setMessage('Verifying payment securely…');}
        try{apply(await api('/api/payments/verify',{id:session.current.checkoutId,token:session.current.token,...response}));}
        catch{if(alive.current)setMessage('Payment verification is pending. Do not pay again. Check status shortly.');}
      }});
      instance.current=checkout;checkout.on('payment.failed',()=>{if(alive.current){setMessage('Payment was unsuccessful. Check status before retrying.');void check();}});setPaymentOpen(true);checkout.open();
    }catch(error){if(alive.current)setMessage(error.message);}
    finally{busyRef.current=false;if(alive.current)setBusy(false);}
  }
  const setup=paid?(catalog.notificationReady?'Your payment is confirmed. We’ll email your order details.':'Confirmation is available here. Please keep your order reference for support.'):
    !catalog.paymentReady?'Checkout is temporarily unavailable. Please try again later.':catalog.test?'Razorpay test mode · No real purchase or fulfilment.':'Secure guest checkout with Razorpay.';
  const payLabel=paid?'Payment confirmed':refunded?'Payment refunded':pending?'Awaiting payment confirmation':busy?'Preparing secure payment…':!catalog.paymentReady?'Checkout unavailable':order?'Retry payment with Razorpay ↗':'Pay securely with Razorpay ↗';
  return <>
    <header className="header"><Link className="wordmark" href="/" aria-label="Grain Labs home"><BrandLogo /></Link><Link className="text-link" href="/">← Back to the good stuff</Link></header>
    <main className="checkout-page"><p className="eyebrow">A VERY YOU KIND OF MORNING · GUEST CHECKOUT</p><h1>Your chocolate<br /><span>morning awaits.</span></h1><p className="checkout-alert" role="status">{setup}</p>
      <div className="checkout-layout"><form id="delivery-form" onSubmit={pay}><h2>Where should we send it?</h2><p className="muted">No account needed. Just the details to deliver your oats.</p>
        <fieldset disabled={locked||busy} className="form-grid" style={{border:0,padding:0,margin:'25px 0 0',minWidth:0}}>
          <label>Full name<input name="name" autoComplete="name" required maxLength={100} /></label>
          <label>Mobile number<input name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[6-9][0-9]{9}" maxLength={10} required placeholder="10-digit Indian mobile" /></label>
          <label className="full">Email for your order confirmation<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="you@example.com" /></label>
          <label className="full">Delivery address<textarea name="address" autoComplete="street-address" required maxLength={400} placeholder="Flat / house, street and area" /></label>
          <label>City<input name="city" autoComplete="address-level2" required maxLength={100} /></label><label>State<input name="state" autoComplete="address-level1" required maxLength={100} /></label>
          <label>PIN code<input name="pin" autoComplete="postal-code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} required /></label><label>Landmark <span>(optional)</span><input name="landmark" maxLength={150} /></label>
        </fieldset>
        <p className="data-note">Delivery details are sent to Grain Labs only when you continue to payment. Card, UPI and banking details stay in Razorpay’s checkout.</p>
        <button type="submit" className="button" disabled={!initialized||!catalog.paymentReady||busy||pending||paid||refunded||paymentOpen}>{payLabel}</button><p id="payment-status" role="status" aria-live="polite">{message}</p>
        {order&&<button id="check-status" type="button" className="text-link" onClick={check}>Check payment status ↻</button>}
        {order&&!paid&&!refunded&&!pending&&!busy&&!paymentOpen&&<a id="new-checkout" className="text-link" href="/checkout" onClick={()=>{try{sessionStorage.removeItem(storageKey);}catch{}}}>Start a new checkout</a>}
      </form>
      <aside className="order-summary"><p className="eyebrow">ONE DELICIOUS LITTLE DELIVERY</p><img className="checkout-food" src="/assets/breakfast-bowl.webp" alt="Serving inspiration: chocolate oats with banana and berries" width="1536" height="1024" /><h3>Women’s Oats</h3><p>Rich chocolate · 70 g per pack<br />Toppings pictured are serving suggestions.</p>
        <label className="checkout-quantity">Packs<select aria-label="Number of packs" value={quantity} disabled={locked||busy} onChange={e=>setQuantity(Number(e.target.value))}>{Array.from({length:20},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
        <div><span>₹299 × {quantity}</span><span>{money(catalog.price*quantity)}</span></div><div><span>Shipping</span><span>{catalog.shipping===null?'To be confirmed':catalog.shipping===0?'Free':money(catalog.shipping)}</span></div><div className="total"><strong>Total</strong><strong>{total===null?'Awaiting shipping':money(total)}</strong></div><p className="reference-note">₹299 per 70 g pack.</p><div className="payment-methods" aria-label="Payment methods offered through Razorpay">UPI · Cards · Netbanking</div><p>Payments are handled securely by Razorpay. Available methods are shown when payment opens.</p>
      </aside></div>
      {paid&&<section id="confirmation" className="confirmation"><span aria-hidden="true">✳</span><h2>{order.test?'Test payment verified.':'Order received. Thank you!'}</h2><p>{order.test?'This is a sandbox order. No real fulfilment is requested.':`Payment of ${money(order.amount)} is verified. Your oats order has been received.`}</p><p>{order.reference} · {order.quantity} pack{order.quantity>1?'s':''} · {money(order.amount)}</p><Link className="button" href="/">Back to Grain Labs ↗</Link></section>}
    </main><footer className="checkout-footer">Guest checkout · No card details stored by Grain Labs<Link href="/">Product & policies ↗</Link></footer>
  </>;
}
