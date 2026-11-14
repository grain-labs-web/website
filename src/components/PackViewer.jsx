'use client';
import { useEffect, useRef } from 'react';

export default function PackViewer({onSelect}) {
  const root=useRef(null),canvas=useRef(null),fallback=useRef(null),front=useRef(null),back=useRef(null),reset=useRef(null),status=useRef(null),selectRef=useRef(onSelect);
  selectRef.current=onSelect;
  useEffect(()=>{
    const controller=new AbortController();let started=false;
    const observer=new IntersectionObserver(async entries=>{
      if(started||!entries.some(e=>e.isIntersecting))return;started=true;observer.disconnect();
      try{
        const {initPackViewer}=await import('../lib/pack-viewer');
        if(!controller.signal.aborted)await initPackViewer({canvas:canvas.current,fallback:fallback.current,front:front.current,back:back.current,reset:reset.current,status:status.current,onSelect:()=>selectRef.current(),signal:controller.signal});
      }catch{if(!controller.signal.aborted)status.current.textContent='Front & back views';}
    },{rootMargin:'150px'});observer.observe(root.current);
    return()=>{observer.disconnect();controller.abort();};
  },[]);
  return <>
    <div ref={root} className="pack-viewer" id="pack-viewer">
      <div ref={fallback} className="pack-fallback" onClick={onSelect}><div className="artwork-crop front-art"><img src="/assets/packaging-alternate.png" width="578" height="1280" alt="Grain Labs Women's Oats, rich chocolate, front packaging artwork" fetchPriority="high" /></div></div>
      <canvas ref={canvas} tabIndex={0} role="img" aria-label="Interactive 3D Grain Labs packet. Drag to rotate, or use arrow keys." aria-describedby="pack-status" hidden />
      <div className="pack-shadow" aria-hidden="true" /><div className="pack-pedestal" aria-hidden="true" /><span className="oat-confetti oat-one" aria-hidden="true" /><span className="oat-confetti oat-two" aria-hidden="true" /><span className="chocolate-confetti" aria-hidden="true" />
    </div>
    <div className="pack-toolbar"><div role="group" aria-label="Package view">
      <button ref={front} aria-label="View front of packet" title="View front" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14l1 18H4L5 3Z M5 6h14 M8 12h8 M8 16h5" /></svg><span>The pack</span></button>
      <button ref={back} aria-label="View back of packet" title="View back" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14l1 18H4L5 3Z M5 6h14 M8 10h8 M8 13h8 M8 16h8" /></svg><span>The label</span></button>
      <button ref={reset} aria-label="Reset packet rotation" title="Reset view"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8 M4 4v6h6" /></svg></button>
    </div><span ref={status} id="pack-status" className="sr-only" role="status">Front of the pack</span></div>
  </>;
}
