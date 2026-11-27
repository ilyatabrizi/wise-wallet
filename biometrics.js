// A passkey's PRF wraps the encryption key. The recovery PIN remains an independent way in.
const faceLock = (() => {
 const random = length => crypto.getRandomValues(new Uint8Array(length));
 const unsupported = 'This device or passkey cannot unlock this wallet. Use your wallet PIN.';
 async function wrappingKey(credential){
  const secret = credential?.getClientExtensionResults().prf?.results?.first;
  if(!secret)throw Error(unsupported);
  return crypto.subtle.importKey('raw',secret,'AES-GCM',false,['wrapKey','unwrapKey']);
 }
 async function assertion(id,seed){
  return navigator.credentials.get({publicKey:{
   challenge:random(32),allowCredentials:[{type:'public-key',id:from64(id)}],
   timeout:60000,userVerification:'required',extensions:{prf:{eval:{first:from64(seed)}}}
  }});
 }
 async function enroll(){
  if(!window.PublicKeyCredential||!navigator.credentials?.create)throw Error(unsupported);
  const seed=to64(random(32));
  const credential=await navigator.credentials.create({publicKey:{
   challenge:random(32),rp:{name:'Personal Wallet'},
   user:{id:random(32),name:'Personal wallet',displayName:'Personal wallet'},
   pubKeyCredParams:[{type:'public-key',alg:-7}],timeout:60000,
   authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'required',userVerification:'required'},
   extensions:{prf:{eval:{first:from64(seed)}}}
  }});
  const id=to64(new Uint8Array(credential.rawId));
  if(credential.getClientExtensionResults().prf?.enabled===false)throw Error(unsupported);
  const k=await wrappingKey(credential.getClientExtensionResults().prf?.results?.first?credential:await assertion(id,seed));
  return {id,seed,k};
 }
 async function wrap(enrollment,pin,s){
  const iv=random(12),key=await derive(pin,s,true);
  const bytes=await crypto.subtle.wrapKey('raw',key,enrollment.k,{name:'AES-GCM',iv});
  return {id:enrollment.id,seed:enrollment.seed,iv:to64(iv),wrapped:to64(new Uint8Array(bytes))};
 }
 async function open(stored){
  const bio=stored.bio;
  const wrap=await wrappingKey(await assertion(bio.id,bio.seed));
  const k=await crypto.subtle.unwrapKey('raw',from64(bio.wrapped),wrap,{name:'AES-GCM',iv:from64(bio.iv)},'AES-GCM',false,['decrypt','encrypt']);
  return readEncrypted(stored,k);
 }
 return {enroll,wrap,open};
})();
