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
  <button id="quick-whatsapp-btn" className="button secondary button-whatsapp" aria-label="Share recipe directly on WhatsApp" title="Share recipe on WhatsApp" onClick={() => {
    const url = new URL(location.href);
    url.hash = recipeHash(selected);
    window.open('https://wa.me/?text=' + encodeURIComponent('Check out my custom Grain Labs breakfast bowl: ' + url.href), '_blank', 'noopener,noreferrer');
  }}><span>💬</span> WhatsApp ↗</button>
</div><p className="share-note">Made by you. Ready for your story.</p>
</div>
</div>
</section><ShareCard open={shareOpen} onClose={()=>setShareOpen(false)} selected={selected} name={name} format={format} onShop={()=>{setShareOpen(false);onShop();}} /></>);}
