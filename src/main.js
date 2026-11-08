/* GLASS AHA — an independent, dependency-free WebGL2 material study.
 * Three narrative windows. None of the source project's code or images are used.
 */
const $ = selector => document.querySelector(selector);
const shell = $('#windowShell');
const canvas = $('#glass');
const backup = $('#fallbackScene');
const brushCursor = $('#brushCursor');
const announcer = $('#announcer');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const chapters = [
  { number:'01', type:'CONDENSATION / 凝结', caption:'在雨停之前，玻璃比窗外的植物更早感受到天气。', whisper:'原来，雨已经停了。', fog:.86, relief:.92, mode:0, time:7800 },
  { number:'02', type:'OBSCURITY / 遮蔽', caption:'一封没有地址的信，不一定是在等待寄出。', whisper:'有些话只需要被写下。', fog:.93, relief:.55, mode:1, time:9000 },
  { number:'03', type:'REFRACTION / 折射', caption:'末班车驶过时，窗外与窗内很难同时清晰。', whisper:'那盏灯，已经在身后了。', fog:.67, relief:.68, mode:2, time:6000 },
];
let active=0, revealed=false, dragging=false, touched=false;
let gl, program, uniforms={}, geo, sceneTextures=[], normalTexture, maskTexture;
let frameId=0, lastFrame=0, start=performance.now(), fadeStart=0, fadeFrom=0;
const marks=[];let lastMark=null;const maskCanvas=document.createElement('canvas');maskCanvas.width=maskCanvas.height=256;
const maskCtx=maskCanvas.getContext('2d',{willReadFrequently:false});
const sceneCanvases=[];let fallbackCtx=null, webglOkay=false;
const pointer={x:.30,y:.32,in:false};
const size={w:1,h:1,dpr:1};

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const mix=(a,b,t)=>a+(b-a)*t;
function randFactory(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function ellipse(ctx,x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
function line(ctx,a,b,c,d,width,color){ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(c,d);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
function gradient(ctx,x,y,r,stops){const g=ctx.createRadialGradient(x,y,0,x,y,r);stops.forEach(([t,col])=>g.addColorStop(t,col));return g;}
function fillGradient(ctx,top,bottom){const g=ctx.createLinearGradient(0,0,0,960);g.addColorStop(0,top);g.addColorStop(1,bottom);ctx.fillStyle=g;ctx.fillRect(0,0,1280,960);}
function leaf(ctx,x,y,size,angle,color,vein=false){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(size*.25,-size*.76,size*.99,-size*.64,size*1.18,0);ctx.bezierCurveTo(size*.7,size*.64,size*.24,size*.62,0,0);ctx.fillStyle=color;ctx.fill();if(vein){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(size*.65,-size*.06,size*1.1,0);ctx.strokeStyle='#d4dcc18a';ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();}
function textureSpecks(ctx,rand,count=8500,opacity=.11){ctx.save();for(let i=0;i<count;i++){const x=rand()*1280,y=rand()*960;ctx.fillStyle=rand()>.52?`rgba(252,247,219,${opacity*rand()})`:`rgba(20,41,36,${opacity*rand()})`;ctx.fillRect(x,y,rand()*2+.4,rand()*2+.4);}ctx.restore();}
function sceneCanvas(){const c=document.createElement('canvas');c.width=1280;c.height=960;return [c,c.getContext('2d')];}
function drawGarden(){const [c,g]=sceneCanvas(),r=randFactory(702);fillGradient(g,'#bfcfbd','#304e3c');
  g.fillStyle=gradient(g,890,300,790,[[0,'#f9e3adfa'],[.26,'#e9d7a3a8'],[.62,'#98af8c30'],[1,'#ffffff00']]);g.fillRect(0,0,1280,960);
  g.fillStyle='#9cad93c9';g.fillRect(130,90,1010,800);
  g.fillStyle=gradient(g,715,432,480,[[0,'#ede2b8dc'],[1,'#738f7470']]);g.fillRect(135,120,1000,760);
  // greenhouse structure, deliberately geometric against organic leaves
  g.strokeStyle='#d5ded03b';g.lineWidth=26;g.strokeRect(136,54,1015,875);
  [405,745,1000].forEach(x=>line(g,x,62,x,920,12,'#3b615060'));
  line(g,134,390,1150,390,13,'#44645460');line(g,134,703,1150,703,11,'#44645459');
  g.strokeStyle='#e0e7d340';g.lineWidth=3;g.strokeRect(156,76,972,827);
  // tree trunks with layered boughs
  for(let side=0;side<2;side++){const ox=side===0?60:1210;g.beginPath();g.moveTo(ox,1050);g.bezierCurveTo(ox+(side? -30:60),630,ox+(side?-110:140),245,ox+(side?-110:160),-120);g.strokeStyle=side?'#274b39':'#254634';g.lineWidth=side?42:55;g.stroke();}
  const palettes=[['#183c2c','#2a513b','#5a7052','#819473'],['#244633','#507253','#a0a879','#7a8f6b']];
  for(let cluster=0;cluster<23;cluster++){const side=cluster%2;const ox=side?980+r()*390:-120+r()*490;const oy=-130+r()*900;const len=110+r()*320;const a=side?Math.PI-r()*.65:r()*.65;const ex=ox+Math.cos(a)*len,ey=oy+Math.sin(a)*len;line(g,ox,oy,ex,ey,3+r()*7,'#243f2ab5');for(let j=0;j<10;j++){const f=.18+j*.077;const px=mix(ox,ex,f),py=mix(oy,ey,f);const sideLeaf=j%2?-1:1;const angle=a+sideLeaf*(.25+r()*.8);const palette=palettes[side];leaf(g,px,py,22+r()*62,angle,palette[Math.floor(r()*palette.length)],r()>.68);}}
  // luminous pale leaves at the center, a plant slowly coming into focus
  for(let j=0;j<48;j++){const a=j*2.399+r()*.4;const length=55+(j%9)*16+r()*35;const x=640+Math.cos(a)*length,y=615+Math.sin(a)*length*.8;line(g,650,805,x,y,1.8,'#345a3bb0');leaf(g,x,y,22+r()*24,a-.4,['#bbba86','#ced1a0','#7b956d','#a0af7d'][j%4],true);}
  g.fillStyle='#9b6e52';g.beginPath();g.moveTo(560,785);g.lineTo(735,785);g.lineTo(711,955);g.lineTo(579,955);g.closePath();g.fill();g.fillStyle='#ae8463';g.fillRect(543,785,208,23);line(g,550,812,736,812,2,'#d6b18a80');
  // a few small flowers that repay looking closely
  [[585,562],[740,665],[631,517]].forEach(([x,y],i)=>{for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ellipse(g,x+Math.cos(a)*9,y+Math.sin(a)*9,10,5,'#f0e7c8cf');}ellipse(g,x,y,5,5,'#ccaf6c');});
  g.fillStyle=gradient(g,637,610,470,[[0,'#fff8c000'],[1,'#122c2365']]);g.fillRect(0,0,1280,960);
  for(let i=0;i<190;i++){const x=r()*1280,y=r()*960,rr=1+r()*2.5;ellipse(g,x,y,rr,rr*.6,`rgba(245,253,225,${.04+r()*.16})`);}
  textureSpecks(g,r);return c;}
function drawLetter(){const[c,g]=sceneCanvas(),r=randFactory(261);fillGradient(g,'#b8b0a3','#a59a85');
  g.fillStyle=gradient(g,240,150,900,[[0,'#eee2c9bd'],[.75,'#e6d6bf28'],[1,'#e6d6bf00']]);g.fillRect(0,0,1280,960);
  // moving-looking shadows, but the artwork is static: only the glass responds
  g.save();g.translate(-55,15);g.rotate(-.17);for(let i=0;i<12;i++){const x=130+i*110;g.beginPath();g.moveTo(x,-100);g.quadraticCurveTo(x+50,420,x+70,1070);g.strokeStyle='#384a3d1d';g.lineWidth=i%3===0?42:12;g.stroke();}g.restore();
  // envelope below the letter
  g.save();g.translate(655,715);g.rotate(.07);g.shadowColor='#443d3260';g.shadowBlur=35;g.shadowOffsetY=25;g.fillStyle='#d7c6ae';g.fillRect(-360,-150,720,330);g.shadowColor='transparent';g.beginPath();g.moveTo(-360,-150);g.lineTo(0,82);g.lineTo(360,-150);g.strokeStyle='#b1a28f';g.lineWidth=3;g.stroke();g.restore();
  // handwritten letter
  g.save();g.translate(650,470);g.rotate(-.055);g.shadowColor='#423b325e';g.shadowBlur=48;g.shadowOffsetX=13;g.shadowOffsetY=22;g.fillStyle='#f3ecdc';g.fillRect(-337,-358,674,768);g.shadowColor='transparent';
  g.strokeStyle='#d6c9b2';g.lineWidth=1.5;g.strokeRect(-325,-346,650,744);
  g.fillStyle='#b6a789';g.font='16px Georgia,serif';g.fillText('A NOTE NEVER SENT',-275,-294);g.font='14px Georgia,serif';g.fillText('NO ADDRESS / NO DATE',80,-294);
  line(g,-276,-255,273,-255,1,'#d4c5ae');
  g.fillStyle='#584f48';g.font='normal 32px "Noto Serif SC","Songti SC",serif';g.fillText('给未来的某一天：',-268,-174);
  const sentences=['有些话，写下来以后，','就不再需要寄出。','','我曾经很想知道答案，','后来觉得，留一点空白也好。'];
  g.font='normal 29px "Noto Serif SC","Songti SC",serif';sentences.forEach((s,i)=>g.fillText(s,-265,-95+i*68));
  g.strokeStyle='#746b6099';g.lineWidth=2;g.beginPath();g.moveTo(-255,96);g.bezierCurveTo(-85,85,8,103,200,88);g.stroke();
  g.fillStyle='#8b7964';g.font='italic 19px Georgia,serif';g.fillText('Perhaps some things are better unfinished.',-264,290);
  g.fillStyle='#8c6f64';g.font='italic 17px Georgia,serif';g.fillText('—',235,345);g.restore();
  // wax seal in front of paper
  ellipse(g,865,800,38,37,'#925e4b');ellipse(g,863,797,29,29,'#a97861');g.fillStyle='#d5b29a';g.font='italic 28px Georgia,serif';g.fillText('a',855,806);
  for(let i=0;i<55;i++){const x=r()*1280,y=r()*960;g.fillStyle=`rgba(255,250,231,${r()*.13})`;g.fillRect(x,y,2+r()*3,2+r()*3);}
  textureSpecks(g,r,11000,.13);return c;}
function drawNight(){const[c,g]=sceneCanvas(),r=randFactory(311);fillGradient(g,'#203a49','#647c79');
  g.fillStyle=gradient(g,868,333,540,[[0,'#d8b88a9e'],[.29,'#a9a68c55'],[1,'#aa9c7900']]);g.fillRect(0,0,1280,960);
  ellipse(g,850,290,53,53,'#e9d1a4ba');g.fillStyle=gradient(g,850,290,120,[[0,'#f9d7a4b0'],[1,'#f9d7a400']]);g.fillRect(700,140,300,300);
  // receding city, perspective and lit windows
  for(let layer=0;layer<3;layer++){const base=460+layer*85;for(let i=0;i<26;i++){const x=i*56-30+r()*12,w=45+r()*75,h=110+r()*270+layer*45;g.fillStyle=[`#385763`,`#2c4c57`,`#253e4a`][layer];g.fillRect(x,base-h,w,h);for(let wx=x+9;wx<x+w-8;wx+=15){for(let wy=base-h+14;wy<base-15;wy+=23){if(r()<.39){g.fillStyle=r()>.45?'#dabb8970':'#bbd2bc65';g.fillRect(wx,wy,6,9);}}}}}
  // train platform / interior reflection rails
  const floor=g.createLinearGradient(0,560,0,960);floor.addColorStop(0,'#2f4b52');floor.addColorStop(1,'#142e38');g.fillStyle=floor;g.beginPath();g.moveTo(0,630);g.lineTo(1280,630);g.lineTo(1280,960);g.lineTo(0,960);g.fill();
  for(let i=0;i<35;i++){const x=r()*1280;g.strokeStyle=r()>.45?'#ddae7770':'#7d9a9b5c';g.lineWidth=1+r()*3;g.beginPath();g.moveTo(x,650);g.lineTo(x+mix(-80,80,r()),650+r()*310);g.stroke();}
  line(g,0,622,1280,622,7,'#c79b78b9');line(g,0,648,1280,648,2,'#81979e8c');
  for(let i=0;i<7;i++){const x=160+i*150;g.fillStyle=gradient(g,x,607,100,[[0,'#f2cd9cbb'],[1,'#f2cd9c00']]);g.fillRect(x-100,500,200,210);ellipse(g,x,607,4,6,'#ffe1b0');}
  // a dark train-window structure and a faint reflection of the observer
  g.strokeStyle='#142f3db0';g.lineWidth=29;g.strokeRect(95,-50,1080,1080);
  line(g,1040,0,1040,960,13,'#162d38bb');line(g,106,0,106,960,12,'#152d39bb');
  g.fillStyle=gradient(g,245,715,300,[[0,'#b4bfc127'],[1,'#b4bfc100']]);g.fillRect(0,300,580,660);
  // diagonal streaks of rain over distant city
  for(let i=0;i<190;i++){const x=r()*1280,y=r()*800;line(g,x,y,x-3-r()*12,y+20+r()*90,.7+r()*1.3,`rgba(218,233,223,${.05+r()*.16})`);}
  textureSpecks(g,r,9000,.085);return c;}
sceneCanvases.push(drawGarden(),drawLetter(),drawNight());

const vertexShader=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const fragmentShader=`#version 300 es
precision highp float;
in vec2 vUv;out vec4 fragColor;
uniform sampler2D uScene;uniform sampler2D uNext;uniform sampler2D uReliefMap;uniform sampler2D uMask;
uniform vec2 uResolution;uniform vec2 uLight;uniform float uTime;uniform float uFog;uniform float uRelief;uniform float uMode;uniform float uReveal;uniform float uTransition;
uniform float uNextFog;uniform float uNextRelief;uniform float uNextMode;
vec2 coverUV(vec2 uv){float a=uResolution.x/uResolution.y;float imageAspect=1280./960.;vec2 fit=vec2(min(a/imageAspect,1.),min(imageAspect/a,1.));return (uv-.5)*fit+.5;}
vec3 sampleImage(sampler2D img,vec2 uv,float blur){vec2 px=1./uResolution;vec3 c=texture(img,coverUV(uv)).rgb*.22;for(int i=0;i<11;i++){float a=float(i)*2.399963;float rad=sqrt((float(i)+.5)/11.)*blur;vec2 delta=vec2(cos(a),sin(a))*rad*px;c+=texture(img,coverUV(uv+delta)).rgb*(.78/11.);}return c;}
vec3 glass(sampler2D img,vec2 uv,vec2 norm,float fog,float relief,float mode,float mask,float reflection){
  float visibility=max(mask,uReveal);float diffusion=fog*(1.-visibility);
  vec2 n=norm*relief;
  if(mode>1.5){n=vec2(sin(uv.x*uResolution.x*.29)*.52,n.y*.18);}
  if(mode>.5&&mode<1.5){n*=.5;}
  vec2 bend=n*.019*diffusion+vec2(sin(uv.y*8.+uTime*.18),cos(uv.x*7.+uTime*.13))*.00033*diffusion;
  vec3 c=sampleImage(img,uv+bend,1.5+diffusion*17.);
  vec3 tint=mode>1.5?vec3(.71,.81,.82):(mode>.5?vec3(.93,.87,.77):vec3(.86,.92,.82));
  c=mix(c,tint,diffusion*.32);
  float rim=pow(clamp(length(n)*1.2,0.,1.),1.8);
  vec2 ratio=uResolution/min(uResolution.x,uResolution.y);
  vec2 delta=(uv-uLight)*ratio+n*.16;
  float soft=exp(-dot(delta/vec2(.54,.64),delta/vec2(.54,.64))*2.2);
  float hot=exp(-dot((delta+vec2(.09,-.08))/vec2(.25,.35),(delta+vec2(.09,-.08))/vec2(.25,.35))*2.1);
  float sheen=(soft*.23+hot*.31+rim*soft*.12)*diffusion*reflection;
  c=mix(c,vec3(1.,.993,.96),clamp(sheen,0.,.64));
  float edge=length(vec2(dFdx(mask),dFdy(mask)))*9.;
  c+=vec3(.95,.92,.82)*clamp(edge,0.,.14)*diffusion;
  return c;
}
void main(){vec2 uv=vUv;vec2 pixelPhysical=uv*uResolution/min(uResolution.x,uResolution.y);
  vec4 bump=texture(uReliefMap,pixelPhysical*1.43);vec4 fine=texture(uReliefMap,pixelPhysical*3.18+vec2(.41,.27));
  vec2 normal=(bump.rg*2.-1.)*.8+(fine.rg*2.-1.)*.2;
  float clear=texture(uMask,uv).r;
  vec3 c1=glass(uScene,uv,normal,uFog,uRelief,uMode,clear,1.);
  vec3 c2=glass(uNext,uv,normal,uNextFog,uNextRelief,uNextMode,clear,1.);
  float mixVal=smoothstep(0.,1.,uTransition);
  vec3 color=mix(c1,c2,mixVal);
  color*=1.-.085*dot((uv-.5)*vec2(1.,.85),(uv-.5)*vec2(1.,.85));
  fragColor=vec4(clamp(color,0.,1.),1.);
}`;
function compile(type,src){const shader=gl.createShader(type);gl.shaderSource(shader,src);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error);}return shader;}
function newTexture(canvasOrImage,repeat=false){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvasOrImage);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);return tex;}
function noiseSurface(){const s=384,c=document.createElement('canvas');c.width=c.height=s;const g=c.getContext('2d'),im=g.createImageData(s,s),r=randFactory(987321);const levels=[];for(const scale of [12,24,48,96,192]){const data=new Float32Array(scale*scale);for(let i=0;i<data.length;i++)data[i]=r();levels.push({scale,data});}
  const heights=new Float32Array(s*s);for(let y=0;y<s;y++)for(let x=0;x<s;x++){let h=0;levels.forEach(({scale,data},k)=>{const gx=x/s*scale,gy=y/s*scale,ix=Math.floor(gx),iy=Math.floor(gy),fx=(gx-ix),fy=(gy-iy),tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy);const sample=(xx,yy)=>data[((yy+scale)%scale)*scale+((xx+scale)%scale)];const a=mix(sample(ix,iy),sample(ix+1,iy),tx),b=mix(sample(ix,iy+1),sample(ix+1,iy+1),tx);h+=mix(a,b,ty)*[.07,.13,.22,.38,.2][k];});heights[y*s+x]=h;}
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){const i=y*s+x,ddx=heights[y*s+(x+1)%s]-heights[y*s+(x+s-1)%s],ddy=heights[((y+1)%s)*s+x]-heights[((y+s-1)%s)*s+x];im.data[i*4]=clamp(128+ddx*530,0,255);im.data[i*4+1]=clamp(128+ddy*530,0,255);im.data[i*4+2]=clamp(heights[i]*255,0,255);im.data[i*4+3]=255;}g.putImageData(im,0,0);return c;}
function initWebGL(){try{
  gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:false,powerPreference:'default'});
  if(!gl)throw new Error('WebGL2 unavailable');
  const v=compile(gl.VERTEX_SHADER,vertexShader),f=compile(gl.FRAGMENT_SHADER,fragmentShader);program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);geo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,geo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  sceneTextures=sceneCanvases.map(c=>newTexture(c));normalTexture=newTexture(noiseSurface(),true);
  maskCtx.fillStyle='black';maskCtx.fillRect(0,0,256,256);maskTexture=newTexture(maskCanvas);
  const names=['uScene','uNext','uReliefMap','uMask','uResolution','uLight','uTime','uFog','uRelief','uMode','uReveal','uTransition','uNextFog','uNextRelief','uNextMode'];names.forEach(n=>uniforms[n]=gl.getUniformLocation(program,n));
  [['uScene',0],['uNext',1],['uReliefMap',2],['uMask',3]].forEach(([n,i])=>gl.uniform1i(uniforms[n],i));
  webglOkay=true;canvas.style.opacity='1';resize();return true;
}catch(e){console.warn('[GLASS AHA] Falling back to Canvas2D:',e);canvas.style.opacity='0';fallbackCtx=backup.getContext('2d');resize();return false;}}
function resize(){const rect=shell.getBoundingClientRect();size.w=Math.max(1,rect.width);size.h=Math.max(1,rect.height);size.dpr=Math.min(window.devicePixelRatio||1,1.6);const width=Math.round(size.w*size.dpr),height=Math.round(size.h*size.dpr);for(const c of [canvas,backup]){c.width=width;c.height=height;}
  if(gl&&webglOkay)gl.viewport(0,0,width,height);}
function drawCover(ctx,source){const a=backup.width/backup.height,imA=source.width/source.height;let w,h;if(a>imA){w=backup.width;h=w/imA;}else{h=backup.height;w=h*imA;}ctx.drawImage(source,(backup.width-w)/2,(backup.height-h)/2,w,h);}
function drawFallback(now){if(!fallbackCtx)return;const c=fallbackCtx,w=backup.width,h=backup.height;c.clearRect(0,0,w,h);c.save();c.filter=`blur(${revealed?0:14*size.dpr}px)`;drawCover(c,sceneCanvases[active]);c.restore();if(!revealed){c.fillStyle=active===2?'#b9caca70':'#e7e9d5a0';c.fillRect(0,0,w,h);}for(const mark of marks){const life=clamp(1-(now-mark.t)/chapters[active].time,0,1);if(life<=0)continue;c.save();c.beginPath();c.ellipse(mark.x*w,(1-mark.y)*h,mark.radius*w*life,mark.radius*w*life,0,0,Math.PI*2);c.clip();drawCover(c,sceneCanvases[active]);c.restore();}}
function addMark(x,y,now){const radius=clamp(52/size.w,.065,.17);marks.push({x,y,t:now,radius});if(marks.length>420)marks.splice(0,marks.length-420);touched=true;shell.classList.add('touched');$('#glassState').textContent='THE GLASS REMEMBERS';$('#gestureNote').hidden=true;}
function paintMask(now){maskCtx.fillStyle='#000';maskCtx.fillRect(0,0,256,256);const lifeSpan=chapters[active].time;for(let i=marks.length-1;i>=0;i--){const mark=marks[i];const life=1-(now-mark.t)/lifeSpan;if(life<=0){marks.splice(i,1);continue;}const rad=mark.radius*256*mix(.45,1,Math.min(1,life*2));const px=mark.x*256,py=(1-mark.y)*256;const grad=maskCtx.createRadialGradient(px,py,0,px,py,rad);const intensity=Math.pow(life,.58);grad.addColorStop(0,`rgba(255,255,255,${intensity})`);grad.addColorStop(.58,`rgba(255,255,255,${intensity*.93})`);grad.addColorStop(.84,`rgba(255,255,255,${intensity*.46})`);grad.addColorStop(1,'rgba(255,255,255,0)');maskCtx.fillStyle=grad;maskCtx.beginPath();maskCtx.arc(px,py,rad,0,Math.PI*2);maskCtx.fill();}
  if(webglOkay){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,maskTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,maskCanvas);}}
function render(now){if(document.hidden)return;frameId=requestAnimationFrame(render);if(now-lastFrame<(reducedMotion.matches?75:32))return;lastFrame=now;paintMask(now);
  if(webglOkay){const current=chapters[fadeFrom],next=chapters[active];const t=fadeStart?clamp((now-fadeStart)/(reducedMotion.matches?1:920),0,1):1;
    gl.useProgram(program);[sceneTextures[fadeFrom],sceneTextures[active],normalTexture,maskTexture].forEach((tex,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex);});
    gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);gl.uniform2f(uniforms.uLight,pointer.x,pointer.y);gl.uniform1f(uniforms.uTime,reducedMotion.matches?0:(now-start)*.001);
    gl.uniform1f(uniforms.uFog,current.fog);gl.uniform1f(uniforms.uRelief,current.relief);gl.uniform1f(uniforms.uMode,current.mode);gl.uniform1f(uniforms.uReveal,revealed?1:0);
    gl.uniform1f(uniforms.uNextFog,next.fog);gl.uniform1f(uniforms.uNextRelief,next.relief);gl.uniform1f(uniforms.uNextMode,next.mode);gl.uniform1f(uniforms.uTransition,t);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(t>=1)fadeStart=0,fadeFrom=active;
  }else drawFallback(now);
  if(!marks.length&&!dragging&&!revealed)$('#glassState').textContent='THE FOG IS SETTLING';
}
function sceneChanged(index){if(index===active)return;const previous=active;fadeFrom=previous;active=index;fadeStart=performance.now();revealed=false;marks.length=0;lastMark=null;touched=false;shell.classList.remove('touched','dragging');$('#gestureNote').hidden=false;
  document.querySelectorAll('.chapter').forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-pressed',String(i===index));});
  const ch=chapters[index];$('#sceneIndex').textContent=`FIG. ${ch.number} / 03`;$('#sceneType').textContent=ch.type;$('#topSceneLabel').textContent=ch.number;$('#sceneCaption').textContent=ch.caption;$('#whisper').textContent=ch.whisper;$('.scene-number-art').innerHTML=`${ch.number}<span>/03</span>`;$('#glassState').textContent='THE FOG IS SETTLING';$('#revealButton').setAttribute('aria-pressed','false');$('#revealButton').innerHTML='<span aria-hidden="true">◉</span> 完整观看';announcer.textContent=`场景 ${ch.number}，${ch.caption}`;
  if(!webglOkay)drawFallback(performance.now());}
function getPosition(event){const rect=canvas.getBoundingClientRect();return {x:clamp((event.clientX-rect.left)/rect.width,0,1),y:clamp(1-(event.clientY-rect.top)/rect.height,0,1)};}
function move(event){const p=getPosition(event);pointer.x=p.x;pointer.y=p.y;brushCursor.style.left=`${p.x*100}%`;brushCursor.style.top=`${(1-p.y)*100}%`;$('#coordinates').textContent=`X ${Math.round(p.x*100).toString().padStart(2,'0')} / Y ${Math.round((1-p.y)*100).toString().padStart(2,'0')}`;
  if(dragging&&!revealed){const now=performance.now();if(lastMark){const dist=Math.hypot(p.x-lastMark.x,p.y-lastMark.y);const steps=Math.max(1,Math.ceil(dist/.012));for(let j=1;j<=steps;j++){addMark(mix(lastMark.x,p.x,j/steps),mix(lastMark.y,p.y,j/steps),now);}}else addMark(p.x,p.y,now);lastMark=p;}}
function clearFog(){marks.length=0;lastMark=null;revealed=false;touched=false;shell.classList.remove('touched','dragging');$('#gestureNote').hidden=false;$('#glassState').textContent='THE FOG IS SETTLING';$('#revealButton').setAttribute('aria-pressed','false');$('#revealButton').innerHTML='<span aria-hidden="true">◉</span> 完整观看';announcer.textContent='雾气已重新覆盖玻璃';}
canvas.addEventListener('pointerenter',()=>shell.classList.add('hovering'));
canvas.addEventListener('pointerleave',()=>{if(!dragging)shell.classList.remove('hovering');});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||revealed)return;dragging=true;lastMark=null;canvas.setPointerCapture(e.pointerId);shell.classList.add('dragging','hovering');move(e);e.preventDefault();});
canvas.addEventListener('pointermove',move);
function endPointer(e){dragging=false;lastMark=null;shell.classList.remove('dragging');if(e?.pointerId!==undefined&&canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(e?.type==='pointercancel'||e?.pointerType==='touch')shell.classList.remove('hovering');}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
$('#resetButton').addEventListener('click',clearFog);
$('#revealButton').addEventListener('click',()=>{revealed=!revealed;marks.length=0;const b=$('#revealButton');b.setAttribute('aria-pressed',String(revealed));b.innerHTML=revealed?'<span aria-hidden="true">◉</span> 返回雾中':'<span aria-hidden="true">◉</span> 完整观看';$('#glassState').textContent=revealed?'THE VIEW IS OPEN':'THE FOG IS SETTLING';shell.classList.toggle('touched',revealed);$('#whisper').textContent=chapters[active].whisper;announcer.textContent=revealed?'已显示无雾画面':'已恢复毛玻璃效果';});
document.querySelectorAll('.chapter').forEach(b=>b.addEventListener('click',()=>sceneChanged(Number(b.dataset.chapter))));
const dialog=$('#aboutDialog');const aboutOpen=$('#aboutOpen');const closeDialog=()=>{dialog.close();aboutOpen.focus();};aboutOpen.addEventListener('click',()=>dialog.showModal());$('#aboutClose').addEventListener('click',closeDialog);$('#aboutBack').addEventListener('click',closeDialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
window.addEventListener('keydown',e=>{if(dialog.open||e.ctrlKey||e.altKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowRight'){sceneChanged((active+1)%3);}else if(e.key==='ArrowLeft'){sceneChanged((active+2)%3);}else if(e.key.toLowerCase()==='r'){e.preventDefault();$('#revealButton').click();}else if(e.key==='Escape'){clearFog();}});
window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden){cancelAnimationFrame(frameId);frameId=requestAnimationFrame(render);}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();webglOkay=false;console.warn('Graphics context lost. Waiting for restore.');});canvas.addEventListener('webglcontextrestored',()=>{webglOkay=false;initWebGL();});
$('#whisper').textContent=chapters[0].whisper;
initWebGL();frameId=requestAnimationFrame(render);
