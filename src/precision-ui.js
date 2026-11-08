/* Interaction instruments — DOM-only, composable with the existing two optical renderers. */
const dock=document.querySelector('.tool-dock');
const mode=document.querySelector('.tool-mode');
const inputs=[...document.querySelectorAll('.tool-range input[type="range"]')];
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const cleanup=[];
const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);cleanup.push(()=>target.removeEventListener(type,fn,options));};

function updateModePosition(){
  mode.dataset.active=document.querySelector('#fogMode').getAttribute('aria-pressed')==='true'?'fog':'clear';
}
updateModePosition();
for(const b of mode.querySelectorAll('button'))listen(b,'click',()=>{
  updateModePosition();
  if(reduceMotion.matches)return;
  const emblem=dock.querySelector('.tool-icon svg');
  emblem?.animate([{transform:'scale(1) rotate(0deg)'},{transform:'scale(.9) rotate(14deg)',offset:.38},{transform:'scale(1) rotate(0deg)'}],{duration:530,easing:'cubic-bezier(.22,1,.36,1)'});
});

// Read-only presentation layer: every pointer and keyboard adjustment still acts on a native input.
for(const input of inputs){
  const label=input.closest('.tool-range');
  const output=label.querySelector('output');
  const field=document.createElement('div');field.className='range-mechanism';
  const bed=document.createElement('span');bed.className='range-bed';bed.setAttribute('aria-hidden','true');
  const fill=document.createElement('span');fill.className='range-liquid';bed.append(fill);
  const handle=document.createElement('span');handle.className='range-glass-handle';handle.setAttribute('aria-hidden','true');
  const bubble=document.createElement('span');bubble.className='range-value-float';bubble.setAttribute('aria-hidden','true');
  input.before(field);field.append(bed,handle,bubble,input);
  function render(){
    const min=Number(input.min),max=Number(input.max),v=Number(input.value);
    const ratio=clamp((v-min)/(max-min),0,1);
    field.style.setProperty('--ratio',String(ratio));
    field.style.setProperty('--progress',`${ratio*100}%`);
    bubble.textContent=output.textContent;
    // Maintain accessible value granularity without introducing a separate pseudo-control.
    input.setAttribute('aria-valuetext',output.textContent+(input.id==='radiusRange'?' 像素':''));
  }
  render();
  listen(input,'input',render);
  listen(input,'change',render);
  listen(input,'glass:sync',render);
  listen(input,'pointerdown',()=>{label.classList.add('is-dragging');render();});
  const end=()=>label.classList.remove('is-dragging');
  listen(input,'pointerup',end);listen(input,'pointercancel',end);listen(input,'blur',end);
  listen(field,'pointermove',event=>{
    const r=field.getBoundingClientRect();
    field.style.setProperty('--hover-x',`${clamp((event.clientX-r.left)/Math.max(r.width,1),0,1)*100}%`);
  },{passive:true});
}

// Pointer glints belong to the existing UI glass surfaces, not to a global cursor effect.
for(const surface of document.querySelectorAll('.header-link,.gesture-help,.tool-actions button,.chapter')){
  if(!finePointer.matches)break;
  listen(surface,'pointermove',event=>{
    const rect=surface.getBoundingClientRect();
    surface.style.setProperty('--light-px',`${clamp((event.clientX-rect.left)/rect.width,0,1)*100}%`);
    surface.style.setProperty('--light-py',`${clamp((event.clientY-rect.top)/rect.height,0,1)*100}%`);
  },{passive:true});
}
listen(dock,'pointermove',event=>{
  if(!finePointer.matches)return;
  const r=dock.getBoundingClientRect();
  dock.style.setProperty('--glint-x',`${clamp((event.clientX-r.left)/r.width,0,1)*100}%`);
  dock.style.setProperty('--glint-y',`${clamp((event.clientY-r.top)/r.height,0,1)*100}%`);
},{passive:true});

// Set the semantic state after the main scene engine processes shortcut-driven mode changes too.
const modeObserver=new MutationObserver(updateModePosition);
for(const b of mode.querySelectorAll('button'))modeObserver.observe(b,{attributes:true,attributeFilter:['aria-pressed']});
cleanup.push(()=>modeObserver.disconnect());
window.addEventListener('pagehide',()=>cleanup.forEach(fn=>fn()),{once:true});
