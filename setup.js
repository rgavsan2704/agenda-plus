// One-click private setup. Personal configuration is carried in a URL fragment,
// never in this repository or a request to the hosting server.
function validatePrivateSetup(input){
 const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x),text=(x,n=200)=>typeof x==='string'&&x.length<=n;
 const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(new Date(x+'T12:00').getTime());
 const time=x=>typeof x==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(x);
 if(input?.version!==1||!Array.isArray(input.subjects)||input.subjects.length>100||!Array.isArray(input.classes)||input.classes.length>200||!Array.isArray(input.schoolDays)||input.schoolDays.length>400)throw Error('Configuración no válida');
 const subjects=input.subjects.map(s=>{if(!id(s.id)||!text(s.name,100)||!/^#[a-f\d]{6}$/i.test(s.color))throw Error('Asignatura no válida');return {id:s.id,name:s.name,color:s.color}});
 const subjectIds=new Set(subjects.map(s=>s.id));if(subjectIds.size!==subjects.length)throw Error('Asignaturas duplicadas');
 const classes=input.classes.map(c=>{if(!id(c.id)||!subjectIds.has(c.subject)||!/^\d$/.test(String(c.day))||Number(c.day)>6||!time(c.start)||!time(c.end)||c.start>=c.end)throw Error('Clase no válida');return {id:c.id,subject:c.subject,day:String(c.day),start:c.start,end:c.end,room:text(c.room,300)?c.room:''}});
 if(new Set(classes.map(c=>c.id)).size!==classes.length)throw Error('Clases duplicadas');
 const schoolDays=input.schoolDays.map(d=>{if(!id(d.id)||!date(d.date)||!text(d.label,200))throw Error('Fecha no válida');return {id:d.id,date:d.date,label:d.label,lective:!!d.lective,source:text(d.source,300)?d.source:'Configuración personal'}});
 const s=input.school;if(!s||!date(s.start)||!date(s.end)||s.start>s.end||!text(s.name)||!text(s.course)||!text(s.year,30))throw Error('Calendario no válido');
 const school={name:s.name,course:s.course,year:s.year,start:s.start,end:s.end,checked:text(s.checked,30)?s.checked:'',notice:text(s.notice,1200)?s.notice:'',sources:Array.isArray(s.sources)?s.sources.filter(x=>text(x.title)&&text(x.url,1500)&&/^https:\/\//.test(x.url)).map(x=>({title:x.title,url:x.url})):[]};if(date(s.regularEnd))school.regularEnd=s.regularEnd;
 const aliases=new Map(Object.entries(input.aliases||{}).filter(([from,to])=>id(from)&&subjectIds.has(to)));
 return {subjects,classes,schoolDays,school,aliases};
}
function mergePrivateSetup(current,setup){
 const remap=item=>({...item,subject:setup.aliases.get(item.subject)||item.subject});
 const incomingIds=new Set(setup.subjects.map(s=>s.id)),incomingClasses=new Set(setup.classes.map(c=>c.id));
 const classes=current.classes.filter(c=>!incomingClasses.has(c.id)).map(remap);
 for(const c of setup.classes)if(!classes.some(x=>x.subject===c.subject&&String(x.day)===c.day&&x.start===c.start&&x.end===c.end))classes.push(c);
 const schoolDays=new Map((current.schoolDays||[]).map(d=>[d.date,d]));for(const day of setup.schoolDays)if(!schoolDays.has(day.date))schoolDays.set(day.date,day);
 return {...current,subjects:[...setup.subjects,...current.subjects.filter(s=>!incomingIds.has(s.id)&&!setup.aliases.has(s.id))],classes,schoolDays:[...schoolDays.values()],school:setup.school,tasks:current.tasks.map(remap),grades:current.grades.map(remap),notes:current.notes.map(remap)};
}
async function applyPrivateSetup(){const fragment=new URLSearchParams(location.hash.slice(1)),encoded=fragment.get('setup');if(!encoded)return;history.replaceState(null,'',location.pathname+location.search);try{
 if(encoded.length>50000)throw Error('Enlace demasiado grande');toast('Configurando tu agenda…');
 const bytes=Uint8Array.from(atob(encoded.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));const reader=stream.getReader();let size=0;const chunks=[];
 for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>200000){await reader.cancel();throw Error('Configuración demasiado grande')}chunks.push(part.value)}
 const input=JSON.parse(await new Blob(chunks).text()),setup=validatePrivateSetup(input),previous=db;localStorage.setItem('agenda-plus-backup-before-setup',JSON.stringify(previous));db=mergePrivateSetup(db,setup);if(!save()){db=previous;return}setView('horario');toast('Tu horario y asignaturas ya están configurados. Tus tareas y notas se han conservado.');
 }catch{toast('No se pudo aplicar el enlace de configuración. Vuelve a abrir el enlace privado.')}}
applyPrivateSetup();
window.addEventListener('hashchange',applyPrivateSetup);

