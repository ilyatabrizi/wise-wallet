const walletMotion = (() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 let stopTransition = () => {};
 const tabTimes = {home:220, cards:320, recipients:1160, payments:250};
 function clear(){stopTransition();stopTransition=()=>{}}
 function assets(theme){
  const cover=document.getElementById('launch-cover');
  if(!cover||!theme?.film)return;
  for(const [selector,key] of [['.launch-mark','launchMark'],['.launch-ribbon','launchRibbon']]){
   const src=theme.film[key];
   if(src)cover.querySelector(selector).style.setProperty('--art','url("'+src+'")');
  }
 }
 async function launch(activation){
  const root=document.documentElement, cover=document.getElementById('launch-cover');
  if(!cover||!root.classList.contains('wallet-opening')){await activation;return}
  let ended=false, timer;
  function finish(){
   if(ended)return;
   ended=true;
   clearTimeout(timer);
   root.classList.remove('wallet-opening','wallet-departing');
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
  timer=setTimeout(finish,6500);
  if(reduced.matches){await activation;finish();return}
  await Promise.all([activation,document.fonts.ready,new Promise(resolve=>setTimeout(resolve,Math.max(0,3150-performance.now())))]);
  if(ended)return;
  root.classList.add('wallet-departing');
  cover.addEventListener('animationend',event=>{if(event.target===cover)finish()});
  clearTimeout(timer);timer=setTimeout(finish,920);
 }
 function transition(from,to,style){
  clear();
  if(!from||from===to||reduced.matches||document.hidden)return;
  const page=document.querySelector('.vscreen');
  if(!page)return;
  if(style==='forward'||style==='back'){
   const offset=style==='forward'?'98%':'-22%';
   const animation=page.animate([{transform:'translateX('+offset+')',opacity:.75},{transform:'translateX(0)',opacity:1}],{duration:300,easing:'cubic-bezier(.22,.7,.13,1)'});
   stopTransition=()=>animation.cancel();
   return;
  }
  const track=document.createElement('div');track.className='wallet-load-track';
  track.setAttribute('role','status');track.setAttribute('aria-label','Loading '+to);
  track.innerHTML='<i></i>';
  page.before(track);
  const delay=tabTimes[to]??260;
  track.style.setProperty('--load-time',delay+'ms');
  page.classList.add('page-waiting');page.setAttribute('aria-busy','true');page.inert=true;
  const reveal=setTimeout(()=>{
   page.inert=false;page.removeAttribute('aria-busy');page.classList.replace('page-waiting','page-appearing');track.classList.add('track-done');
  },delay);
  const done=setTimeout(()=>{track.remove();page.classList.remove('page-appearing')},delay+180);
  stopTransition=()=>{
   clearTimeout(reveal);clearTimeout(done);track.remove();page.inert=false;page.removeAttribute('aria-busy');page.classList.remove('page-waiting','page-appearing');
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
document.addEventListener('wheel',event=>{if(event.ctrlKey)preventZoom(event)},{passive:false});
