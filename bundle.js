// One private link can configure a new device and transfer tasks together.
async function importAgendaBundle(){
 const encoded=new URLSearchParams(location.hash.slice(1)).get('bundle');if(!encoded)return;
 history.replaceState(null,'',location.pathname+location.search);
 try{
  if(encoded.length>80000)throw Error();
  const bytes=Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),parts=[];let size=0;
  for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>250000){await reader.cancel();throw Error()}parts.push(part.value)}
  const payload=JSON.parse(await new Blob(parts).text());
  const setup=validatePrivateSetup(payload.setup),tasks=validateClassroomTasks(payload.tasks),previous=db;
  const result=mergeClassroomTasks(mergePrivateSetup(db,setup),tasks);
  localStorage.setItem('agenda-plus-backup-before-bundle',JSON.stringify(previous));db=result.next;
  if(!save()){db=previous;return}setView('horario');toast('Agenda configurada: horario, asignaturas, calendario y tareas. Tus datos anteriores se conservan.');
 }catch{toast('No se pudo configurar. Abre el enlace completo con su parte #bundle.')}
}
importAgendaBundle();window.addEventListener('hashchange',importAgendaBundle);
