export function shouldPlayMarquee({visible,paused,reduced,hidden}){return visible&&!paused&&!reduced&&!hidden;}
export function initMotion(root=document){
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)'),effects=new Set();
  const cancel=()=>{if(preference.matches||root.hidden)for(const effect of effects)effect.cancel();};
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);if(!preference.matches&&!root.hidden){const effect=entry.target.animate([{opacity:.2,transform:'translateY(20px)'},{opacity:1,transform:'none'}],{duration:720,easing:'cubic-bezier(.22,1,.36,1)'});effects.add(effect);const clear=()=>effects.delete(effect);effect.addEventListener('finish',clear,{once:true});effect.addEventListener('cancel',clear,{once:true});}}
  },{threshold:.08});
  root.querySelectorAll('.hero-copy,.food-photo,.food-copy,.creator-top,.vision-layout>*,.ritual-steps article,.final-cta h2').forEach(el=>observer.observe(el));
  preference.addEventListener('change',cancel);root.addEventListener('visibilitychange',cancel);
  return()=>{observer.disconnect();preference.removeEventListener('change',cancel);root.removeEventListener('visibilitychange',cancel);for(const effect of effects)effect.cancel();};
}
