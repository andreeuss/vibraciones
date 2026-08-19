const ORDINARY=[
{id:'inicio',label:'ORACIÓN INICIO'},
{id:'pan',label:'LECTURA LIBRO “PAN NUESTRO”'},
{id:'evangelio',label:'LECTURA EVANGELIO - Fragmento'},
{id:'fisica',label:'VIBRACIÓN FÍSICA'},
{id:'espiritual',label:'VIBRACIÓN ESPIRITUAL'},
{id:'familias',label:'VIBRACIÓN FAMILIAS'},
{id:'general',label:'VIBRACIÓN GENERAL'},
{id:'final',label:'ORACIÓN FINAL'}];
const PEOPLE=[
{name:'Angelica'},{name:'Anita Salcedo'},{name:'Anita Suarez',noPan:true},{name:'Carol'},
{name:'Daniel'},{name:'Hector',coordinator:true},{name:'Nikol'},{name:'Samuel'},{name:'Sergio'},{name:'Yilian'}];
const GREETINGS=[
'Que la paz de Jesús nos acompañe en este encuentro, elevando nuestros pensamientos y fortaleciendo en nosotros la disposición de servir con fraternidad.',
'Que iniciemos este encuentro con serenidad y pensamientos elevados, unidos en la oración, la fraternidad y el propósito sincero de servir.',
'Que la luz del Evangelio nos inspire en este encuentro, fortaleciendo nuestros corazones en la caridad, la armonía y el servicio fraterno.',
'Que nuestros pensamientos se eleven en este encuentro y que la paz de Jesús fortalezca en cada uno el compromiso con el bien y la caridad.'
];
const SEED_HISTORY=[{date:'2026-08-12',bookId:'pan-nuestro',bookName:'Pan Nuestro',chapter:54,patient:true,participants:['Anita Suarez','Carol','Nikol','Yilian','Hector','Sergio','Anita Salcedo','Daniel','Angelica'],ordinary:{inicio:'Anita Suarez',pan:'Carol',evangelio:'Nikol',fisica:'Sergio',espiritual:'Anita Salcedo',familias:'Daniel',general:'Yilian',final:'Angelica'},specials:{patientWorker:'Yilian',workerVibration:'Nikol',readingPatients:'Hector',evangelioWithVibration:true},resting:[],reentered:[]}];
const $=id=>document.getElementById(id);
const state={hasPatient:false,schedule:null,locks:{},greeting:0,chapterManual:false,resting:[],reentered:[],exemptSpecial:[],shift:1,audit:null};
function safeParse(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}}
function history(){const h=safeParse('vibraciones_history',[]);return Array.isArray(h)&&h.length?h:SEED_HISTORY.slice()}
function saveHistory(h){localStorage.setItem('vibraciones_history',JSON.stringify(h))}
function restQueue(){return safeParse('vibraciones_rest_queue',[])}
function saveRestQueue(q){localStorage.setItem('vibraciones_rest_queue',JSON.stringify([...new Set(q)]))}
function books(){const b=safeParse('vibraciones_books',null);return Array.isArray(b)&&b.length?b:[{id:'pan-nuestro',name:'Pan Nuestro',chapters:window.CHAPTERS||{}}]}
function saveBooks(b){localStorage.setItem('vibraciones_books',JSON.stringify(b))}
function isoToday(){const d=new Date();const z=d.getTimezoneOffset();return new Date(d-z*60000).toISOString().slice(0,10)}
function previousMeeting(){const d=$('date').value;return history().filter(x=>x.date<d).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||null}
function selected(){return [...document.querySelectorAll('#people input[type=checkbox]:checked')].map(x=>x.value)}
function person(name){return PEOPLE.find(p=>p.name===name)||{name}}
function idx(task){return ORDINARY.findIndex(x=>x.id===task)}
function dist(from,to){return (idx(to)-idx(from)+ORDINARY.length)%ORDINARY.length}
function nextTask(task,shift){return ORDINARY[(idx(task)+shift)%ORDINARY.length].id}
function renderPeople(){const prev=previousMeeting();$('people').innerHTML=PEOPLE.map(p=>`<label class="person"><input type="checkbox" value="${p.name}" ${p.coordinator?'checked disabled':(p.name==='Samuel'?'':'checked')}><span class="name">${p.name}</span>${p.noPan?'<span class="chip">No Pan Nuestro</span>':''}${p.coordinator?'<span class="chip">Coordinador</span>':''}</label>`).join(''); refreshSpecialSelects(); renderPrevious();}
function refreshSpecialSelects(){const list=selected();for(const id of ['patient','worker']){const el=$(id),old=el.value;el.innerHTML=list.map(n=>`<option>${n}</option>`).join('');if(list.includes(old))el.value=old;else if(id==='patient'&&list.includes('Yilian'))el.value='Yilian';else if(id==='worker'&&list.includes('Nikol'))el.value='Nikol';}}
function initBooks(){const b=books();$('book').innerHTML=b.map(x=>`<option value="${x.id}">${x.name}</option>`).join(''); updateChapter();}
function currentBook(){return books().find(x=>x.id===$('book').value)||books()[0]}
function updateChapter(){const b=currentBook();if(!b)return;let no=1;const prev=history().filter(x=>x.date<$('date').value&&x.bookId===b.id).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);if(prev)no=(+prev.chapter||0)+1;if(state.chapterManual)no=+$('manualNo').value||no;const title=state.chapterManual&&$('manualTitle').value.trim()?$('manualTitle').value.trim():(b.chapters?.[String(no)]||`Capítulo ${no}`);$('chNo').textContent=no;$('bookName').textContent=b.name;$('chTitle').textContent=title;$('manualNo').value=no;$('manualTitle').value=title;}
function determineShift(prev,activeNames){let s=1;if(!prev)return s;for(let tries=0;tries<8;tries++){const bad=activeNames.some(n=>{const old=Object.entries(prev.ordinary||{}).find(([,v])=>v===n)?.[0];return old&&person(n).noPan&&nextTask(old,s)==='pan'});if(!bad)return s;s++;}return s;}
function chooseActive(prev){const sel=selected().filter(n=>n!=='Hector');const q=restQueue();const specials=[];if(state.hasPatient){const pw=$('patient').value,wv=$('worker').value,linked=$('linkEv').checked;if(pw&&pw!=='Hector')specials.push(pw);if(wv&&wv!=='Hector'&&!linked)specials.push(wv)}
let candidates=sel.slice();state.exemptSpecial=[];
for(const n of specials){if(candidates.length>8&&candidates.includes(n)){candidates=candidates.filter(x=>x!==n);state.exemptSpecial.push(n)}}
const returning=q.filter(n=>candidates.includes(n));const newcomers=candidates.filter(n=>!Object.values(prev?.ordinary||{}).includes(n));
state.resting=[];state.reentered=returning.slice();
while(candidates.length>8){let rest=null;const finalPrev=prev?.ordinary?.final;if(finalPrev&&candidates.includes(finalPrev)&&!returning.includes(finalPrev)&&!newcomers.includes(finalPrev))rest=finalPrev;
if(!rest){const continuing=candidates.filter(n=>!returning.includes(n)&&!newcomers.includes(n));rest=continuing.at(-1)||candidates.at(-1)}
candidates=candidates.filter(n=>n!==rest);state.resting.push(rest)}
return {active:candidates,returning,newcomers};}
function solveAssignment(prev,active,shift,fixed={}){const tasks=ORDINARY.map(x=>x.id);const oldByPerson={};for(const [t,n] of Object.entries(prev?.ordinary||{}))oldByPerson[n]=t;
const names=active.slice();
if(names.length<8&&selected().includes('Hector'))names.push('Hector');
const allowed=(n,t)=>{if(person(n).noPan&&t==='pan')return false;if(fixed[t]&&fixed[t]!==n)return false;for(const [ft,fn] of Object.entries(fixed))if(fn===n&&ft!==t)return false;
const old=oldByPerson[n];if(!old)return true;const d=dist(old,t);if(d===0)return false;const isFixed=Object.entries(fixed).some(([ft,fn])=>ft===t&&fn===n);return isFixed?d>0:d>=Math.min(shift,7)};
const score=(n,t)=>{const old=oldByPerson[n];if(!old)return 20-idx(t)*.01;const d=dist(old,t);let s=100-(d-shift)*8;if(d===shift)s+=80;return s};
let best=null,bestScore=-1e9;const used=new Set();const assign={};
for(const [t,n] of Object.entries(fixed)){if(!names.includes(n)&&n!=='Hector')return null;if(!allowed(n,t))return null;assign[t]=n;used.add(n)}
const openTasks=tasks.filter(t=>!assign[t]);
function rec(i,total){if(i===openTasks.length){if(total>bestScore){bestScore=total;best={...assign}}return}const t=openTasks[i];for(const n of names){if(used.has(n))continue;if(!allowed(n,t))continue;used.add(n);assign[t]=n;rec(i+1,total+score(n,t));delete assign[t];used.delete(n)}}
rec(0,0);return best;}
function generate(preserveLocks=false){const prev=previousMeeting();refreshSpecialSelects();const {active}=chooseActive(prev);state.shift=determineShift(prev,active);
const fixed=preserveLocks?{...state.locks}:{};
if(state.hasPatient&&$('linkEv').checked){const w=$('worker').value;if(w)fixed.evangelio=w}
state.fixed={...fixed};let result=solveAssignment(prev,active,state.shift,fixed);
if(!result){state.schedule=null;state.audit=buildAudit(prev,null,active);renderAll();return}
state.schedule=result;state.audit=buildAudit(prev,result,active);renderAll();}
function buildAudit(prev,schedule,active){const selectedNames=selected();const assigned=new Set(schedule?Object.values(schedule):[]);if(state.hasPatient){assigned.add($('patient').value);assigned.add($('worker').value)}assigned.add('Hector');const reps=[],backs=[],missing=[];if(schedule&&prev){for(const [t,n] of Object.entries(schedule)){const old=Object.entries(prev.ordinary||{}).find(([,v])=>v===n)?.[0];if(old){const d=dist(old,t);if(d===0)reps.push(n);const fixedHere=state.fixed&&state.fixed[t]===n;if(!fixedHere&&d<state.shift&&d!==0)backs.push(n)}}}
for(const n of selectedNames){if(!assigned.has(n)&&!state.resting.includes(n))missing.push(n)}
const noPan=schedule?Object.entries(schedule).some(([t,n])=>t==='pan'&&person(n).noPan):false;const valid=!!schedule&&!reps.length&&!backs.length&&!missing.length&&!noPan;
return {valid,reps,backs,missing,noPan,shift:state.shift,resting:state.resting.slice(),reentered:state.reentered.slice(),exemptSpecial:state.exemptSpecial.slice()};}
function renderAll(){renderProgram();renderAdmin();renderAudit();renderPrevious();}
function taskLabel(t){if(t==='pan')return `LECTURA LIBRO “${currentBook().name.toUpperCase()}” – ${$('chNo').textContent}. ${$('chTitle').textContent}`;return ORDINARY.find(x=>x.id===t)?.label||t}
function renderProgram(){const card=$('programCard');if(!state.schedule){card.classList.remove('hidden');$('status').className='status error';$('status').textContent='No existe una combinación válida con las reglas actuales. Revisa participantes, tareas especiales o asignaciones manuales.';$('program').innerHTML='';return}card.classList.remove('hidden');$('status').className='status';$('status').textContent='Rotación válida: rueda aplicada sin repeticiones ni retrocesos.';
$('program').innerHTML=ORDINARY.map(t=>`<div class="row"><div class="task">${taskLabel(t.id)}</div><select data-task="${t.id}">${selected().map(n=>`<option ${state.schedule[t.id]===n?'selected':''}>${n}</option>`).join('')}</select></div>`).join('')+specialRows();
$('program').querySelectorAll('select[data-task]').forEach(s=>s.onchange=()=>{state.locks[s.dataset.task]=s.value;});}
function specialRows(){if(!state.hasPatient)return `<div class="row"><div class="task">LECTURA DE PACIENTES</div><div class="responsible">Hector</div></div>`;return `<div class="row"><div class="task">PACIENTE TRABAJADOR GENE</div><div class="responsible">${$('patient').value}</div></div><div class="row"><div class="task">VIBRACIÓN POR TRABAJADOR</div><div class="responsible">${$('worker').value}</div></div><div class="row"><div class="task">LECTURA DE PACIENTES</div><div class="responsible">Hector</div></div>`;}
function renderAdmin(){const a=$('admin');if(!state.schedule){a.innerHTML='<span class="muted">Genera la programación para consultar el listado.</span>';return}const rows=[];rows.push(['ORACIÓN INICIO',state.schedule.inicio]);rows.push([taskLabel('pan'),state.schedule.pan]);rows.push(['LECTURA EVANGELIO - Fragmento',state.schedule.evangelio]);if(state.hasPatient){rows.push(['PACIENTE TRABAJADOR GENE',$('patient').value]);rows.push(['VIBRACIÓN POR TRABAJADOR',$('worker').value])}rows.push(['LECTURA DE PACIENTES','Hector']);for(const t of ['fisica','espiritual','familias','general','final'])rows.push([taskLabel(t),state.schedule[t]]);a.innerHTML=rows.map(([t,n])=>`<div class="row"><div class="task">${t}</div><div class="responsible">${n}</div></div>`).join('')+(state.resting.length?`<div class="note"><b>Descansa esta semana:</b> ${state.resting.join(', ')}</div>`:'')+(state.reentered.length?`<div class="note"><b>Reingresa esta semana:</b> ${state.reentered.join(', ')}</div>`:'');}
function renderAudit(){const a=state.audit||{valid:false,shift:1,resting:[],reentered:[],reps:[],backs:[],missing:[]};$('audit').innerHTML=[
['Rotación',a.valid?'Válida':'Revisar',a.valid?'ok':'error'],['Desplazamiento',`+${a.shift||1}`,a.shift>1?'warn':'ok'],['Repeticiones',a.reps?.length?a.reps.join(', '):'0',a.reps?.length?'error':'ok'],['Retrocesos',a.backs?.length?a.backs.join(', '):'0',a.backs?.length?'error':'ok'],['Descansa',a.resting?.length?a.resting.join(', '):'—',a.resting?.length?'warn':'ok'],['Reingresa',a.reentered?.length?a.reentered.join(', '):'—','ok']].map(([k,v,c])=>`<div class="audit-item audit-${c}"><span>${k}</span><b>${v}</b></div>`).join('');$('auditNote').textContent=a.missing?.length?`Participantes sin ubicación: ${a.missing.join(', ')}.`:(a.valid?'Todas las personas seleccionadas están contabilizadas con tarea, responsabilidad especial o descanso explícito.':'La programación requiere revisión antes de generar el mensaje.');}
function renderPrevious(){const p=previousMeeting();if(!p){$('previous').innerHTML='<span class="muted">No hay reunión anterior.</span>';return}const rows=[];for(const t of ORDINARY)if(p.ordinary?.[t.id])rows.push([t.id==='pan'?`LECTURA LIBRO – ${p.chapter}`:t.label,p.ordinary[t.id]]);if(p.specials?.patientWorker)rows.splice(3,0,['PACIENTE TRABAJADOR GENE',p.specials.patientWorker],['VIBRACIÓN POR TRABAJADOR',p.specials.workerVibration]);rows.splice(p.specials?.patientWorker?5:3,0,['LECTURA DE PACIENTES','Hector']);$('previous').innerHTML=`<div class="muted" style="margin-bottom:7px">${p.date}</div>`+rows.map(([t,n])=>`<div class="row"><div class="task">${t}</div><div class="responsible">${n}</div></div>`).join('');}
function whatsapp(){if(!state.schedule||!state.audit?.valid)return '';const lines=[GREETINGS[state.greeting%GREETINGS.length],''];const add=(t,n)=>{lines.push(`*${t}*`);lines.push(`_${n}_`);lines.push('')};add('ORACIÓN INICIO',state.schedule.inicio);add(taskLabel('pan'),state.schedule.pan);add('LECTURA EVANGELIO - Fragmento',state.schedule.evangelio);if(state.hasPatient){add('PACIENTE TRABAJADOR GENE',$('patient').value);add('VIBRACIÓN POR TRABAJADOR',$('worker').value)}add('LECTURA DE PACIENTES','Hector');for(const t of ['fisica','espiritual','familias','general','final'])add(taskLabel(t),state.schedule[t]);lines.push('*Nos vemos hoy a las 6:55.*','','Bendiciones');return lines.join('\n')}
function renderMessage(){const txt=whatsapp();if(!txt){alert('La auditoría debe estar válida antes de generar el mensaje.');return}$('messageCard').classList.remove('hidden');$('messageCard').open=true;$('preview').textContent=txt;}
function saveMeeting(){if(!state.schedule||!state.audit?.valid)return;const h=history().filter(x=>x.date!==$('date').value);const b=currentBook();h.push({date:$('date').value,bookId:b.id,bookName:b.name,chapter:+$('chNo').textContent,patient:state.hasPatient,participants:selected(),ordinary:{...state.schedule},specials:{patientWorker:state.hasPatient?$('patient').value:null,workerVibration:state.hasPatient?$('worker').value:null,readingPatients:'Hector',evangelioWithVibration:state.hasPatient?$('linkEv').checked:false},resting:state.resting.slice(),reentered:state.reentered.slice(),shift:state.shift});h.sort((a,b)=>a.date.localeCompare(b.date));saveHistory(h);let q=restQueue();for(const n of state.reentered)q=q.filter(x=>x!==n);for(const n of state.resting)if(!q.includes(n))q.push(n);saveRestQueue(q);alert('Reunión guardada. La próxima programación tomará esta reunión como referencia.');renderPrevious();updateChapter();}
function togglePatient(v){state.hasPatient=v;$('pYes').classList.toggle('active',v);$('pNo').classList.toggle('active',!v);$('patientFields').classList.toggle('hidden',!v);$('linkWrap').classList.toggle('hidden',!v);refreshSpecialSelects()}
$('date').value=isoToday();initBooks();renderPeople();renderAudit();
$('date').onchange=()=>{state.locks={};state.schedule=null;updateChapter();renderPeople();renderAdmin();renderAudit()};$('book').onchange=()=>{state.chapterManual=false;updateChapter()};
$('people').onchange=()=>{refreshSpecialSelects();state.schedule=null;renderAdmin()};$('pYes').onclick=()=>togglePatient(true);$('pNo').onclick=()=>togglePatient(false);
$('generate').onclick=()=>{state.locks={};generate(false);$('programCard').open=true;$('auditCard').open=true};$('reorg').onclick=()=>generate(true);$('reset').onclick=()=>{state.locks={};generate(false)};$('makeMsg').onclick=renderMessage;
$('greeting').onclick=()=>{state.greeting++;renderMessage()};$('copy').onclick=async()=>{await navigator.clipboard.writeText(whatsapp());alert('Mensaje copiado')};$('share').onclick=async()=>{const text=whatsapp();if(navigator.share)await navigator.share({text});else window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank')};$('save').onclick=saveMeeting;
$('changeChapter').onclick=()=>{$('chapterEdit').classList.toggle('hidden');state.chapterManual=true;updateChapter()};$('manualNo').oninput=updateChapter;$('manualTitle').oninput=updateChapter;
$('addBook').onclick=()=>$('bookEdit').classList.toggle('hidden');$('saveBook').onclick=()=>{const name=$('newBookName').value.trim(),chap=$('newBookChapters').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!name||!chap.length)return alert('Escribe el nombre y los capítulos.');const b=books();const id='book-'+Date.now();const chapters={};chap.forEach((x,i)=>chapters[String(i+1)]=x);b.push({id,name,chapters});saveBooks(b);initBooks();$('book').value=id;state.chapterManual=false;updateChapter();$('bookEdit').classList.add('hidden')};
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
