import { TOPPINGS, breakfastTitle, bowlName, recipeText } from './recipe.js';
export function drawBowl(ctx, ids) {
  let seed = 49; const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const oval = (x,y,rx,ry,color,rotation=0) => { ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2); ctx.fillStyle=color;ctx.fill(); };
  ctx.save();ctx.clearRect(0,0,800,800);
  ctx.shadowColor='#4b2e202b';ctx.shadowBlur=38;ctx.shadowOffsetY=25;
  oval(400,382,287,280,'#e9dfce');ctx.shadowColor='transparent';
  const rim = ctx.createRadialGradient(350,290,180,400,380,286);rim.addColorStop(0,'#fffaf0');rim.addColorStop(.82,'#fffaf0');rim.addColorStop(.94,'#d9cbb6');rim.addColorStop(1,'#f8f1e5');
  oval(400,378,281,275,rim);oval(400,378,250,245,'#68412e');
  ctx.save();ctx.beginPath();ctx.ellipse(400,378,244,239,0,0,Math.PI*2);ctx.clip();
  for(let i=0;i<1350;i++){const x=155+rand()*490,y=137+rand()*485;oval(x,y,2+rand()*7,2+rand()*3,['#895b3c','#ac7d52','#613a29','#bd9368','#754a32'][Math.floor(rand()*5)],rand()*Math.PI);}
  if(ids.includes('peanut')){
    ctx.lineCap='round';ctx.strokeStyle='#b9884c';ctx.lineWidth=45;ctx.beginPath();ctx.moveTo(275,455);ctx.bezierCurveTo(180,375,365,365,280,305);ctx.bezierCurveTo(210,245,425,245,350,205);ctx.stroke();
    ctx.strokeStyle='#d0a76d';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(275,445);ctx.bezierCurveTo(202,375,367,366,284,303);ctx.bezierCurveTo(250,265,370,250,350,220);ctx.stroke();
  }
  if(ids.includes('banana'))for(let i=0;i<6;i++){const x=375+i*25,y=265+i*41;ctx.shadowColor='#321b1544';ctx.shadowBlur=6;ctx.shadowOffsetY=4;oval(x,y,43,34,'#d6b969',-.4);ctx.shadowColor='transparent';oval(x-1,y-3,38,30,'#f5e1a3',-.4);oval(x-3,y-4,29,23,'#efdc9f',-.4);for(let j=0;j<5;j++){const a=j*1.256;oval(x-4+Math.cos(a)*9,y-4+Math.sin(a)*7,3,1.5,'#ab8752',a);}}
  if(ids.includes('berries'))for(let i=0;i<26;i++){const x=258+rand()*105,y=340+rand()*170;ctx.shadowColor='#20192766';ctx.shadowBlur=4;ctx.shadowOffsetY=3;oval(x,y,14+rand()*3,14+rand()*3,'#343647');ctx.shadowColor='transparent';oval(x-4,y-4,7,6,'#606278');oval(x,y,4,3,'#252633');}
  if(ids.includes('almonds'))for(let i=0;i<22;i++){const x=380+rand()*110,y=480+rand()*70,a=rand()*3;oval(x,y,18,7,'#ac753f',a);oval(x,y-2,15,4,'#e2be8b',a);}
  if(ids.includes('chocolate'))for(let i=0;i<30;i++){const x=460+rand()*130,y=300+rand()*200;ctx.save();ctx.translate(x,y);ctx.rotate(rand()*6);ctx.fillStyle='#352019';ctx.beginPath();ctx.moveTo(-10,8);ctx.lineTo(0,-10);ctx.lineTo(10,8);ctx.closePath();ctx.fill();ctx.fillStyle='#714836';ctx.fillRect(-3,0,6,5);ctx.restore();}
  if(ids.includes('seeds'))for(let i=0;i<85;i++){const x=245+rand()*290,y=210+rand()*320;oval(x,y,3,1.8,i%2?'#c3b09a':'#332b23',rand()*5);}
  if(ids.includes('strawberries'))for(let i=0;i<7;i++){const x=430+rand()*85,y=270+rand()*120;ctx.save();ctx.translate(x,y);ctx.rotate(-.5+rand());ctx.fillStyle='#bd354c';ctx.beginPath();ctx.moveTo(0,25);ctx.bezierCurveTo(-32,-6,-20,-28,0,-14);ctx.bezierCurveTo(22,-28,33,-4,0,25);ctx.fill();ctx.fillStyle='#efb686';for(let j=0;j<9;j++){const a=rand()*Math.PI*2,r=rand()*13;oval(Math.cos(a)*r,Math.sin(a)*r,1.2,2,'#efb686');}ctx.restore();}
  if(ids.includes('coconut'))for(let i=0;i<36;i++){const x=270+rand()*190,y=390+rand()*145;ctx.save();ctx.translate(x,y);ctx.rotate(rand()*4);ctx.fillStyle='#fff3d9';ctx.beginPath();ctx.moveTo(-9,-4);ctx.lineTo(9,-6);ctx.lineTo(6,5);ctx.lineTo(-7,3);ctx.fill();ctx.restore();}
  ctx.restore();ctx.restore();
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line='';for(const word of text.split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth && line){ctx.fillText(line,x,y);y+=lineHeight;line=word;}else{line=next;}}ctx.fillText(line,x,y);return y;
}
export function drawCard(canvas, ids, name, format, brandMark) {
  canvas.width=1080;canvas.height={square:1080,portrait:1350,story:1920}[format] || 1350;
  const h=canvas.height,ctx=canvas.getContext('2d'),square=format==='square',story=format==='story';
  ctx.fillStyle='#f7edda';ctx.fillRect(0,0,1080,h);
  ctx.fillStyle='#f7dce6';ctx.beginPath();ctx.ellipse(540,story?975:square?530:665,480,story?630:square?365:480,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ad175e';ctx.textAlign='left';ctx.font='800 60px Outfit, Arial';if(brandMark)ctx.drawImage(brandMark,60,48,340,63);else ctx.fillText('Grain Labs',60,104);
  ctx.textAlign='right';ctx.font='600 20px Outfit, Arial';ctx.fillText('MAKE MY OATS',1020,94);
  ctx.strokeStyle='#ad175e33';ctx.beginPath();ctx.moveTo(60,132);ctx.lineTo(1020,132);ctx.stroke();
  ctx.textAlign='center';ctx.fillStyle='#ad175e';const title=breakfastTitle(name);let fontSize=story?88:72;ctx.font=`800 ${fontSize}px Outfit, Arial`;
  while(ctx.measureText(title).width>940 && fontSize>34){fontSize-=2;ctx.font=`800 ${fontSize}px Outfit, Arial`;}
  ctx.fillText(title,540,story?285:220);ctx.font='500 25px Outfit, Arial';ctx.fillStyle='#4b2e20';ctx.fillText(bowlName(ids),540,story?335:265);
  const temp=document.createElement('canvas');temp.width=temp.height=800;drawBowl(temp.getContext('2d'),ids);
  const bowlSize=square?610:story?1050:820,bowlY=square?235:story?420:285;ctx.drawImage(temp,(1080-bowlSize)/2,bowlY,bowlSize,bowlSize);
  ctx.save();ctx.translate(920,story?510:square?360:395);ctx.rotate(.15);ctx.fillStyle='#ee582b';ctx.beginPath();ctx.arc(0,0,76,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff9ef';ctx.font='700 20px Outfit, Arial';ctx.fillText('YOUR BOWL.',0,-5);ctx.fillText('YOUR RULES.',0,22);ctx.restore();
  const ingredientsY=square?827:story?1505:1085;
  ctx.fillStyle='#ad175e';ctx.font='700 18px Outfit, Arial';ctx.fillText('MY FINISHING TOUCHES',540,ingredientsY-40);
  ctx.fillStyle='#4b2e20';ctx.font='600 28px Outfit, Arial';
  const toppings=TOPPINGS.filter(t=>ids.includes(t.id)).map(t=>t.name).join(' · ') || 'Keeping it chocolate. Keeping it simple.';
  wrapText(ctx,toppings,540,ingredientsY,910,38);
  const prepY=square?945:story?1690:1210;
  ctx.font='500 22px Outfit, Arial';ctx.fillText('PREPARE YOUR OATS  →  ADD YOUR TOPPINGS  →  ENJOY',540,prepY);
  ctx.font='400 17px Outfit, Arial';ctx.fillStyle='#805b65';ctx.fillText('Follow your pack instructions. Toppings are not included.',540,prepY+32);
  ctx.fillStyle='#ad175e';ctx.fillRect(0,h-70,1080,70);ctx.fillStyle='#fff9ef';ctx.font='700 21px Outfit, Arial';ctx.fillText('YOUR MORNING. YOUR WAY.  ✳  GRAIN LABS',540,h-27);
  canvas.setAttribute('aria-label',`${title}. ${bowlName(ids)}. ${recipeText(ids)}`);
}
