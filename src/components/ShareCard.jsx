"use client";
import {useEffect,useRef,useState} from 'react';
import {useModal,backdropClose} from './useModal';
import {prepareBrandMark} from '../lib/brand';
import {drawCard} from '../lib/breakfast-art';
import {recipeHash} from '../lib/recipe';
export default function ShareCard({open,onClose,selected,name,format,onShop}){
 const dialogRef=useRef(null),canvasRef=useRef(null),dataRef=useRef(null);
 const [ready,setReady]=useState(false),[canShare,setCanShare]=useState(false),[status,setStatus]=useState(''),[copyFallback,setCopyFallback]=useState('');
 useModal(dialogRef,open);
 useEffect(()=>{
  if(!open)return;let cancelled=false,url;
  setReady(false);setStatus('');setCopyFallback('');dataRef.current=null;
  (async()=>{
   try{
    const mark=await prepareBrandMark();
    try{await document.fonts.load('800 72px Outfit');}catch{}
    if(cancelled)return;drawCard(canvasRef.current,selected,name,format,mark);
    const blob=await new Promise(resolve=>canvasRef.current.toBlob(resolve,'image/png'));
    if(cancelled)return;if(!blob)throw new Error('Your card could not be created. Please close this window and retry.');
    const file=new File([blob],'my-grain-labs-breakfast.png',{type:'image/png'});url=URL.createObjectURL(blob);dataRef.current={file,url};
    setCanShare(Boolean(navigator.share&&navigator.canShare?.({files:[file]})));setReady(true);
   }catch(error){if(!cancelled)setStatus(error.message);}
  })();
  return()=>{cancelled=true;dataRef.current=null;if(url)URL.revokeObjectURL(url);};
 },[open,selected,name,format]);
 function recipeLink(){const url=new URL(location.href);url.hash=recipeHash(selected);return url.href;}
 function downloadCard(){if(!dataRef.current)return;const a=document.createElement('a');a.href=dataRef.current.url;a.download='my-grain-labs-breakfast.png';a.click();setStatus('Your download was requested. Check your browser downloads.');}
 async function nativeShare(){if(!dataRef.current)return;try{await navigator.share({files:[dataRef.current.file]});setStatus('Card handed to your share app.');}catch(error){if(error.name!=='AbortError')setStatus('Sharing is unavailable here. You can still download your card.');}}
 async function copyLink(){const url=recipeLink();try{await navigator.clipboard.writeText(url);setStatus('Recipe link copied.');}catch{setStatus('Copy this recipe link:');setCopyFallback(url);}}
 function social(platform){const url=recipeLink();const targets={whatsapp:'https://wa.me/?text='+encodeURIComponent('My Grain Labs breakfast mix ✳ '+url),facebook:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url),x:'https://twitter.com/intent/tweet?text='+encodeURIComponent('My morning. My way. ✳ Make My Oats')+'&url='+encodeURIComponent(url)};window.open(targets[platform],'_blank','noopener,noreferrer');setStatus('Share the recipe link in the app that opened. For the image, use download or native sharing.');}
 function instagram(){if(canShare)nativeShare();else{downloadCard();setStatus('Download your card, then add it to an Instagram Story or post.');}}
 return (
<dialog id="share-dialog" className="share-dialog" aria-labelledby="share-title" ref={dialogRef} onCancel={onClose} onClose={onClose} onClick={e => backdropClose(e,onClose)}><button className="close" aria-label="Close breakfast card" onClick={onClose}>×</button><div><p className="eyebrow">A LITTLE BREAKFAST BRAG</p><h2 id="share-title">Made by you.<br /><span>Shared with love.</span></h2><p>Your name. Your mix. Your morning.</p><button id="native-share" className="button" disabled={!ready || !canShare} onClick={nativeShare}>{!ready ? "Preparing your card…" : canShare ? "Share my breakfast ↗" : "Use download or copy link"}</button><button id="download" className="button secondary" disabled={!ready} onClick={downloadCard}>Download image ↓</button><div className="social-share" aria-label="Share your breakfast"><button id="share-whatsapp" aria-label="Share recipe on WhatsApp" onClick={() => social("whatsapp")}><span className="social-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.4L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.6Z" fill="none" stroke="currentColor" strokeWidth="1.7"></path><path d="M8.2 7.1c-.3 0-1.4.7-1.3 2.2.1 2.8 3.2 5.7 6 6.4 1.3.3 2.7-.3 3-1.3l.1-.8-2.5-1.2-.9 1c-1.5-.5-2.7-1.6-3.3-3.1l.7-.9-.9-2.3Z" fill="currentColor"></path></svg></span><span>WhatsApp<small>Share recipe</small></span><span className="social-arrow" aria-hidden="true">↗</span></button><button id="share-instagram" aria-label="Prepare breakfast image for Instagram" onClick={instagram}><span className="social-icon"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg></span><span>Instagram<small>Image / Story</small></span><span className="social-arrow" aria-hidden="true">↗</span></button><button id="share-facebook" aria-label="Share recipe on Facebook" onClick={() => social("facebook")}><span className="social-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.5c-.7-.1-1.8-.3-3-.3-3 0-5 1.8-5 5.2V9H7v4h3v9Z"></path></svg></span><span>Facebook<small>Share recipe</small></span><span className="social-arrow" aria-hidden="true">↗</span></button><button id="share-x" aria-label="Share recipe on X" onClick={() => social("x")}><span className="social-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.4L.8 2h6.5l4.4 6.6L18.9 2Zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20Z"></path></svg></span><span>X<small>Share recipe</small></span><span className="social-arrow" aria-hidden="true">↗</span></button></div><button id="copy-link" className="text-link" onClick={copyLink}>Copy recipe link ↗</button><p id="share-status" role="status">{status}{copyFallback && <input readOnly aria-label="Recipe link to copy" value={copyFallback} onFocus={e=>e.target.select()} />}</p><p className="reference-note">Your recipe link includes your toppings. Your name stays on your card, off the link.</p><button className="text-link" onClick={onShop}>Love the base? Buy chocolate oats ↗</button></div><canvas id="share-card" width="1080" height="1350" role="img" aria-label="Personalised breakfast recipe card" ref={canvasRef}></canvas></dialog>);}
