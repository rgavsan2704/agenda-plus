// Keep an open agenda current without discarding an active form or study timer.
(() => {
 const current=13;let pending=null,checking=false,dirty=false;
 const busy=()=>document.visibilityState!=='visible'||!!document.querySelector('dialog[open]')||dirty||(typeof timer!=='undefined'&&timer!==null)||/classroom=|setup=/.test(location.hash);
 function apply(){
  if(!pending||busy())return;
  const target=String(pending);
  if(sessionStorage.getItem('agenda-plus-update-attempt')===target)return;
  sessionStorage.setItem('agenda-plus-update-attempt',target);
  const url=new URL(location.href);url.searchParams.set('actualizar',target);location.replace(url.href);
 }
 async function check(){
  if(checking||!navigator.onLine)return;checking=true;
  try{const response=await fetch('version.json',{cache:'no-store'});if(!response.ok)return;const info=await response.json();
   if(!Number.isInteger(info.version)||info.version<=current)return;
   pending=info.version;
   if('serviceWorker'in navigator){const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update()}
   if(busy())toast('Nueva versión disponible. Se aplicará cuando termines de editar o estudiar.');apply();
  }catch{/* Offline: keep the installed version and local data. */}finally{checking=false}
 }
 document.addEventListener('input',e=>{if(e.target.closest('form'))dirty=true});
 document.addEventListener('submit',()=>{setTimeout(()=>{dirty=false;apply()},0)});
 document.querySelector('#dialog')?.addEventListener('close',()=>{dirty=false;apply()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check()});
 window.addEventListener('online',check);
 if(sessionStorage.getItem('agenda-plus-update-attempt')===String(current))sessionStorage.removeItem('agenda-plus-update-attempt');
 setInterval(()=>{if(pending)apply();else check()},60000);check();
})();
