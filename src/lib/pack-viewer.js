// Small procedural 3D pouch. Geometry is approximate; labels use unchanged supplied artwork.
// Draws only after user input / resize, with no animation loop or external rendering library.
export async function initPackViewer({ canvas, fallback, status, front, back, reset, onSelect, signal }) {
  if(signal?.aborted)return;
  const cleanups=[];
  const listen=(element,type,handler)=>{element.addEventListener(type,handler,signal?{signal}:undefined);};
  signal?.addEventListener('abort',()=>{for(const cleanup of cleanups)cleanup();front.onclick=back.onclick=reset.onclick=null;},{once:true});
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  const staticView = isBack => {
    fallback.hidden = false; canvas.hidden = true;
    fallback.querySelector('.artwork-crop').className = `artwork-crop ${isBack ? 'back-art' : 'front-art'}`;
    fallback.querySelector('img').alt = `Grain Labs Women's Oats ${isBack ? 'back' : 'front'} packaging artwork`;
    front.setAttribute('aria-pressed', String(!isBack)); back.setAttribute('aria-pressed', String(isBack));
  };
  const installFallback = () => {
    status.textContent = 'Front & back views';
    front.onclick = () => staticView(false); back.onclick = () => staticView(true); reset.onclick = () => staticView(false);
    staticView(false);
  };
  if (!gl) { installFallback(); return; }
  const vertex = `
    attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV; attribute float aType;
    uniform vec2 uRotation; uniform float uAspect; uniform float uZoom;
    varying vec2 vUV; varying vec3 vNormal; varying float vType;
    vec3 rotate(vec3 p) {
      float c=cos(uRotation.x), s=sin(uRotation.x), d=cos(uRotation.y), t=sin(uRotation.y);
      p=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
      return vec3(p.x,d*p.y-t*p.z,t*p.y+d*p.z);
    }
    void main() {
      vec3 p=rotate(aPosition); p.z-=5.8;
      gl_Position=vec4(p.x*uZoom/uAspect,p.y*uZoom, -1.105263*p.z-2.105263,-p.z);
      vUV=aUV;vNormal=rotate(aNormal);vType=aType;
    }`;
  const fragment = `
    precision mediump float; varying vec2 vUV; varying vec3 vNormal; varying float vType;
    uniform sampler2D uFront; uniform sampler2D uBack;
    void main() {
      vec3 n=normalize(vNormal);
      vec3 color=vec3(.92,.886,.79);
      if(vType>.5) color=vType<1.5?texture2D(uFront,vUV).rgb:texture2D(uBack,vec2(1.-vUV.x,vUV.y)).rgb;
      float diffuse=.78+.22*max(dot(n,normalize(vec3(-.8,.9,1.5))),0.);
      float sheen=.035*pow(max(dot(n,normalize(vec3(-.3,.5,1.))),0.),32.);
      gl_FragColor=vec4(color*diffuse+sheen,1.);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
    return shader;
  }
  try {
    const program = gl.createProgram(); const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Renderer unavailable');
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
    const image = new Image(); image.src='/assets/packaging-alternate.png'; await image.decode();
    if(signal?.aborted){gl.deleteProgram(program);return;}
    cleanups.push(()=>gl.deleteProgram(program));
    const makeTexture=(y,slot,name)=>{
      const crop=document.createElement('canvas');crop.width=1024;crop.height=768;
      crop.getContext('2d').drawImage(image,0,y,578,413,0,0,1024,768);
      const texture=gl.createTexture();cleanups.push(()=>gl.deleteTexture(texture));gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,crop);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.uniform1i(gl.getUniformLocation(program,name),slot);
    };
    makeTexture(150,0,'uFront');makeTexture(590,1,'uBack');
    const vertices=[];
    function triangle(a,b,c,type){
      const u=b.slice(0,3).map((n,i)=>n-a[i]),v=c.slice(0,3).map((n,i)=>n-a[i]);
      const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const length=Math.hypot(...n)||1; const normal=n.map(x=>x/length);
      for(const p of [a,b,c]){
        // Smooth the printed face without smoothing the welded edge strips.
        let surfaceNormal=normal;
        if(type===1||type===2){
          const sign=type===1?1:-1,step=.001;
          const left=point(Math.max(0,p[3]-step),p[4],sign),right=point(Math.min(1,p[3]+step),p[4],sign);
          const up=point(p[3],Math.max(0,p[4]-step),sign),down=point(p[3],Math.min(1,p[4]+step),sign);
          const du=right.slice(0,3).map((x,i)=>x-left[i]),dv=down.slice(0,3).map((x,i)=>x-up[i]);
          const n=[dv[1]*du[2]-dv[2]*du[1],dv[2]*du[0]-dv[0]*du[2],dv[0]*du[1]-dv[1]*du[0]];
          const length=Math.hypot(...n)||1;surfaceNormal=n.map(x=>sign*x/length);
        }
        vertices.push(...p.slice(0,3),...surfaceNormal,...p.slice(3),type);
      }
    }
    const point=(u,v,sign)=>{
      // Filled stand-up pouch: narrow heat-sealed neck, inflated shoulders,
      // softer side seams and a thick flat bottom gusset, rather than a flat card.
      const taper=1-.055*v+.018*Math.sin(v*Math.PI);
      const shoulder=Math.sin(Math.min(1,v*4)*Math.PI/2);
      const center=Math.pow(Math.max(0,Math.sin(u*Math.PI)),.8);
      const bulge=.022+shoulder*(.065+.38*center)*(1-.18*v);
      const crease=.009*Math.sin(u*8*Math.PI)*Math.pow(v,5);
      const corner=.07*Math.pow(Math.abs(u-.5)*2,10)*Math.pow(v,8);
      return [(u-.5)*2.85*taper,(.5-v)*2.15+corner,sign*(bulge+crease),u,v];
    };
    const nx=30,ny=32;
    for(const sign of [1,-1])for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      const a=point(i/nx,j/ny,sign),b=point(i/nx,(j+1)/ny,sign),c=point((i+1)/nx,j/ny,sign),d=point((i+1)/nx,(j+1)/ny,sign);
      if(sign===1){triangle(a,b,c,1);triangle(b,d,c,1);}else{triangle(a,c,b,2);triangle(b,c,d,2);}
    }
    // Close the pouch edges and add a cream heat-seal strip above the artwork.
    for(let i=0;i<nx;i++)for(const v of [0,1]){
      const a=point(i/nx,v,1),b=point((i+1)/nx,v,1),c=point(i/nx,v,-1),d=point((i+1)/nx,v,-1);
      triangle(a,b,c,0);triangle(c,b,d,0);
    }
    for(let j=0;j<ny;j++)for(const u of [0,1]){
      const a=point(u,j/ny,1),b=point(u,(j+1)/ny,1),c=point(u,j/ny,-1),d=point(u,(j+1)/ny,-1);
      triangle(a,c,b,0);triangle(c,d,b,0);
    }
    // Wide welded top lip with a separate zipper ridge and visible seam thickness.
    function seal(y0,y1,width,depth){
      for(const sign of [1,-1]){
        const a=[-width,y0,sign*depth,0,0],b=[width,y0,sign*depth,0,0],c=[-width,y1,sign*depth,0,0],d=[width,y1,sign*depth,0,0];
        if(sign===1){triangle(a,b,c,0);triangle(b,d,c,0);}else{triangle(a,c,b,0);triangle(b,c,d,0);}
      }
      for(const x of [-width,width]){const a=[x,y0,depth,0,0],b=[x,y1,depth,0,0],c=[x,y0,-depth,0,0],d=[x,y1,-depth,0,0];triangle(a,c,b,0);triangle(c,d,b,0);}
      const a=[-width,y1,depth,0,0],b=[width,y1,depth,0,0],c=[-width,y1,-depth,0,0],d=[width,y1,-depth,0,0];triangle(a,b,c,0);triangle(c,b,d,0);
    }
    seal(1.075,1.19,1.425,.024);
    // Thin pressed welds and the zipper are part of the geometry, not painted text.
    seal(1.09,1.104,1.415,.03);seal(1.13,1.144,1.415,.032);seal(1.17,1.179,1.415,.03);
    const buffer=gl.createBuffer();cleanups.push(()=>gl.deleteBuffer(buffer));gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aUV',2,6],['aType',1,8]]){
      const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,36,offset*4);
    }
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
    let yaw=-.42,pitch=-.08,lost=false;
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');let rotationFrame=0;
    const rotation=gl.getUniformLocation(program,'uRotation'),aspect=gl.getUniformLocation(program,'uAspect'),zoom=gl.getUniformLocation(program,'uZoom');
    function draw(){
      if(lost)return;
      const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.75);
      const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.uniform2f(rotation,yaw,pitch);gl.uniform1f(aspect,w/h);gl.uniform1f(zoom,3.65);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);
      const frontFacing=Math.cos(yaw)>=0;
      const description=frontFacing?'Front of the pack':'Back of the pack';
      if(status.textContent!==description)status.textContent=description;
      front.setAttribute('aria-pressed',String(frontFacing));back.setAttribute('aria-pressed',String(!frontFacing));
      canvas.setAttribute('aria-label',`3D Grain Labs packet, ${frontFacing?'front':'back'} facing. Drag or use arrow keys to rotate.`);
    }
    function rotateTo(targetYaw,targetPitch,label){
      cancelAnimationFrame(rotationFrame);rotationFrame=0;
      const endYaw=yaw+Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw)),startYaw=yaw,startPitch=pitch;
      if(reducedMotion.matches){yaw=endYaw;pitch=targetPitch;draw();status.textContent=label;return;}
      const started=performance.now();
      function frame(now){const progress=Math.min(1,(now-started)/620),ease=1-Math.pow(1-progress,4);yaw=startYaw+(endYaw-startYaw)*ease;pitch=startPitch+(targetPitch-startPitch)*ease;draw();if(progress<1&&!document.hidden)rotationFrame=requestAnimationFrame(frame);else{rotationFrame=0;yaw=endYaw;pitch=targetPitch;draw();status.textContent=label;}}
      rotationFrame=requestAnimationFrame(frame);
    }
    front.onclick=()=>rotateTo(0,0,'Front of the pack');
    back.onclick=()=>rotateTo(Math.PI,0,'Back of the pack');
    reset.onclick=()=>rotateTo(-.42,-.08,'Drag to discover ↔');
    let pointer=null,previous=null,start=null;
    listen(canvas,'pointerdown',event=>{if(!event.isPrimary)return;cancelAnimationFrame(rotationFrame);rotationFrame=0;pointer=event.pointerId;previous=[event.clientX,event.clientY];start=previous;canvas.setPointerCapture(pointer);});
    listen(canvas,'pointermove',event=>{if(pointer!==event.pointerId||!previous)return;yaw+=(event.clientX-previous[0])*.012;pitch=Math.max(-.65,Math.min(.65,pitch+(event.clientY-previous[1])*.007));previous=[event.clientX,event.clientY];draw();});
    const release=()=>{pointer=null;previous=null;start=null;};listen(canvas,'pointerup',event=>{if(start && Math.hypot(event.clientX-start[0],event.clientY-start[1])<6)onSelect?.();release();});listen(canvas,'pointercancel',release);listen(canvas,'lostpointercapture',release);
    listen(canvas,'keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect?.();return;}
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();
      cancelAnimationFrame(rotationFrame);rotationFrame=0;
      if(event.key==='ArrowLeft')yaw-=.2;if(event.key==='ArrowRight')yaw+=.2;
      if(event.key==='ArrowUp')pitch=Math.max(-.65,pitch-.1);if(event.key==='ArrowDown')pitch=Math.min(.65,pitch+.1);
      if(event.key==='Home'){yaw=-.42;pitch=-.08;}draw();
    });
    listen(reducedMotion,'change',()=>{cancelAnimationFrame(rotationFrame);rotationFrame=0;draw();});
    listen(canvas,'webglcontextlost',event=>{event.preventDefault();cancelAnimationFrame(rotationFrame);rotationFrame=0;lost=true;installFallback();});
    const observer=new ResizeObserver(draw);observer.observe(canvas);cleanups.push(()=>{lost=true;cancelAnimationFrame(rotationFrame);observer.disconnect();});
    canvas.hidden=false;fallback.hidden=true;status.textContent='Drag to discover ↔';draw();
    if(gl.getError()!==gl.NO_ERROR)throw new Error('Rendering failed');
  }catch{if(!signal?.aborted)installFallback();}
}
