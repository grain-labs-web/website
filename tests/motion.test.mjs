import test from 'node:test';
import assert from 'node:assert/strict';
import {initMotion,shouldPlayMarquee} from '../src/lib/motion.js';
test('reduced motion, hidden pages and explicit pause stop the breakfast banner',()=>{
 const normal={visible:true,paused:false,reduced:false,hidden:false};assert.equal(shouldPlayMarquee(normal),true);
 for(const [key,value] of [['visible',false],['paused',true],['reduced',true],['hidden',true]])assert.equal(shouldPlayMarquee({...normal,[key]:value}),false);
});
test('entrance motion respects reduced motion and cleans up effects and observers on unmount',()=>{
 let callback,disconnected=false;const effects=[],listeners=new Map();
 const media={matches:true,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const element={animate(){const handlers={};const effect={cancelled:false,addEventListener:(name,fn)=>handlers[name]=fn,cancel(){this.cancelled=true;handlers.cancel?.();}};effects.push(effect);return effect;}};
 const root={hidden:false,querySelectorAll:()=>[element],addEventListener(){},removeEventListener(){}};
 const oldWindow=globalThis.window,oldObserver=globalThis.IntersectionObserver;
 globalThis.window={matchMedia:()=>media};globalThis.IntersectionObserver=class{constructor(fn){callback=fn;}observe(){}unobserve(){}disconnect(){disconnected=true;}};
 try{const cleanup=initMotion(root);callback([{isIntersecting:true,target:element}]);assert.equal(effects.length,0);media.matches=false;callback([{isIntersecting:true,target:element}]);assert.equal(effects.length,1);media.matches=true;listeners.get('change')();assert.equal(effects[0].cancelled,true);media.matches=false;callback([{isIntersecting:true,target:element}]);cleanup();assert.equal(effects[1].cancelled,true);assert.equal(disconnected,true);assert.equal(listeners.size,0);}finally{globalThis.window=oldWindow;globalThis.IntersectionObserver=oldObserver;}
});
