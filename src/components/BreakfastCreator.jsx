"use client";
import {useEffect,useRef,useState} from 'react';
import {TOPPINGS,normalize,fromHash,recipeHash,bowlName,breakfastTitle,recipeText} from '../lib/recipe';
import {drawBowl} from '../lib/breakfast-art';
import ShareCard from './ShareCard';
export default function BreakfastCreator({onShop}) {
 const [selected,setSelected]=useState(['banana','peanut']),[name,setName]=useState(''),[format,setFormat]=useState('portrait'),[shareOpen,setShareOpen]=useState(false);
 const bowlRef=useRef(null);
 const names=TOPPINGS.filter(t=>selected.includes(t.id)).map(t=>t.name).join(', ');
 useEffect(()=>{
  const restore=()=>{const incoming=fromHash(location.hash);if(incoming!==null)setSelected(incoming);};restore();
  if(fromHash(location.hash)!==null)document.getElementById('make-my-oats')?.scrollIntoView({behavior:'instant',block:'start'});
  window.addEventListener('hashchange',restore);return()=>window.removeEventListener('hashchange',restore);
 },[]);
 useEffect(()=>{
  const canvas=bowlRef.current;drawBowl(canvas.getContext('2d'),selected);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const effect=canvas.animate([
      {transform:'scale(0.96) rotate(-1.5deg)'},
      {transform:'scale(1.02) rotate(0.8deg)',offset:0.6},
      {transform:'none'}
    ],{duration:420,easing:'cubic-bezier(0.34, 1.56, 0.64, 1)'});
    return()=>effect.cancel();
  }
 },[selected]);
 function choose(ids){const next=normalize(ids);setSelected(next);history.replaceState(null,'',recipeHash(next));}
 function surprise(){const choices=[...TOPPINGS];for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}choose(choices.slice(0,2+Math.floor(Math.random()*2)).map(t=>t.id));}
 return (<>
<section className="creator section" id="make-my-oats">
<div className="section-heading"><p className="eyebrow">MAKE MY OATS</p><span className="free-tag">NO RULES. JUST GOOD TASTE.</span></div>
<div className="creator-top"><h2>A bowl with<br /><span>your name on it.</span></h2><p>Pick your toppings. Give it a name.<br />Make a little breakfast worth sharing.</p></div>
<div className="creator-layout">
<div className="bowl-stage"><span className="stage-note">TODAY’S BREAKFAST PERSONALITY</span><canvas id="bowl" width="800" height="800" role="img" aria-label={"Illustrated chocolate oats bowl" + (selected.length ? " with " + names : ", without toppings")} ref={bowlRef}></canvas><div className="bowl-caption"><span id="bowl-mood">{bowlName(selected)}</span><h3 id="bowl-name">{breakfastTitle(name)}</h3></div><span className="illustration-note">A PLAYFUL ILLUSTRATION OF YOUR MIX</span></div>
<div className="topping-panel">
<label className="name-label" htmlFor="chef-name">First, who’s having breakfast? <span>(optional)</span></label><input id="chef-name" placeholder="Your first name, e.g. Kavi" maxLength="24" autoComplete="off" value={name} onChange={e => setName(e.target.value)} />
<div className="panel-heading"><div className="panel-heading-title"><h3>Now, the fun part.</h3><span className="toppings-badge">{selected.length} / {TOPPINGS.length} toppings</span></div><button id="reset" className="text-link" onClick={() => choose([])}>Start fresh ↺</button></div>
<div id="toppings" className="toppings" role="group" aria-label="Choose your toppings">{TOPPINGS.map(t => <button key={t.id} className="topping" aria-pressed={selected.includes(t.id)} onClick={() => choose(selected.includes(t.id) ? selected.filter(id => id !== t.id) : [...selected,t.id])}><span className="topping-icon" aria-hidden="true">{t.icon}</span><span><strong>{t.name}</strong><small>{t.note}</small></span><span className="check" aria-hidden="true">{selected.includes(t.id) ? "✓" : "+"}</span></button>)}</div>
<div className="presets" role="group" aria-label="Try a breakfast combination"><button onClick={() => choose(["banana", "peanut"])} aria-pressed={normalize(["banana", "peanut"]).join(",") === selected.join(",")}>Slow morning</button><button onClick={() => choose(["berries", "strawberries", "coconut"])} aria-pressed={normalize(["berries", "strawberries", "coconut"]).join(",") === selected.join(",")}>Berry happy</button><button onClick={() => choose(["chocolate", "almonds"])} aria-pressed={normalize(["chocolate", "almonds"]).join(",") === selected.join(",")}>Choco crunch</button><button id="surprise" onClick={surprise}>Surprise me ✳</button></div>
<div className="recipe-summary"><p id="recipe-text">{recipeText(selected)}</p><p className="allergen-note">Toppings are suggestions, not included in the pack. Check labels for allergens.</p></div>
<div className="card-format"><label htmlFor="card-format">Card size</label><select id="card-format" value={format} onChange={e => setFormat(e.target.value)}><option value="portrait">Portrait · 4:5</option><option value="square">Square · 1:1</option><option value="story">Story · 9:16</option></select></div>
<div className="creator-actions-row">
  <button id="create-card" className="button" onClick={() => setShareOpen(true)}>Make my breakfast card <span aria-hidden="true">↗</span></button>
  <button id="quick-whatsapp-btn" className="button button-whatsapp-share" aria-label="Share recipe directly on WhatsApp" title="Share recipe on WhatsApp" onClick={() => {
    const url = new URL(location.href);
    url.hash = recipeHash(selected);
    const text = `Check out my Grain Labs breakfast bowl! 🥣✨\n\n${recipeText(selected)}\n\nMake your own mix: ${url.href}`;
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
  }}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.88 7 8.5 7 9.77C7 11.04 7.93 12.27 8.06 12.44C8.2 12.61 9.89 15.22 12.46 16.33C13.07 16.6 13.56 16.76 13.93 16.88C14.54 17.07 15.09 17.04 15.53 16.98C16.02 16.91 17.03 16.37 17.24 15.78C17.45 15.19 17.45 14.68 17.38 14.57C17.32 14.47 17.15 14.41 16.91 14.29C16.66 14.17 15.45 13.58 15.22 13.5C15 13.42 14.83 13.38 14.67 13.62C14.5 13.87 14.03 14.41 13.88 14.57C13.74 14.74 13.6 14.76 13.35 14.64C13.11 14.51 12.32 14.26 11.38 13.43C10.65 12.78 10.15 11.97 10.01 11.73C9.87 11.48 10 11.35 10.12 11.23C10.23 11.12 10.37 10.94 10.49 10.8C10.61 10.66 10.66 10.56 10.74 10.39C10.82 10.23 10.78 10.08 10.72 9.96C10.66 9.84 10.17 8.64 9.97 8.14C9.77 7.66 9.57 7.72 9.42 7.71C9.28 7.71 9.12 7.71 8.95 7.71C8.79 7.71 8.53 7.33 8.53 7.33Z"/>
    </svg>
    <span>Share on WhatsApp</span>
  </button>
</div><p className="share-note">Made by you. Ready for your story.</p>
</div>
</div>
</section><ShareCard open={shareOpen} onClose={()=>setShareOpen(false)} selected={selected} name={name} format={format} onShop={()=>{setShareOpen(false);onShop();}} /></>);}
