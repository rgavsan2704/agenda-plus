// Imports a private transfer link, not an ongoing connection to Classroom.
function validateClassroomTasks(payload){
 if(payload?.version!==1||!Array.isArray(payload.tasks)||payload.tasks.length>200)throw Error('Formato no válido');
 const text=(s,n)=>typeof s==='string'&&s.length<=n;
 return payload.tasks.map(t=>{
  if(!text(t.id,120)||!/^classroom-[a-zA-Z0-9_-]+$/.test(t.id)||!text(t.title,180)||!t.title.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||new Date(t.date+'T12:00Z').toISOString().slice(0,10)!==t.date||!['Tarea','Entrega','Examen'].includes(t.type)||!text(t.details,4500)||!text(t.subject,100)||!text(t.subjectName,100)||!/^https:\/\/classroom\.google\.com\/u\/0\/c\/[a-zA-Z0-9_-]+\/a\/[a-zA-Z0-9_-]+\/details(?:\?hl=es)?$/.test(t.sourceUrl))throw Error('Tarea no válida');
  return {id:t.id,title:t.title,date:t.date,type:t.type,details:t.details,subject:t.subject,subjectName:t.subjectName,sourceUrl:t.sourceUrl,done:t.done===true,time:'',priority:'Media',deadlineMode:'datetime'};
 });
}
function mergeClassroomTasks(current,incoming){
 const next=structuredClone(current);let added=0;
 for(const task of incoming){
  if(next.tasks.some(t=>t.id===task.id||(t.sourceUrl===task.sourceUrl&&t.title===task.title)||(t.title.trim().toLocaleLowerCase('es')===task.title.trim().toLocaleLowerCase('es')&&t.date===task.date)))continue;
  if(!next.subjects.some(s=>s.id===task.subject))next.subjects.push({id:task.subject,name:task.subjectName,color:'#639b83'});
  next.tasks.push(task);added++;
 }return {next,added};
}
async function importClassroomLink(){
 const params=new URLSearchParams(location.hash.slice(1)),encoded=params.get('classroom');if(!encoded)return;
 history.replaceState(null,'',location.pathname+location.search);
 try{
  if(encoded.length>60000)throw Error();
  const bytes=Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();let size=0;const parts=[];
  for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>200000){await reader.cancel();throw Error()}parts.push(part.value)}
  const tasks=validateClassroomTasks(JSON.parse(await new Blob(parts).text())),previous=db,result=mergeClassroomTasks(db,tasks);
  if(result.added){localStorage.setItem('agenda-plus-backup-before-classroom',JSON.stringify(previous));db=result.next;if(!save()){db=previous;return}}
  setView('tareas');toast(result.added?`${result.added} tareas de Classroom añadidas. Tus datos anteriores se conservan.`:'Estas tareas ya estaban en tu agenda. No se han duplicado.');
 }catch{toast('No se pudo importar Classroom. Vuelve a abrir el enlace completo.')}
}
importClassroomLink();window.addEventListener('hashchange',importClassroomLink);
