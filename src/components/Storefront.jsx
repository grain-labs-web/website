'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import Hero from './Hero';
import Footer from './Footer';
import ProductDialog from './ProductDialog';
import BreakfastCreator from './BreakfastCreator';
import Marquee from './Marquee';
import MotionEffects from './MotionEffects';
import MobileStickyBar from './MobileStickyBar';
import { ShopContext } from './ShopContext';
import { policies } from '../lib/policies';
import { useModal, backdropClose } from './useModal';

function PolicyContent({ html }) {
  // These are fixed, local policy strings, never customer-provided HTML.
  // Splitting the known heading/paragraph vocabulary keeps the output React-owned.
  return html.split(/(<h3>.*?<\/h3>|<p(?: class="policy-note")?>.*?<\/p>)/s).filter(s=>s.trim()).map((part,index)=>{
    const heading=part.startsWith('<h3>'), note=part.includes('class="policy-note"');
    const text=part.replace(/<[^>]+>/g,'');
    return heading ? <h3 key={index}>{text}</h3> : <p key={index} className={note?'policy-note':undefined}>{text}</p>;
  });
}

export default function Storefront({ intro, story, year }) {
  const [quantity,setQuantity]=useState(1),[productOpen,setProductOpen]=useState(false),[policy,setPolicy]=useState(null),[active,setActive]=useState('the-oats');
  const policyRef=useRef(null), router=useRouter();
  const onShop=useCallback(()=>{setPolicy(null);setProductOpen(true);},[]);
  const change=useCallback(delta=>setQuantity(q=>Math.max(1,Math.min(20,q+delta))),[]);
  const checkout=()=>router.push(`/checkout?quantity=${quantity}`);
  useModal(policyRef,Boolean(policy));
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(visible)setActive(visible.target.id);
    },{rootMargin:'-15% 0px -45% 0px',threshold:[0,.1,.3]});
    ['the-oats','make-my-oats','our-story'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el);});
    return ()=>observer.disconnect();
  },[]);
  return <ShopContext.Provider value={onShop}>
    <a className="skip" href="#main">Skip to content</a>
    <div className="announcement">A little chocolate. A little you. A whole new morning. <span aria-hidden="true">✳</span></div>
    <Header onShop={onShop} active={active} />
    <main id="main">
      <Hero quantity={quantity} change={change} onShop={onShop} onCheckout={checkout} />
      <Marquee />{intro}<BreakfastCreator onShop={onShop} />{story}
    </main>
    <Footer year={year} onPolicy={setPolicy} />
    <ProductDialog open={productOpen} onClose={()=>setProductOpen(false)} quantity={quantity} change={change} onCheckout={checkout} />
    <dialog ref={policyRef} className="policy-dialog" aria-labelledby="policy-title" onClose={()=>setPolicy(null)} onCancel={()=>setPolicy(null)} onClick={e=>backdropClose(e,()=>setPolicy(null))}>
      <button className="close" onClick={()=>setPolicy(null)} aria-label="Close information">×</button>
      <p className="eyebrow">{policy === 'Contact' ? 'GET IN TOUCH' : 'THE DETAILS'}</p>
      <h2 id="policy-title">{policy === 'Contact' ? 'Contact Us' : policy}</h2>
      <div>
        {policy === 'Contact' ? (
          <div className="contact-modal-body">
            <p className="contact-intro-text">We'd love to hear from you. Reach out anytime!</p>
            <div className="contact-cards">
              <a href="mailto:Hello@grainlabs.co.in" className="contact-card">
                <span className="contact-card-icon" aria-hidden="true">📧</span>
                <div className="contact-card-details">
                  <strong>Email</strong>
                  <span className="contact-card-val">Hello@grainlabs.co.in</span>
                  <small>We reply within 24 hours</small>
                </div>
              </a>
              <a href="https://wa.me/917888928217" target="_blank" rel="noopener noreferrer" className="contact-card">
                <span className="contact-card-icon" aria-hidden="true">💬</span>
                <div className="contact-card-details">
                  <strong>WhatsApp</strong>
                  <span className="contact-card-val">+91 78889 28217</span>
                  <small>Mon–Sat, 9am–6pm IST</small>
                </div>
              </a>
              <div className="contact-card">
                <span className="contact-card-icon" aria-hidden="true">📍</span>
                <div className="contact-card-details">
                  <strong>Location</strong>
                  <span className="contact-card-val">India</span>
                  <small>Delivering pan India</small>
                </div>
              </div>
            </div>
            <div className="contact-order-notice">
              <strong>For order related queries</strong>
              <p>Please include your Order ID in the message for faster resolution.</p>
            </div>
          </div>
        ) : (
          policy && <PolicyContent html={policies[policy]} />
        )}
      </div>
    </dialog>
    <MobileStickyBar onShop={onShop} hidden={productOpen || Boolean(policy)} />
    <MotionEffects />
  </ShopContext.Provider>;
}
