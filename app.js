const ORDINARY=[
  {id:'inicio',label:'ORACIÓN INICIO'},
  {id:'pan',label:'LECTURA LIBRO'},
  {id:'evangelio',label:'LECTURA EVANGELIO - Fragmento'},
  {id:'fisica',label:'VIBRACIÓN FÍSICA'},
  {id:'espiritual',label:'VIBRACIÓN ESPIRITUAL'},
  {id:'familias',label:'VIBRACIÓN FAMILIAS'},
  {id:'general',label:'VIBRACIÓN GENERAL'},
  {id:'final',label:'ORACIÓN FINAL'}
];

const PEOPLE=[
  {name:'Angelica'},
  {name:'Anita Salcedo'},
  {name:'Anita Suarez',noPan:true},
  {name:'Carol'},
  {name:'Daniel'},
  {name:'Hector',coordinator:true},
  {name:'Nikol'},
  {name:'Samuel'},
  {name:'Sergio'},
  {name:'Yilian'}
];

const GREETINGS=[
  'Que la paz de Jesús nos acompañe en este encuentro, elevando nuestros pensamientos y fortaleciendo en nosotros la disposición de servir con fraternidad.',
  'Que la paz del Cristo habite en cada uno de ustedes y en sus familias, iluminando sus pensamientos, fortaleciendo sus corazones y guiando este encuentro bajo la armonía del bien.',
  'Que iniciemos este encuentro con serenidad y pensamientos elevados, unidos en la oración, la fraternidad y el propósito sincero de servir.',
  'Que la luz del Evangelio nos inspire en este encuentro, fortaleciendo nuestros corazones en la caridad, la armonía y el servicio fraterno.',
  'Que nuestros pensamientos se eleven en este encuentro y que la paz de Jesús fortalezca en cada uno el compromiso con el bien y la caridad.'
];

const SEED_HISTORY=[{
  date:'2026-08-12',
  bookId:'pan-nuestro',
  bookName:'Pan Nuestro',
  chapter:54,
  chapterTitle:'Razón de los llamados',
  participants:['Anita Suarez','Carol','Nikol','Yilian','Hector','Sergio','Anita Salcedo','Daniel','Angelica'],
  ordinary:{inicio:'Anita Suarez',pan:'Carol',evangelio:'Nikol',fisica:'Sergio',espiritual:'Anita Salcedo',familias:'Daniel',general:'Yilian',final:'Angelica'},
  specials:{patientWorker:'Yilian',workerVibration:'Nikol',readingPatients:'Hector',evangelioWithVibration:true,patientCanOrdinary:false,patientAllowed:[]},
  resting:[],
  reentered:[]
}];

const $=id=>document.getElementById(id);

const state={
  hasPatient:false,
  schedule:null,
  manualLocks:{},
  greeting:0,
  chapterOverride:null,
  shift:1,
  resting:[],
  reentered:[],
  specialOnly:[],
  error:'',
  loadingDate:false
};

function safeParse(key,fallback){
  try{
    const value=JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  }catch{
    return fallback;
  }
}

function history(){
  const h=safeParse('vibraciones_history',[]);
  return Array.isArray(h)&&h.length?h:SEED_HISTORY.slice();
}

function saveHistory(h){
  localStorage.setItem('vibraciones_history',JSON.stringify(h));
}

function books(){
  const stored=safeParse('vibraciones_books',null);
  if(Array.isArray(stored)&&stored.length){
    return stored.map(b=>b.id==='pan-nuestro'
      ? {...b,name:'Pan Nuestro',chapters:window.PAN_NUESTRO||b.chapters||{}}
      : b
    );
  }
  return [{id:'pan-nuestro',name:'Pan Nuestro',chapters:window.PAN_NUESTRO||{}}];
}

function saveBooks(b){
  localStorage.setItem('vibraciones_books',JSON.stringify(b));
}

function isoToday(){
  const d=new Date(),z=d.getTimezoneOffset();
  return new Date(d-z*60000).toISOString().slice(0,10);
}

function person(name){
  return PEOPLE.find(p=>p.name===name)||{name};
}

function idx(task){
  return ORDINARY.findIndex(x=>x.id===task);
}

function dist(from,to){
  const a=idx(from),b=idx(to);
  if(a<0||b<0)return 0;
  return (b-a+ORDINARY.length)%ORDINARY.length;
}

function nextTask(task,shift){
  const i=idx(task);
  return i<0?null:ORDINARY[(i+shift)%ORDINARY.length].id;
}

function selected(){
  return [...document.querySelectorAll('#people input[type=checkbox]:checked')].map(x=>x.value);
}

function currentMeeting(){
  return history().find(x=>x.date===$('date').value)||null;
}

function previousMeeting(){
  const d=$('date').value;
  return history().filter(x=>x.date<d).sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||null;
}

function oldTask(prev,name){
  return Object.entries(prev?.ordinary||{}).find(([,n])=>n===name)?.[0]||null;
}

function taskShort(task){
  if(!task)return 'Sin actividad ordinaria';
  if(task==='pan')return 'Lectura libro';
  return ORDINARY.find(x=>x.id===task)?.label||task;
}

function toast(msg){
  const el=$('toast');
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('show'),2600);
}

function upsertHistory(record){
  const h=history().filter(x=>x.date!==record.date);
  h.push(record);
  h.sort((a,b)=>a.date.localeCompare(b.date));
  saveHistory(h);
}

function migrateV4(){
  if(localStorage.getItem('vibraciones_v4_migrated')==='1')return;

  let h=history().filter(x=>x.date<'2026-09-16');

  const confirmed={
    schemaVersion:4,
    date:'2026-09-09',
    bookId:'pan-nuestro',
    bookName:'Pan Nuestro',
    chapter:58,
    chapterTitle:'Contribuir',
    participants:['Angelica','Anita Salcedo','Anita Suarez','Carol','Daniel','Hector','Nikol','Samuel','Sergio','Yilian'],
    ordinary:{
      inicio:'Angelica',
      pan:'Anita Salcedo',
      evangelio:'Nikol',
      fisica:'Yilian',
      espiritual:'Daniel',
      familias:'Anita Suarez',
      general:'Carol',
      final:'Sergio'
    },
    specials:{
      patientWorker:'Samuel',
      workerVibration:'Nikol',
      readingPatients:'Hector',
      evangelioWithVibration:true,
      patientCanOrdinary:false,
      patientAllowed:[]
    },
    resting:[],
    reentered:[]
  };

  h=h.filter(x=>x.date!==confirmed.date);
  h.push(confirmed);
  h.sort((a,b)=>a.date.localeCompare(b.date));
  saveHistory(h);
  localStorage.setItem('vibraciones_v4_migrated','1');
}

function derivedRestQueue(beforeDate){
  const q=[];
  const meetings=history().filter(x=>x.date<beforeDate).sort((a,b)=>a.date.localeCompare(b.date));

  for(const m of meetings){
    for(const n of (m.reentered||[])){
      const i=q.indexOf(n);
      if(i>=0)q.splice(i,1);
    }
    for(const n of (m.resting||[])){
      if(!q.includes(n))q.push(n);
    }
  }
  return q;
}

function currentBook(){
  return books().find(b=>b.id===$('book').value)||books()[0];
}

function initBooks(){
  const list=books();
  $('book').innerHTML=list.map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
}

function chapterForDate(){
  const b=currentBook();
  if(!b)return {no:1,title:'Capítulo 1'};

  if(state.chapterOverride!=null){
    const no=+state.chapterOverride;
    return {no,title:b.chapters?.[String(no)]||b.chapters?.[no]||`Capítulo ${no}`};
  }

  const same=currentMeeting();
  if(same&&same.bookId===b.id){
    const no=+same.chapter||1;
    return {no,title:same.chapterTitle||b.chapters?.[String(no)]||b.chapters?.[no]||`Capítulo ${no}`};
  }

  const prev=history().filter(x=>x.date<$('date').value&&x.bookId===b.id).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  const no=prev?(+prev.chapter||0)+1:1;
  return {no,title:b.chapters?.[String(no)]||b.chapters?.[no]||`Capítulo ${no}`};
}

function populateChapterSelect(){
  const b=currentBook();
  const entries=Object.entries(b?.chapters||{}).sort((a,b)=>+a[0]-+b[0]);
  $('chapterSelect').innerHTML=entries.map(([n,t])=>`<option value="${n}">${n} · ${t}</option>`).join('');
  $('chapterSelect').value=String($('chNo').textContent);
}

function updateChapter(){
  const b=currentBook();
  if(!b)return;
  const ch=chapterForDate();
  $('chNo').textContent=ch.no;
  $('bookName').textContent=b.name;
  $('chTitle').textContent=ch.title;
  populateChapterSelect();
}

function renderPeople(participants=null){
  const activeSet=new Set(participants||PEOPLE.map(p=>p.name));
  $('people').innerHTML=PEOPLE.map(p=>{
    const checked=p.coordinator||activeSet.has(p.name);
    return `<label class="person">
      <input type="checkbox" value="${p.name}" ${checked?'checked':''} ${p.coordinator?'disabled':''}>
      <span class="name">${p.name}</span>
      ${p.noPan?'<span class="chip">No Pan Nuestro</span>':''}
      ${p.coordinator?'<span class="chip">Coordinador</span>':''}
    </label>`;
  }).join('');

  document.querySelectorAll('#people input').forEach(x=>x.addEventListener('change',()=>{
    clearGenerated();
    refreshSpecialSelects();
  }));
}

function setPatientUI(on){
  state.hasPatient=!!on;
  $('pYes').classList.toggle('active',state.hasPatient);
  $('pNo').classList.toggle('active',!state.hasPatient);
  $('patientFields').classList.toggle('hidden',!state.hasPatient);
  $('patientExtraWrap').classList.toggle('hidden',!state.hasPatient);
  $('linkWrap').classList.toggle('hidden',!state.hasPatient);
  $('linkHint').classList.toggle('hidden',!state.hasPatient);
  refreshSpecialSelects();
  renderPatientAllowed();
}

function refreshSpecialSelects(saved=null){
  const list=selected();
  const patientOld=saved?.patientWorker||$('patient')?.value;
  const workerOld=saved?.workerVibration||$('worker')?.value;

  for(const id of ['patient','worker']){
    const el=$(id);
    const old=id==='patient'?patientOld:workerOld;
    el.innerHTML=list.map(n=>`<option>${n}</option>`).join('');

    if(old&&list.includes(old))el.value=old;
    else if(id==='patient'&&list.includes('Samuel'))el.value='Samuel';
    else if(id==='worker'&&list.includes('Nikol'))el.value='Nikol';
    else if(list.length)el.value=list[0];
  }
  syncWorkerRule();
}

function syncWorkerRule(){
  if(!state.hasPatient)return;

  const worker=$('worker').value;
  const prev=previousMeeting();
  const previousTask=oldTask(prev,worker);
  const disabledBefore=$('linkEv').disabled;

  if(worker==='Hector'){
    $('linkEv').checked=false;
    $('linkEv').disabled=true;
    $('linkHint').textContent='Héctor conserva sus responsabilidades especiales sin modificar la rueda ordinaria.';
  }else if(previousTask==='evangelio'){
    $('linkEv').checked=false;
    $('linkEv').disabled=true;
    $('linkHint').textContent=`${worker} realizó Evangelio el miércoles anterior; esta semana no puede repetirlo.`;
  }else{
    $('linkEv').disabled=false;
    if(disabledBefore)$('linkEv').checked=true;
    $('linkHint').textContent='Si está marcado, esta persona realiza Evangelio + Vibración por trabajador.';
  }
}

function renderPatientAllowed(savedAllowed=null){
  if(!state.hasPatient)return;

  $('patientAllowed').classList.toggle('hidden',!$('patientExtra').checked);
  const allowed=new Set(savedAllowed||['inicio','pan','evangelio','final']);

  $('patientAllowedList').innerHTML=ORDINARY.map(t=>`<label>
    <input type="checkbox" value="${t.id}" ${allowed.has(t.id)?'checked':''}>
    <span>${t.id==='pan'?'Lectura libro':t.label}</span>
  </label>`).join('');

  document.querySelectorAll('#patientAllowedList input').forEach(x=>x.addEventListener('change',clearGenerated));
}

function patientAllowed(){
  if(!$('patientExtra').checked)return [];
  return [...document.querySelectorAll('#patientAllowedList input:checked')].map(x=>x.value);
}

function loadDateState(){
  state.loadingDate=true;
  state.manualLocks={};
  state.schedule=null;
  state.error='';
  state.resting=[];
  state.reentered=[];
  state.specialOnly=[];
  state.chapterOverride=null;

  const rec=currentMeeting();
  renderPeople(rec?.participants||null);

  if(rec?.bookId&&books().some(b=>b.id===rec.bookId))$('book').value=rec.bookId;
  else $('book').value='pan-nuestro';

  setPatientUI(!!rec?.specials?.patientWorker);

  if(rec?.specials){
    refreshSpecialSelects(rec.specials);
    $('patientExtra').checked=!!rec.specials.patientCanOrdinary;
    renderPatientAllowed(rec.specials.patientAllowed||[]);
    $('linkEv').checked=!!rec.specials.evangelioWithVibration;
    syncWorkerRule();
  }else{
    $('patientExtra').checked=false;
    renderPatientAllowed();
    if($('worker').value!=='Hector')$('linkEv').checked=true;
  }

  updateChapter();

  if(rec?.ordinary){
    state.schedule={...rec.ordinary};
    state.resting=[...(rec.resting||[])];
    state.reentered=[...(rec.reentered||[])];
    renderProgram();
  }else{
    $('programCard').classList.add('hidden');
    $('program').innerHTML='';
  }

  $('messageCard').classList.add('hidden');
  state.loadingDate=false;
}

function determineShift(prev,names){
  if(!prev)return 1;

  let shift=1;
  while(shift<ORDINARY.length){
    const old=oldTask(prev,'Anita Suarez');
    if(names.includes('Anita Suarez')&&old&&nextTask(old,shift)==='pan'){
      shift++;
      continue;
    }
    return shift;
  }
  return 1;
}

function configError(){
  if(!state.hasPatient)return '';

  const p=$('patient').value;
  const w=$('worker').value;

  if(!$('patientExtra').checked&&p===w&&$('linkEv').checked){
    return 'El paciente está configurado sin actividad ordinaria y al mismo tiempo como responsable del Evangelio. Ajusta una de las dos opciones.';
  }

  if($('patientExtra').checked&&!patientAllowed().length){
    return 'Marcaste que el paciente puede realizar otra actividad, pero no seleccionaste ninguna actividad permitida.';
  }

  return '';
}

function chooseOrdinaryPeople(prev,forcedNames=new Set()){
  let names=selected().filter(n=>n!=='Hector');
  state.resting=[];
  state.reentered=[];
  state.specialOnly=[];

  if(state.hasPatient){
    const patient=$('patient').value;
    const worker=$('worker').value;
    const linked=$('linkEv').checked&&worker!=='Hector';

    if(!$('patientExtra').checked&&patient!=='Hector'&&!forcedNames.has(patient)){
      names=names.filter(n=>n!==patient);
      state.specialOnly.push(patient);
    }

    if(!linked&&worker!=='Hector'&&names.length>8&&!forcedNames.has(worker)){
      names=names.filter(n=>n!==worker);
      if(!state.specialOnly.includes(worker))state.specialOnly.push(worker);
    }
  }

  const queue=derivedRestQueue($('date').value);
  const returning=queue.filter(n=>names.includes(n));
  const newcomers=names.filter(n=>!oldTask(prev,n));
  state.reentered=returning.slice();

  while(names.length>8){
    const finalPrev=prev?.ordinary?.final;
    const protectedNames=new Set([...returning,...newcomers,...forcedNames]);
    let rest=null;

    if(finalPrev&&names.includes(finalPrev)&&!protectedNames.has(finalPrev)){
      rest=finalPrev;
    }

    if(!rest){
      rest=names.find(n=>!protectedNames.has(n))||names.find(n=>!forcedNames.has(n))||null;
    }

    if(!rest)break;
    names=names.filter(n=>n!==rest);
    state.resting.push(rest);
  }

  return names;
}

function prevalidateFixed(prev,fixed,shift){
  const used=new Map();

  for(const [task,name] of Object.entries(fixed)){
    if(used.has(name)&&used.get(name)!==task){
      return `${name} no puede quedar en dos actividades ordinarias.`;
    }
    used.set(name,task);

    if(person(name).noPan&&task==='pan'){
      return 'Anita Suárez no realiza la lectura de Pan Nuestro.';
    }

    if(state.hasPatient&&name===$('patient').value){
      if(!$('patientExtra').checked){
        return `${name} está configurado únicamente como paciente.`;
      }
      if(!patientAllowed().includes(task)){
        return `${name} no está habilitado para ${taskShort(task)}.`;
      }
    }

    const old=oldTask(prev,name);
    if(old){
      const d=dist(old,task);
      if(d===0)return `${name} realizó ${taskShort(task)} en el miércoles anterior y no puede repetirla.`;
      if(d<shift)return `${name} no puede retroceder dentro de la rotación.`;
    }
  }

  return '';
}

function solve(prev,names,shift,fixed){
  let pool=names.slice();
  const fixedNames=new Set(Object.values(fixed));

  if((pool.length<8||fixedNames.has('Hector'))&&!pool.includes('Hector'))pool.push('Hector');
  if(pool.length<8)return null;

  function allowed(name,task){
    if(person(name).noPan&&task==='pan')return false;

    if(fixed[task]&&fixed[task]!==name)return false;
    for(const [ft,fn] of Object.entries(fixed)){
      if(fn===name&&ft!==task)return false;
    }

    if(name==='Hector'&&!fixedNames.has('Hector')&&names.length>=8)return false;

    if(state.hasPatient&&name===$('patient').value){
      if(!$('patientExtra').checked)return false;
      if(!patientAllowed().includes(task))return false;
    }

    const old=oldTask(prev,name);
    if(!old)return true;

    const d=dist(old,task);
    if(d===0)return false;
    return d>=shift;
  }

  function score(name,task){
    const old=oldTask(prev,name);
    if(!old)return 40-idx(task)/100;
    const d=dist(old,task);
    if(d===shift)return 500;
    return 300-(d-shift)*30;
  }

  const assign={};
  const used=new Set();

  for(const [task,name] of Object.entries(fixed)){
    if(!pool.includes(name)||!allowed(name,task))return null;
    assign[task]=name;
    used.add(name);
  }

  const open=ORDINARY.map(x=>x.id).filter(t=>!assign[t]);
  let best=null;
  let bestScore=-Infinity;

  function recurse(i,total){
    if(i===open.length){
      if(total>bestScore){
        bestScore=total;
        best={...assign};
      }
      return;
    }

    const task=open[i];
    for(const name of pool){
      if(used.has(name)||!allowed(name,task))continue;
      used.add(name);
      assign[task]=name;
      recurse(i+1,total+score(name,task));
      delete assign[task];
      used.delete(name);
    }
  }

  recurse(0,0);
  return best;
}

function computeSchedule({resetManual=false}={}){
  if(resetManual)state.manualLocks={};
  state.error='';

  const cfg=configError();
  if(cfg){
    state.schedule=null;
    state.error=cfg;
    renderProgram();
    return false;
  }

  const prev=previousMeeting();
  const forcedNames=new Set(Object.values(state.manualLocks));
  const names=chooseOrdinaryPeople(prev,forcedNames);
  state.shift=determineShift(prev,names);

  const fixed={...state.manualLocks};

  if(state.hasPatient){
    const worker=$('worker').value;

    if(worker!=='Hector'&&$('linkEv').checked){
      if(fixed.evangelio&&fixed.evangelio!==worker){
        state.error='El Evangelio está vinculado a quien realiza Vibración por trabajador. Quita esa vinculación o cambia la asignación.';
        state.schedule=null;
        renderProgram();
        return false;
      }

      for(const [task,name] of Object.entries(fixed)){
        if(name===worker&&task!=='evangelio'){
          state.error=`${worker} está vinculado a Evangelio y no puede tener otra actividad ordinaria.`;
          state.schedule=null;
          renderProgram();
          return false;
        }
      }
      fixed.evangelio=worker;
    }
  }

  const fixedError=prevalidateFixed(prev,fixed,state.shift);
  if(fixedError){
    state.schedule=null;
    state.error=fixedError;
    renderProgram();
    return false;
  }

  const result=solve(prev,names,state.shift,fixed);

  if(!result){
    state.schedule=null;
    if(state.hasPatient&&$('linkEv').checked&&$('worker').value!=='Hector'&&oldTask(prev,$('worker').value)==='evangelio'){
      state.error=`${$('worker').value} realizó Evangelio en el miércoles anterior. Desmarca la opción “también realiza Evangelio” o selecciona otra persona para Vibración por trabajador.`;
    }else{
      state.error='No existe una combinación completa que cumpla la rotación, las restricciones y los participantes seleccionados.';
    }
    renderProgram();
    return false;
  }

  state.schedule=result;
  renderProgram();
  return true;
}

function taskLabel(task){
  if(task==='pan'){
    return `LECTURA LIBRO “${currentBook().name.toUpperCase()}” – ${$('chNo').textContent}. ${$('chTitle').textContent}`;
  }
  return ORDINARY.find(x=>x.id===task)?.label||task;
}

function basicOptionRestriction(prev,name,task){
  if(person(name).noPan&&task==='pan')return 'No Pan Nuestro';

  if(state.hasPatient&&$('worker').value!=='Hector'&&$('linkEv').checked&&name===$('worker').value&&task!=='evangelio'){
    return 'Vinculado a Evangelio';
  }

  if(state.hasPatient&&name===$('patient').value){
    if(!$('patientExtra').checked)return 'Solo paciente';
    if(!patientAllowed().includes(task))return 'No habilitado hoy';
  }

  const old=oldTask(prev,name);
  if(old===task)return 'Misma actividad anterior';
  if(old&&dist(old,task)<state.shift)return 'Retroceso';
  return '';
}

function selectOptions(task,current){
  const prev=previousMeeting();
  return selected().map(name=>{
    const reason=basicOptionRestriction(prev,name,task);
    return `<option value="${name}" ${current===name?'selected':''} ${reason?'disabled':''}>${name}${reason?` — ${reason}`:''}</option>`;
  }).join('');
}

function renderProgram(){
  $('programCard').classList.remove('hidden');
  $('errorBox').textContent=state.error;
  $('errorBox').classList.toggle('hidden',!state.error);

  if(!state.schedule){
    $('program').innerHTML='';
    $('rotationNotes').innerHTML='';
    return;
  }

  const prev=previousMeeting();
  const linkedWorker=state.hasPatient&&$('worker').value!=='Hector'&&$('linkEv').checked?$('worker').value:null;

  let html=ORDINARY.map(t=>{
    const name=state.schedule[t.id];
    const isLinked=t.id==='evangelio'&&linkedWorker===name;

    return `<div class="row">
      <div class="task">
        ${taskLabel(t.id)}
        <small>Anterior de ${name}: ${taskShort(oldTask(prev,name))}</small>
      </div>
      <select data-task="${t.id}" ${isLinked?'disabled':''}>${selectOptions(t.id,name)}</select>
    </div>`;
  }).join('');

  if(state.hasPatient){
    html+=`<div class="row"><div class="task">PACIENTE TRABAJADOR GENE</div><div class="responsible">${$('patient').value}</div></div>`;
    html+=`<div class="row"><div class="task">VIBRACIÓN POR TRABAJADOR</div><div class="responsible">${$('worker').value}</div></div>`;
  }

  html+=`<div class="row"><div class="task">LECTURA DE PACIENTES</div><div class="responsible">Hector</div></div>`;
  $('program').innerHTML=html;

  document.querySelectorAll('#program select[data-task]').forEach(sel=>{
    sel.addEventListener('change',()=>{
      const task=sel.dataset.task;
      const chosen=sel.value;
      const previousSchedule={...state.schedule};
      const oldLocks={...state.manualLocks};

      for(const [t,n] of Object.entries(state.manualLocks)){
        if(n===chosen&&t!==task)delete state.manualLocks[t];
      }
      state.manualLocks[task]=chosen;

      const ok=computeSchedule({resetManual:false});
      if(!ok){
        state.manualLocks=oldLocks;
        state.schedule=previousSchedule;
        const msg=state.error||'No fue posible aplicar ese cambio.';
        state.error='';
        renderProgram();
        toast(msg);
      }else{
        $('messageCard').classList.add('hidden');
      }
    });
  });

  const notes=[];
  if(state.resting.length)notes.push(`<div class="note"><b>Descansa esta semana:</b> ${state.resting.join(', ')}</div>`);
  if(state.reentered.length)notes.push(`<div class="note"><b>Reingresa esta semana:</b> ${state.reentered.join(', ')}</div>`);
  $('rotationNotes').innerHTML=notes.join('');
}

function validateSchedule(){
  if(!state.schedule)return state.error||'Primero genera una programación válida.';
  const names=Object.values(state.schedule);
  if(new Set(names).size!==ORDINARY.length)return 'Hay una persona repetida dentro de las actividades ordinarias.';
  if(state.schedule.pan==='Anita Suarez')return 'Anita Suárez no realiza la lectura de Pan Nuestro.';
  return '';
}

function messageRows(){
  if(!state.schedule)return [];

  const rows=[
    ['ORACIÓN INICIO',state.schedule.inicio],
    [taskLabel('pan'),state.schedule.pan],
    ['LECTURA EVANGELIO - Fragmento',state.schedule.evangelio]
  ];

  if(state.hasPatient){
    rows.push(['PACIENTE TRABAJADOR GENE',$('patient').value]);
    rows.push(['VIBRACIÓN POR TRABAJADOR',$('worker').value]);
  }

  rows.push(['LECTURA DE PACIENTES','Hector']);

  for(const t of ['fisica','espiritual','familias','general','final']){
    rows.push([taskLabel(t),state.schedule[t]]);
  }

  return rows;
}

function saveCurrentSchedule(){
  const b=currentBook();
  const record={
    schemaVersion:4,
    date:$('date').value,
    bookId:b.id,
    bookName:b.name,
    chapter:+$('chNo').textContent,
    chapterTitle:$('chTitle').textContent,
    participants:selected(),
    ordinary:{...state.schedule},
    specials:{
      patientWorker:state.hasPatient?$('patient').value:null,
      workerVibration:state.hasPatient?$('worker').value:null,
      readingPatients:'Hector',
      evangelioWithVibration:state.hasPatient&&$('worker').value!=='Hector'&&$('linkEv').checked,
      patientCanOrdinary:state.hasPatient&&$('patientExtra').checked,
      patientAllowed:state.hasPatient&&$('patientExtra').checked?patientAllowed():[]
    },
    resting:[...state.resting],
    reentered:[...state.reentered]
  };

  upsertHistory(record);
}

function generateMessage(){
  const err=validateSchedule();
  if(err){
    state.error=err;
    renderProgram();
    return;
  }

  saveCurrentSchedule();

  const greeting=GREETINGS[state.greeting%GREETINGS.length];
  const text=greeting+'\n\n'+messageRows().map(([t,n])=>`*${t}*\n_${n}_`).join('\n\n')+
    '\n\n\n*Nos vemos hoy a las 6:55.*\n\nBendiciones';

  $('preview').textContent=text;
  $('preview').dataset.text=text;
  $('messageCard').classList.remove('hidden');
  $('messageCard').open=true;
  updateChapter();
}

function clearGenerated(){
  if(state.loadingDate)return;
  state.schedule=null;
  state.manualLocks={};
  state.error='';
  $('programCard').classList.add('hidden');
  $('messageCard').classList.add('hidden');
}

function addBook(){
  const name=$('newBookName').value.trim();
  const lines=$('newBookChapters').value.split('\n').map(x=>x.trim()).filter(Boolean);

  if(!name||!lines.length){
    toast('Escribe el nombre del libro y al menos un capítulo.');
    return;
  }

  const id='book-'+Date.now();
  const chapters={};
  lines.forEach((x,i)=>chapters[i+1]=x);

  const list=books();
  list.push({id,name,chapters});
  saveBooks(list);

  initBooks();
  $('book').value=id;
  state.chapterOverride=null;
  updateChapter();
  $('bookEdit').classList.add('hidden');
}

$('pNo').addEventListener('click',()=>{setPatientUI(false);clearGenerated();});
$('pYes').addEventListener('click',()=>{setPatientUI(true);clearGenerated();});
$('patient').addEventListener('change',clearGenerated);
$('worker').addEventListener('change',()=>{syncWorkerRule();clearGenerated();});
$('linkEv').addEventListener('change',clearGenerated);
$('patientExtra').addEventListener('change',()=>{renderPatientAllowed();clearGenerated();});
$('generate').addEventListener('click',()=>computeSchedule({resetManual:true}));
$('makeMsg').addEventListener('click',generateMessage);
$('greeting').addEventListener('click',()=>{state.greeting++;generateMessage();});

$('copy').addEventListener('click',async()=>{
  const text=$('preview').dataset.text||'';
  try{
    await navigator.clipboard.writeText(text);
    toast('Mensaje copiado.');
  }catch{
    toast('No fue posible copiar automáticamente.');
  }
});

$('share').addEventListener('click',async()=>{
  const text=$('preview').dataset.text||'';
  if(navigator.share){
    try{await navigator.share({text});}catch{}
  }else{
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }
});

$('changeChapter').addEventListener('click',()=>{
  $('chapterEdit').classList.toggle('hidden');
  populateChapterSelect();
});

$('chapterSelect').addEventListener('change',()=>{
  state.chapterOverride=+$('chapterSelect').value;
  updateChapter();
  clearGenerated();
});

$('book').addEventListener('change',()=>{
  state.chapterOverride=null;
  updateChapter();
  clearGenerated();
});

$('addBook').addEventListener('click',()=>$('bookEdit').classList.toggle('hidden'));
$('saveBook').addEventListener('click',addBook);
$('date').addEventListener('change',loadDateState);

function init(){
  migrateV4();
  $('date').value=isoToday();
  initBooks();
  loadDateState();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
}

init();