const installRoot=new URL('./',location.href);
const officialIcon='https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/42/33/c9/4233c9b2-6276-842b-a227-a5f7882318c9/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg';
let identityToken='';
function applyInstallIdentity(){
 const key=/^#look=([\w-]{43})$/.exec(location.hash)?.[1]||localStorage.getItem(appearanceKey+':activation');
 const touch=document.querySelector('link[rel=apple-touch-icon]');
 const cached=iconCached&&navigator.serviceWorker?.controller;
 touch.href=cached?new URL('personal-touch-v2.png',installRoot).href:personal.icon;
 const token=(key||'')+'|'+personal.format+'|'+Boolean(cached);
 if(identityToken===token)return;
 identityToken=token;
 const launch=new URL('install.html',installRoot);
 if(key)launch.hash='look='+key;
 const manifest={id:installRoot.href,start_url:launch.href,scope:installRoot.href,name:'Wise Wallet',short_name:'Wise',display:'standalone',theme_color:'#fafafa',background_color:'#fafafa',icons:[{src:personal.icon,sizes:'any',type:'image/png',purpose:'any'}]};
 document.querySelector('link[rel=manifest]').href='data:application/manifest+json,'+encodeURIComponent(JSON.stringify(manifest));
}
navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(personal)applyInstallIdentity()});
