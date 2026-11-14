'use client';
import { useEffect, useRef, useState } from 'react';
import {shouldPlayMarquee} from '../lib/motion';
export default function Marquee(){
  const ref=useRef(null),[paused,setPaused]=useState(false),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(true),[hidden,setHidden]=useState(false);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)'),sync=()=>setReduced(media.matches),visibility=()=>setHidden(document.hidden);
    sync();visibility();media.addEventListener('change',sync);document.addEventListener('visibilitychange',visibility);
    const observer=new IntersectionObserver(entries=>setVisible(entries[0].isIntersecting));observer.observe(ref.current);
    return()=>{observer.disconnect();media.removeEventListener('change',sync);document.removeEventListener('visibilitychange',visibility);};
  },[]);
  const playing=shouldPlayMarquee({visible,paused,reduced,hidden});
  return <div ref={ref} className={`marquee${playing?' playing':''}`} aria-label="Breakfast your way"><div className="marquee-track">{[0,1].map(i=><div key={i} className="marquee-group" aria-hidden={i===1?true:undefined}><span>Big breakfast mood</span><i aria-hidden="true">✳</i><span>Your bowl, your rules</span><i aria-hidden="true">✳</i><span>Chocolate? Always.</span><i aria-hidden="true">✳</i></div>)}</div><button id="motion-toggle" hidden={reduced} aria-label={paused?'Play moving breakfast text':'Pause moving breakfast text'} onClick={()=>setPaused(p=>!p)}>{paused?'▶':'Ⅱ'}</button></div>;
}
