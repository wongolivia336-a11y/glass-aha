/**
 * GLASS AHA / Peripheral Optics
 * A separate UI-optics system; it never touches #glass, its WebGL context, or
 * the brush/scene state. Architecture: shared source -> local crop -> rounded
 * signed-distance field -> refraction/glint -> transparent DOM-hosted surface.
 */
const backdrop = document.querySelector('#ambientBackdrop');
const sceneButtons = [...document.querySelectorAll('[data-chapter]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)');
const noGlass = new URLSearchParams(location.search).has('no-optics');
const background = backdrop.getContext('2d', { alpha:false });
const instances = [];
let sceneIndex = 0;
let raf = 0;
let lastFrame = 0;
let needsSampling = true;
let destroyed = false;

const palette = [
  { base:'#eaf2fc', top:'#f5faff', a:'#d1e5ff', b:'#c8d6f4', c:'#ccecf0', line:'rgba(81,128,188,.17)' },
  { base:'#ebf2fd', top:'#f6f9ff', a:'#d9ddfc', b:'#c3d8f6', c:'#d1e9f5', line:'rgba(110,126,187,.17)' },
  { base:'#e6f0fb', top:'#f3f8ff', a:'#c3d7fa', b:'#c7d2e8', c:'#a6d9ec', line:'rgba(61,107,171,.17)' }
];

function stampAmbient(){
  const w=window.innerWidth, h=window.innerHeight;
  const dpr=Math.min(window.devicePixelRatio||1,1.4);
  backdrop.width=Math.max(1,Math.round(w*dpr));
  backdrop.height=Math.max(1,Math.round(h*dpr));
  backdrop.style.width=`${w}px`;
  backdrop.style.height=`${h}px`;
  background.setTransform(dpr,0,0,dpr,0,0);
  const p=palette[sceneIndex];
  background.fillStyle=p.base;background.fillRect(0,0,w,h);
  const vertical=background.createLinearGradient(0,0,0,h);
  vertical.addColorStop(0,p.top);vertical.addColorStop(1,p.base);
  background.fillStyle=vertical;background.fillRect(0,0,w,h);
  const glow=(x,y,rx,ry,color,alpha)=>{
    background.save();background.translate(x,y);background.scale(rx,ry);
    const g=background.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,color);g.addColorStop(1,'rgba(255,255,255,0)');
    background.globalAlpha=alpha;background.fillStyle=g;
    background.beginPath();background.arc(0,0,1,0,Math.PI*2);background.fill();background.restore();
  };
  glow(w*.79,h*.20,w*.5,h*.52,p.a,.64);
  glow(w*.12,h*.76,w*.48,h*.55,p.c,.59);
  glow(w*.54,h*.88,w*.59,h*.42,p.b,.48);
  // Architectural caustic lines are drawn in the same source the glass samples.
  background.save();background.lineWidth=.85;background.strokeStyle=p.line;
  for(let i=0;i<6;i++){
    const k=i/5;
    background.beginPath();
    background.moveTo(w*(.02+k*.12),-80);
    background.bezierCurveTo(w*(.45+k*.07),h*.28,w*(.14+k*.1),h*.64,w*(.32+k*.13),h+110);
    background.stroke();
  }
  background.strokeStyle='rgba(255,255,255,.22)';
  for(let i=0;i<4;i++){
    background.beginPath();
    background.ellipse(w*(.85-i*.065),h*(.62+i*.08),w*(.26+i*.04),h*(.38+i*.08),-.44,0,Math.PI*2);
    background.stroke();
  }
  background.restore();
  // Deliberately restrained micrograin: stable, not animated noise.
  let seed=3876;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<Math.min(3000,w*h/280);i++){
    background.fillStyle=i%2?'rgba(255,255,255,.21)':'rgba(73,111,172,.045)';
    background.fillRect(random()*w,random()*h,.45+random()*.65,.45+random()*.65);
  }
  needsSampling=true;
}

const vertexSource=`#version 300 es
in vec2 aPosition;out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const fragmentSource=`#version 300 es
precision highp float;
in vec2 vUv;out vec4 outColor;
uniform sampler2D uBackdrop;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform float uTime;
uniform float uHover;
uniform float uRadius;
uniform float uRefract;
uniform float uShine;
uniform float uWave;
uniform float uOpacity;
float sdRoundBox(vec2 p,vec2 b,float r){
  vec2 q=abs(p)-b+r;
  return length(max(q,0.))+min(max(q.x,q.y),0.)-r;
}
float gaussian(float x,float sigma){return exp(-pow(x/sigma,2.));}
void main(){
  vec2 centered=(vUv-.5)*uSize;
  float sdf=sdRoundBox(centered,uSize*.5-vec2(1.5),min(uRadius,min(uSize.x,uSize.y)*.48));
  float mask=1.-smoothstep(-1.2,1.4,sdf);
  float edgeProximity=smoothstep(-42.,0.,sdf);
  vec2 aspect=vec2(max(uSize.x,1.),max(uSize.y,1.));
  vec2 direction=normalize(centered+vec2(.001));
  // Continuous interior refraction, bent more strongly approaching the wall.
  vec2 wave=vec2(sin(vUv.y*10.7+uTime*.52),cos(vUv.x*8.8-uTime*.43));
  vec2 bend=(direction*edgeProximity*(uRefract/2.8)+wave*(uWave*.13)*(1.-edgeProximity*.52)) / aspect;
  bend+=vec2(sin(vUv.y*24.+uTime*.8),cos(vUv.x*19.-uTime*.7))*uHover*.0017;
  vec2 sampleUV=clamp(vUv+bend,vec2(.002),vec2(.998));
  vec3 source=texture(uBackdrop,sampleUV).rgb;
  // The glass is colorless: the environment supplies most of the blue.
  vec3 tint=vec3(.93,.966,1.);
  vec3 color=mix(source,tint,.12+uHover*.045);
  vec2 lit=vUv-uMouse;
  float softbox=exp(-dot(lit/vec2(.54,.75),lit/vec2(.54,.75))*2.6);
  color=mix(color,vec3(1.),softbox*(.07+uHover*.09));
  // Asymmetric edge glint; left/top is deliberately brighter than bottom/right.
  float ang=atan(direction.y,direction.x);
  float upperLeft=gaussian(ang-2.37,.79);
  float lowerRight=gaussian(ang+.76,.79);
  float hairline=gaussian(sdf+1.65,1.7);
  float edgeGlint=hairline*(upperLeft*.80+lowerRight*.36)*uShine;
  color=mix(color,vec3(1.),clamp(edgeGlint,0.,.78));
  // Shadow just inside the edge conveys thickness without a white outline.
  float inside=gaussian(sdf+5.,5.);
  color*=1.-inside*(1.-upperLeft*.35)*.045;
  float alpha=mask*uOpacity;
  outColor=vec4(color,alpha);
}`;

function compileShader(gl,type,source){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
    const info=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(info);
  }
  return shader;
}

function createOptics(target,preset='small'){
  const host=document.createElement('canvas');host.className='liquid-optics';host.setAttribute('aria-hidden','true');
  target.prepend(host);
  const gl=host.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
  if(!gl){host.remove();target.classList.add('optics-unavailable');return null;}
  let program,position,texture,quad,locations={},width=0,height=0,visible=true,disposed=false,needsTexture=true;
  let mouseX=.2,mouseY=.8,hover=0,lastX=.2,lastY=.8;
  let sampler=document.createElement('canvas');let ctx=sampler.getContext('2d',{alpha:false});
  let rect=null;
  const settings={dock:{refract:19,shine:.65,wave:7,opacity:.93},chapter:{refract:24,shine:.68,wave:9,opacity:.88},small:{refract:23,shine:.75,wave:8,opacity:.94}}[preset]||{};
  try{
    const vs=compileShader(gl,gl.VERTEX_SHADER,vertexSource),fs=compileShader(gl,gl.FRAGMENT_SHADER,fragmentSource);
    program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
    quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    position=gl.getAttribLocation(program,'aPosition');
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    ['uBackdrop','uSize','uMouse','uTime','uHover','uRadius','uRefract','uShine','uWave','uOpacity'].forEach(name=>locations[name]=gl.getUniformLocation(program,name));
    texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  }catch(error){
    console.warn('UI optics unavailable',error);host.remove();target.classList.add('optics-unavailable');
    gl.deleteProgram(program);gl.deleteBuffer(quad);gl.deleteTexture(texture);return null;
  }
  const dpr=Math.min(window.devicePixelRatio||1,1.35);
  function resize(){
    if(disposed)return;
    rect=target.getBoundingClientRect();
    width=Math.max(1,Math.round(rect.width*dpr));height=Math.max(1,Math.round(rect.height*dpr));
    if(host.width!==width||host.height!==height){
      host.width=width;host.height=height;sampler.width=width;sampler.height=height;
      gl.viewport(0,0,width,height);needsTexture=true;
    }
  }
  function refresh(){needsTexture=true;}
  function sample(){
    if(!rect||!width||!height)return;
    rect=target.getBoundingClientRect();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle='#eaf2fc';ctx.fillRect(0,0,width,height);
    // Draw the same viewport-space background into this element's device-pixel canvas.
    // Different DPR caps are handled here rather than assumed equal.
    ctx.drawImage(backdrop,-rect.left*dpr,-rect.top*dpr,window.innerWidth*dpr,window.innerHeight*dpr);
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sampler);
    needsTexture=false;
  }
  function frame(time){
    if(disposed||!visible||!target.isConnected||!width||!height)return;
    if(needsTexture)sample();
    const over=target.matches(':hover,:focus-within')||target.classList.contains('active')?1:0;
    hover+=(over-hover)*(reducedMotion.matches?1:.13);
    lastX+=(mouseX-lastX)*.10;lastY+=(mouseY-lastY)*.10;
    gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,quad);
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.uniform1i(locations.uBackdrop,0);
    gl.uniform2f(locations.uSize,width,height);
    gl.uniform2f(locations.uMouse,lastX,lastY);
    gl.uniform1f(locations.uTime,reducedMotion.matches?0:time*.001);
    gl.uniform1f(locations.uHover,hover);
    const radius=parseFloat(getComputedStyle(target).borderTopLeftRadius)||18;
    gl.uniform1f(locations.uRadius,radius*dpr);
    gl.uniform1f(locations.uRefract,settings.refract*dpr);
    gl.uniform1f(locations.uShine,settings.shine);
    gl.uniform1f(locations.uWave,settings.wave);
    gl.uniform1f(locations.uOpacity,settings.opacity);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  const observer=new ResizeObserver(resize);observer.observe(target);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)refresh();},{rootMargin:'150px'});
  intersection.observe(target);
  const onMove=event=>{
    const b=target.getBoundingClientRect();
    mouseX=(event.clientX-b.left)/Math.max(b.width,1);
    mouseY=1-(event.clientY-b.top)/Math.max(b.height,1);
    target.style.setProperty('--light-x',`${mouseX*100}%`);
    target.style.setProperty('--light-y',`${(1-mouseY)*100}%`);
  };
  const onLeave=()=>{mouseX=.2;mouseY=.8;};
  target.addEventListener('pointermove',onMove,{passive:true});
  target.addEventListener('pointerleave',onLeave,{passive:true});
  const contextLoss=e=>{e.preventDefault();visible=false;target.classList.add('optics-unavailable');};
  host.addEventListener('webglcontextlost',contextLoss);
  resize();
  function dispose(){
    if(disposed)return;disposed=true;
    observer.disconnect();intersection.disconnect();target.removeEventListener('pointermove',onMove);target.removeEventListener('pointerleave',onLeave);
    host.removeEventListener('webglcontextlost',contextLoss);
    gl.deleteTexture(texture);gl.deleteBuffer(quad);gl.deleteProgram(program);host.remove();
    sampler.width=sampler.height=0;sampler=null;ctx=null;
  }
  return{target,refresh,resize,frame,dispose};
}

function init(){
  if(noGlass||reducedTransparency.matches){
    document.querySelectorAll('[data-optics]').forEach(node=>node.classList.add('optics-unavailable'));
    return;
  }
  const candidates=[...document.querySelectorAll('[data-optics]')];
  for(const target of candidates){
    const entry=createOptics(target,target.dataset.optics);
    if(entry)instances.push(entry);
  }
}

function refreshAll(){instances.forEach(entry=>{entry.resize();entry.refresh();});}
function tick(time){
  if(destroyed||document.hidden)return;
  raf=requestAnimationFrame(tick);
  const interval=reducedMotion.matches?250:42;
  if(time-lastFrame<interval)return;
  lastFrame=time;
  if(needsSampling){refreshAll();needsSampling=false;}
  instances.forEach(instance=>instance.frame(time));
}

const themeResize=()=>{stampAmbient();refreshAll();};
const themeScroll=()=>{instances.forEach(instance=>instance.refresh());};
window.addEventListener('resize',themeResize,{passive:true});
window.addEventListener('scroll',themeScroll,{passive:true});
sceneButtons.forEach(button=>button.addEventListener('click',()=>{
  const chosen=Number(button.dataset.chapter);
  if(sceneIndex===chosen)return;
  sceneIndex=chosen;document.body.dataset.atmosphere=String(sceneIndex);
  stampAmbient();refreshAll();
}));
const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);}else{lastFrame=0;raf=requestAnimationFrame(tick);}};
document.addEventListener('visibilitychange',visibility);
const transparencyChanged=()=>{
  if(reducedTransparency.matches){instances.splice(0).forEach(entry=>entry.dispose());document.querySelectorAll('[data-optics]').forEach(n=>n.classList.add('optics-unavailable'));}
};
reducedTransparency.addEventListener?.('change',transparencyChanged);
const adjustTimers=new WeakMap();
document.querySelectorAll('.tool-range input').forEach(input=>{
  input.addEventListener('input',()=>{
    const label=input.closest('.tool-range');
    label.classList.add('is-changing');
    clearTimeout(adjustTimers.get(input));
    adjustTimers.set(input,setTimeout(()=>label.classList.remove('is-changing'),520));
  });
});
const destroyedHandler=()=>{
  destroyed=true;cancelAnimationFrame(raf);instances.splice(0).forEach(entry=>entry.dispose());
  window.removeEventListener('resize',themeResize);window.removeEventListener('scroll',themeScroll);
  document.removeEventListener('visibilitychange',visibility);
  reducedTransparency.removeEventListener?.('change',transparencyChanged);
};
window.addEventListener('pagehide',destroyedHandler,{once:true});
stampAmbient();init();raf=requestAnimationFrame(tick);
