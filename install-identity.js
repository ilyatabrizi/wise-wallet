const installRoot=new URL('./',location.href);
let identityToken='';
function applyInstallIdentity(){
 const key=/^#look=([\w-]{43})$/.exec(location.hash)?.[1]||localStorage.getItem(appearanceKey+':activation');
 const touch=document.querySelector('link[rel=apple-touch-icon]');
 if(touch.href!==personal.icon)touch.href=personal.icon;
 const token=(key||'')+'|'+personal.format+'|'+personal.icon.length;
 if(identityToken===token)return;
 identityToken=token;
 const launch=new URL('install.html',installRoot);
 if(key)launch.hash='look='+key;
 const manifest={id:installRoot.href,start_url:launch.href,scope:installRoot.href,name:'Wise Wallet',short_name:'Wise',display:'standalone',theme_color:'#fafafa',background_color:'#fafafa',icons:[{src:personal.icon,sizes:'any',type:'image/png',purpose:'any'}]};
 document.querySelector('link[rel=manifest]').href='data:application/manifest+json,'+encodeURIComponent(JSON.stringify(manifest));
}
