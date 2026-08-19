const ORDINARY=[
{id:'inicio',label:'ORACIÓN INICIO'},
{id:'pan',label:'LECTURA LIBRO'},
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

const SEED=[{date:'2026-08-12',bookId:'pan-nuestro',bookName:'Pan Nuestro',chapter:54,chapterTitle:'Razón de los llamados',
participants:['Anita Suarez','Carol','Nikol','Yilian','Hector','Sergio','Anita Salcedo','Daniel','Angelica'],
ordinary:{inicio:'Anita Suarez',pan:'Carol',evangelio:'Nikol',fisica:'Sergio',espiritual:'Anita Salcedo',familias:'Daniel',general:'Yilian',final:'Angelica'},
specials:{patientWorker:'Yilian',workerVibration:'Nikol',readingPatients:'Hector',evangelioWithVibration:false},resting:[]}];

const $=id=>document.getElementById(id);
const state={hasPatient:false,schedule:null,locks:{},greeting:0,chapterManual:false,shift:1,resting:[],reentered:[],specialOnly:[]};

function parse(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f}catch{return f}}
function history(){const h=parse('vibraciones_history',[]);return Array.isArray(h)&&h.length?h:SEED.slice()}
function saveHistory(h){localStorage.setItem('vibraciones_history',JSON.stringify(h))}
function restQueue(){const q=parse('vibraciones_rest_queue',[]);return Array.isArray(q)?q:[]}
function saveRestQueue(q){localStorage.setItem('vibraciones_rest_queue',JSON.stringify([...new Set(q)]))}
function books(){const b=parse('vibraciones_books',null);if(Array.isArray(b)&&b.length){return b.map(x=>x.id==='pan-nuestro'?{...x,name:'Pan Nuestro',chapters:window.PAN_NUESTRO||x.chapters||{}}:x)}return [{id:'pan-nuestro',name:'Pan Nuestro',chapters:window.PAN_NUESTRO||{}}]}
function saveBooks(b){localStorage.setItem('vibraciones_books',JSON.stringify(b))}
function isoToday(){const d=new Date(),z=d.getTimezoneOffset();return new Date(d-z*60000).toISOString().slice(0,10)}
function prevMeeting(){return history().filter(x=>x.date<$('date').value).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||null}
function selected(){return [...document.querySelectorAll('#people input[type=checkbox]:checked')].map(x=>x.value)}
function person(n){return PEOPLE.find(p=>p.name===n)||{name:n}}
function idx(t){return ORDINARY.findIndex(x=>x.id===t)}
function dist(a,b){return (idx(b)-idx(a)+8)%8}
function next(t,s){return ORDINARY[(idx(t)+s)%8].id}
function oldTask(prev,n){return Object.entries(prev?.ordinary||{}).find(([,v])=>v===n)?.[0]||null}

function initPeople(){
 $('people').innerHTML=PEOPLE.map(p=>`<label class="person"><input type="checkbox" value="${p.name}" ${p.coordinator?'checked disabled':(p.name==='Samuel'?'':'checked')}><span class="name">${p.name}</span>${p.noPan?'<span class="chip">No Pan Nuestro</span>':''}${p.coordinator?'<span class="chip">Coordinador</span>':''}</label>`).join('');
 document.querySelectorAll('#people input').forEach(x=>x.addEventListener('change',()=>{refreshSpecials();renderPrevious()}));
 refreshSpecials();
}

function refreshSpecials(){
 const list=selected(), pOld=$('patient')?.value, wOld=$('worker')?.value;
 for(const id of ['patient','worker']){
  const el=$(id); if(!el)return;
  el.innerHTML=list.map(n=>`<option>${n}</option>`).join('');
  if(id==='patient'&&list.includes(pOld))el.value=pOld;
  else if(id==='worker'&&list.includes(wOld))el.value=wOld;
  else if(id==='patient'&&list.includes('Yilian'))el.value='Yilian';
  else if(id==='worker'&&list.includes('Nikol'))el.value='Nikol';
 }
 syncWorkerRule();
}

function syncWorkerRule(){
 const w=$('worker').value, wasDisabled=$('linkEv').disabled;
 if(w==='Hector'){
  $('linkEv').checked=false;$('linkEv').disabled=true;
  $('linkHint').textContent='Héctor conserva sus responsabilidades especiales sin modificar la rotación ordinaria.';
  $('linkHint').classList.remove('hidden');
 }else{
  $('linkEv').disabled=false;if(wasDisabled)$('linkEv').checked=true;
  $('linkHint').textContent='Si está marcado, esa persona realiza Evangelio + Vibración por trabajador y no recibe otra actividad ordinaria.';
  $('linkHint').classList.remove('hidden');
 }
}

function initBooks(){
 $('book').innerHTML=books().map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
 updateChapter();
}
function currentBook(){return books().find(b=>b.id===$('book').value)||books()[0]}
function updateChapter(){
 const b=currentBook(); if(!b)return;
 let no=1;
 const prev=history().filter(x=>x.date<$('date').value&&x.bookId===b.id).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
 if(prev)no=(+prev.chapter||0)+1;
 if(state.chapterManual)no=+$('manualNo').value||no;
 const title=state.chapterManual&&$('manualTitle').value.trim()
   ?$('manualTitle').value.trim()
   :(b.chapters?.[String(no)]||b.chapters?.[no]||`Capítulo ${no}`);
 $('chNo').textContent=no;$('bookName').textContent=b.name;$('chTitle').textContent=title;
 $('manualNo').value=no;$('manualTitle').value=title;
}

function determineShift(prev,names){
 if(!prev)return 1;
 let s=1;
 while(s<8){
  const anitaOld=oldTask(prev,'Anita Suarez');
  if(names.includes('Anita Suarez')&&anitaOld&&next(anitaOld,s)==='pan'){s++;continue}
  return s;
 }
 return 1;
}

function chooseOrdinaryPeople(prev){
 let names=selected().filter(n=>n!=='Hector');
 const q=restQueue(), returning=q.filter(n=>names.includes(n));
 const newcomers=names.filter(n=>!oldTask(prev,n));
 state.resting=[];state.reentered=returning.slice();state.specialOnly=[];

 if(state.hasPatient&&names.length>8){
  const worker=$('worker').value, patient=$('patient').value, linked=$('linkEv').checked&&worker!=='Hector';
  if(!linked&&worker!=='Hector'&&names.includes(worker)&&names.length>8){names=names.filter(n=>n!==worker);state.specialOnly.push(worker)}
  if(patient!=='Hector'&&names.includes(patient)&&names.length>8){names=names.filter(n=>n!==patient);state.specialOnly.push(patient)}
 }
 while(names.length>8){
  let r=null, finalPrev=prev?.ordinary?.final;
  if(finalPrev&&names.includes(finalPrev)&&!returning.includes(finalPrev)&&!newcomers.includes(finalPrev))r=finalPrev;
  if(!r)r=names.find(n=>!returning.includes(n)&&!newcomers.includes(n))||names.at(-1);
  names=names.filter(n=>n!==r);state.resting.push(r);
 }
 return names;
}

function solve(prev,names,shift,fixed){
 let pool=names.slice();
 const fixedNames=Object.values(fixed);
 if((pool.length<8||fixedNames.includes('Hector'))&&!pool.includes('Hector'))pool.push('Hector');
 if(pool.length<8)return null;

 const old={};for(const n of pool)old[n]=oldTask(prev,n);
 function allowed(n,t){
  if(person(n).noPan&&t==='pan')return false;
  if(fixed[t]&&fixed[t]!==n)return false;
  for(const [ft,fn] of Object.entries(fixed))if(fn===n&&ft!==t)return false;
  if(n==='Hector'&&!fixedNames.includes('Hector')&&names.length>=8)return false;
  const o=old[n]; if(!o)return true;
  if(fixed[t]===n)return true;
  const d=dist(o,t); return d>=shift && d>0;
 }
 function score(n,t){
  const o=old[n]; if(!o)return 20-idx(t)/100;
  const d=dist(o,t); return d===shift?200:120-(d-shift)*12;
 }
 const assign={},used=new Set();
 for(const [t,n] of Object.entries(fixed)){
  if(!pool.includes(n))return null;if(!allowed(n,t))return null;assign[t]=n;used.add(n);
 }
 const open=ORDINARY.map(x=>x.id).filter(t=>!assign[t]);
 let best=null,bestScore=-1e9;
 function rec(i,s){
  if(i===open.length){if(s>bestScore){bestScore=s;best={...assign}}return}
  const t=open[i];
  for(const n of pool){if(used.has(n)||!allowed(n,t))continue;used.add(n);assign[t]=n;rec(i+1,s+score(n,t));delete assign[t];used.delete(n)}
 }
 rec(0,0); return best;
}

function fixedRules(){
 const f={...state.locks};
 if(state.hasPatient){
  const w=$('worker').value;
  if(w!=='Hector'&&$('linkEv').checked)f.evangelio=w;
 }
 return f;
}

function generate(keepLocks=false){
 const prev=prevMeeting(), names=chooseOrdinaryPeople(prev);
 state.shift=determineShift(prev,names);
 const fixed=keepLocks?fixedRules():(state.hasPatient&&$('worker').value!=='Hector'&&$('linkEv').checked?{evangelio:$('worker').value}:{});
 state.locks=keepLocks?state.locks:{};
 state.schedule=solve(prev,names,state.shift,fixed);
 renderProgram();renderAdmin();renderPrevious();
}

function taskLabel(t){
 if(t==='pan')return `LECTURA LIBRO “${currentBook().name.toUpperCase()}” – ${$('chNo').textContent}. ${$('chTitle').textContent}`;
 return ORDINARY.find(x=>x.id===t)?.label||t;
}

function validate(){
 if(!state.schedule)return 'No existe una combinación válida con las reglas actuales.';
 const vals=Object.values(state.schedule);
 if(new Set(vals).size!==8)return 'Hay una persona repetida dentro de las actividades ordinarias.';
 if(state.schedule.pan==='Anita Suarez')return 'Anita Suárez no puede realizar la lectura de Pan Nuestro.';
 for(const t of ORDINARY)if(!state.schedule[t.id])return `Falta cubrir ${t.label}.`;
 return '';
}

function renderProgram(){
 $('programCard').classList.remove('hidden');
 const err=validate();$('errorBox').textContent=err;$('errorBox').classList.toggle('hidden',!err);
 if(!state.schedule){$('program').innerHTML='';return}
 const opts=selected();
 $('program').innerHTML=ORDINARY.map(t=>`<div class="row"><div class="task">${taskLabel(t.id)}</div><select data-task="${t.id}">${opts.map(n=>`<option ${state.schedule[t.id]===n?'selected':''}>${n}</option>`).join('')}</select></div>`).join('')+specialRows();
 document.querySelectorAll('#program select[data-task]').forEach(s=>s.onchange=()=>state.locks[s.dataset.task]=s.value);
}
function specialRows(){
 let x='';
 if(state.hasPatient)x+=`<div class="row"><div class="task">PACIENTE TRABAJADOR GENE</div><div class="responsible">${$('patient').value}</div></div><div class="row"><div class="task">VIBRACIÓN POR TRABAJADOR</div><div class="responsible">${$('worker').value}</div></div>`;
 x+=`<div class="row"><div class="task">LECTURA DE PACIENTES</div><div class="responsible">Hector</div></div>`;
 return x;
}

function adminRows(){
 if(!state.schedule)return [];
 const r=[['ORACIÓN INICIO',state.schedule.inicio],[taskLabel('pan'),state.schedule.pan],['LECTURA EVANGELIO - Fragmento',state.schedule.evangelio]];
 if(state.hasPatient){r.push(['PACIENTE TRABAJADOR GENE',$('patient').value],['VIBRACIÓN POR TRABAJADOR',$('worker').value])}
 r.push(['LECTURA DE PACIENTES','Hector']);
 for(const t of ['fisica','espiritual','familias','general','final'])r.push([taskLabel(t),state.schedule[t]]);
 return r;
}
function renderAdmin(){
 if(!state.schedule){$('admin').innerHTML='<span class="muted">Genera la programación para consultar el listado.</span>';return}
 $('admin').innerHTML=adminRows().map(([t,n])=>`<div class="row"><div class="task">${t}</div><div class="responsible">${n}</div></div>`).join('')+
 (state.resting.length?`<div class="note"><b>Descansa esta semana:</b> ${state.resting.join(', ')}</div>`:'')+
 (state.reentered.length?`<div class="note"><b>Reingresa esta semana:</b> ${state.reentered.join(', ')}</div>`:'');
}

function renderPrevious(){
 const p=prevMeeting();if(!p){$('previous').innerHTML='<span class="muted">No hay reunión anterior.</span>';return}
 const book=p.bookName||'Pan Nuestro',ct=p.chapterTitle||((p.bookId==='pan-nuestro'&&(window.PAN_NUESTRO?.[p.chapter]||window.PAN_NUESTRO?.[String(p.chapter)]))||`Capítulo ${p.chapter}`);
 const r=[['ORACIÓN INICIO',p.ordinary?.inicio],[`LECTURA LIBRO “${book.toUpperCase()}” – ${p.chapter}. ${ct}`,p.ordinary?.pan],['LECTURA EVANGELIO - Fragmento',p.ordinary?.evangelio]];
 if(p.specials?.patientWorker)r.push(['PACIENTE TRABAJADOR GENE',p.specials.patientWorker],['VIBRACIÓN POR TRABAJADOR',p.specials.workerVibration]);
 r.push(['LECTURA DE PACIENTES','Hector']);
 for(const t of ['fisica','espiritual','familias','general','final'])r.push([ORDINARY.find(x=>x.id===t).label,p.ordinary?.[t]]);
 $('previous').innerHTML=`<div class="muted" style="margin-bottom:7px">${p.date}</div>`+r.filter(x=>x[1]).map(([t,n])=>`<div class="row"><div class="task">${t}</div><div class="responsible">${n}</div></div>`).join('');
}

function message(){
 const err=validate();if(err){$('errorBox').textContent=err;$('errorBox').classList.remove('hidden');$('programCard').open=true;return}
 const r=adminRows(),g=GREETINGS[state.greeting%GREETINGS.length];
 const text=g+'\n\n'+r.map(([t,n])=>`*${t}*\n_${n}_`).join('\n\n')+'\n\n\n*Nos vemos hoy a las 6:55.*\n\nBendiciones';
 $('preview').textContent=text;$('preview').dataset.text=text;$('messageCard').classList.remove('hidden');$('messageCard').open=true;
}
function saveMeeting(){
 const err=validate();if(err)return;
 const b=currentBook(),h=history().filter(x=>x.date!==$('date').value);
 h.push({date:$('date').value,bookId:b.id,bookName:b.name,chapter:+$('chNo').textContent,chapterTitle:$('chTitle').textContent,
 participants:selected(),ordinary:{...state.schedule},specials:{patientWorker:state.hasPatient?$('patient').value:null,workerVibration:state.hasPatient?$('worker').value:null,readingPatients:'Hector',evangelioWithVibration:state.hasPatient&&$('worker').value!=='Hector'&&$('linkEv').checked},resting:state.resting.slice()});
 h.sort((a,b)=>a.date.localeCompare(b.date));saveHistory(h);
 let q=restQueue().filter(n=>!state.reentered.includes(n));q.push(...state.resting);saveRestQueue(q);
 alert('Reunión guardada. La próxima lectura avanzará automáticamente.');
}

$('pNo').onclick=()=>{state.hasPatient=false;$('pNo').classList.add('active');$('pYes').classList.remove('active');$('patientFields').classList.add('hidden');$('linkWrap').classList.add('hidden');$('linkHint').classList.add('hidden')};
$('pYes').onclick=()=>{state.hasPatient=true;$('pYes').classList.add('active');$('pNo').classList.remove('active');$('patientFields').classList.remove('hidden');$('linkWrap').classList.remove('hidden');$('linkHint').classList.remove('hidden');refreshSpecials()};
$('worker').onchange=syncWorkerRule;
$('generate').onclick=()=>generate(false);
$('reorg').onclick=()=>generate(true);
$('reset').onclick=()=>{state.locks={};generate(false)};
$('makeMsg').onclick=message;
$('greeting').onclick=()=>{state.greeting++;message()};
$('copy').onclick=async()=>{await navigator.clipboard.writeText($('preview').dataset.text||'');alert('Mensaje copiado.')};
$('share').onclick=async()=>{const text=$('preview').dataset.text||'';if(navigator.share)await navigator.share({text});else window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank')};
$('save').onclick=saveMeeting;
$('changeChapter').onclick=()=>{$('chapterEdit').classList.toggle('hidden');state.chapterManual=!$('chapterEdit').classList.contains('hidden');updateChapter()};
$('manualNo').oninput=updateChapter;$('manualTitle').oninput=updateChapter;
$('addBook').onclick=()=> $('bookEdit').classList.toggle('hidden');
$('saveBook').onclick=()=>{const name=$('newBookName').value.trim(),lines=$('newBookChapters').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!name||!lines.length)return;const id='book-'+Date.now(),chapters={};lines.forEach((x,i)=>chapters[i+1]=x);const b=books();b.push({id,name,chapters});saveBooks(b);initBooks();$('book').value=id;state.chapterManual=false;updateChapter();$('bookEdit').classList.add('hidden')};
$('book').onchange=()=>{state.chapterManual=false;updateChapter()};
$('date').onchange=()=>{state.chapterManual=false;updateChapter();renderPrevious()};
$('date').value=isoToday();initPeople();initBooks();renderPrevious();