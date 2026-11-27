const walletMotion = (() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 let stopTransition = () => {};
 const tabTimes = {home:220, cards:320, recipients:1160, payments:250};
 function clear(){stopTransition();stopTransition=()=>{}}
 function assets(theme){
  const root=document.documentElement;
  if(theme?.film?.launchMark)root.style.setProperty('--wallet-mark','url("'+theme.film.launchMark+'")');
  else root.style.removeProperty('--wallet-mark');
  const cover=document.getElementById('launch-cover');
  if(!cover||!theme?.film)return;
  for(const [selector,key] of [['.launch-mark','launchMark'],['.launch-ribbon','launchRibbon']]){
   const src=theme.film[key];
   if(src)cover.querySelector(selector).style.setProperty('--art','url("'+src+'")');
  }
 }
 async function launch(activation,startTime=0){
  const root=document.documentElement, cover=document.getElementById('launch-cover');
  if(!cover||!root.classList.contains('wallet-opening')){await activation;return}
  let ended=false, timer;
  function finish(){
   if(ended)return;
   ended=true;
   clearTimeout(timer);
   root.classList.remove('wallet-opening','wallet-departing');
   document.querySelector('meta[name=theme-color]').content=document.body.classList.contains('personal')?'#fcfcfc':'#f6f7ef';
   cover.remove();
   document.getElementById('app').inert=false;
   window.removeEventListener('pagehide',finish);
   document.removeEventListener('visibilitychange',onVisibility);
   reduced.removeEventListener('change',onMotion);
  }
  function onVisibility(){if(document.hidden)finish()}
  function onMotion(){if(reduced.matches)finish()}
  window.addEventListener('pagehide',finish,{once:true});
  reduced.addEventListener('change',onMotion);
  document.addEventListener('visibilitychange',onVisibility);
  document.getElementById('app').inert=true;
  document.querySelector('meta[name=theme-color]').content='#94ed67';
  timer=setTimeout(finish,6500);
  if(reduced.matches){await activation;finish();return}
  await Promise.all([activation,document.fonts.ready,new Promise(resolve=>setTimeout(resolve,Math.max(0,1350-(performance.now()-startTime))))]);
  if(ended)return;
  root.classList.add('wallet-departing');
  cover.addEventListener('animationend',event=>{if(event.target===cover)finish()});
  clearTimeout(timer);timer=setTimeout(finish,1020);
 }
 function transition(from,to,style,outgoing,oldScroll){
  clear();
  if(!from||from===to||reduced.matches||document.hidden)return;
  const page=document.querySelector('.vscreen');
  if(!page)return;
  if(style==='forward'||style==='back'){
   const forward=style==='forward',timing={duration:300,easing:'cubic-bezier(.22,.7,.13,1)'};
   const animation=page.animate([{transform:'translateX('+(forward?'100%':'-24%')+')'},{transform:'translateX(0)'}],timing);
   let layer=null;
   if(outgoing){
    layer=document.createElement('div');layer.className='wallet-exit-layer '+(forward?'exit-behind':'exit-ahead');
    layer.inert=true;layer.setAttribute('aria-hidden','true');
    for(const element of outgoing.querySelectorAll('[id]'))element.removeAttribute('id');
    outgoing.style.marginTop=-oldScroll+'px';layer.append(outgoing);page.before(layer);
    layer.animate([{transform:'translateX(0)'},{transform:'translateX('+(forward?'-24%':'100%')+')'}],timing);
   }
   page.classList.add('pushed-page');
   const clean=()=>{layer?.remove();page.classList.remove('pushed-page')};
   animation.finished.then(clean,clean);
   stopTransition=()=>{animation.cancel();clean()};
   return;
  }
  const dock=document.querySelector('.vdock'),previous=dock?.querySelector('[data-v="'+from+'"]'),selected=dock?.querySelector('[aria-current]');
  if(previous&&selected){
   const marker=document.createElement('i');marker.className='vselection';marker.setAttribute('aria-hidden','true');
   marker.style.left=selected.offsetLeft+'px';marker.style.width=selected.offsetWidth+'px';
   dock.prepend(marker);dock.classList.add('dock-moving');
   const settle=()=>{marker.remove();dock.classList.remove('dock-moving')};
   marker.animate([{transform:'translateX('+(previous.offsetLeft-selected.offsetLeft)+'px)'},{transform:'translateX(0)'}],{duration:225,easing:'cubic-bezier(.22,.7,.13,1)'}).finished.then(settle,settle);
  }
  const track=document.createElement('div');track.className='wallet-load-track';
  track.setAttribute('role','status');track.setAttribute('aria-label','Loading '+to);
  track.innerHTML='<i></i>';
  page.before(track);
  const delay=tabTimes[to]??260;
  track.style.setProperty('--load-time',delay+'ms');
  page.classList.add('page-waiting');page.setAttribute('aria-busy','true');page.inert=true;
  // Let Safari commit the blank loading surface before starting its timings.
  let done,reveal;
  const frame=requestAnimationFrame(()=>{
   reveal=setTimeout(()=>{
   page.inert=false;page.removeAttribute('aria-busy');page.classList.replace('page-waiting','page-appearing');track.classList.add('track-done');
  },delay);
  done=setTimeout(()=>{track.remove();page.classList.remove('page-appearing')},delay+180);
  });
  stopTransition=()=>{
   cancelAnimationFrame(frame);clearTimeout(reveal);clearTimeout(done);track.remove();page.inert=false;page.removeAttribute('aria-busy');page.classList.remove('page-waiting','page-appearing');
  };
 }
 reduced.addEventListener('change',()=>{if(reduced.matches)clear()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
 return {clear,transition,assets,launch};
})();

// Keep one-finger scrolling, carousels and form controls usable at the installed viewport size.
function preventZoom(event){if(event.cancelable)event.preventDefault()}
for(const name of ['gesturestart','gesturechange','gestureend']){
 document.addEventListener(name,preventZoom,{passive:false});
}
for(const name of ['touchstart','touchmove']){
 document.addEventListener(name,event=>{if(event.touches.length>1)preventZoom(event)},{passive:false});
}
document.addEventListener('dblclick',event=>{
 if(!event.target.closest('input,textarea,[contenteditable="true"]'))preventZoom(event);
},{passive:false});
let lastTap=null;
document.addEventListener('touchend',event=>{
 const point=event.changedTouches[0];
 if(!point||event.touches.length||event.target.closest('button,a,input,textarea,select,[contenteditable="true"]')){lastTap=null;return}
 if(lastTap&&lastTap.target===event.target&&event.timeStamp-lastTap.time<290&&Math.hypot(point.clientX-lastTap.x,point.clientY-lastTap.y)<22){
  preventZoom(event);lastTap=null;return;
 }
 lastTap={target:event.target,time:event.timeStamp,x:point.clientX,y:point.clientY};
},{passive:false});
document.addEventListener('touchcancel',()=>{lastTap=null},{passive:true});
document.addEventListener('wheel',event=>{if(event.ctrlKey)preventZoom(event)},{passive:false});
