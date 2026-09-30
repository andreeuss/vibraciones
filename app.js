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
  schemaVersion:5,
  date:'2026-08-12',
  bookId:'pan-nuestro',
  bookName:'Pan Nuestro',
  chapter:54,
  chapterTitle:'Razón de los llamados',
  participants:['Anita Suarez','Carol','Nikol','Yilian','Hector','Sergio','Anita Salcedo','Daniel','Angelica'],
  ordinary:{inicio:'Anita Suarez',pan:'Carol',evangelio:'Nikol',fisica:'Sergio',espiritual:'Anita Salcedo',familias:'Daniel',general:'Yilian',final:'Angelica'},
  specials:{patients:[{name:'Yilian',doesOrdinary:true,task:'general'}],workerVibration:'Nikol',readingPatients:'Hector',evangelioWithVibration:true},
  resting:[],
  reentered:[]
}];

const $=function(id){return document.getElementById(id);};

const state={
  hasPatients:false,
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
    return value==null?fallback:value;
  }catch(e){
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
    return stored.map(function(b){
      return b.id==='pan-nuestro'
        ? Object.assign({},b,{name:'Pan Nuestro',chapters:window.PAN_NUESTRO||b.chapters||{}})
        : b;
    });
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
  return PEOPLE.find(function(p){return p.name===name;})||{name:name};
}

function idx(task){
  return ORDINARY.findIndex(function(x){return x.id===task;});
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
  return Array.from(document.querySelectorAll('#people input[type=checkbox]:checked')).map(function(x){return x.value;});
}

function currentMeeting(){
  return history().find(function(x){return x.date===$('date').value;})||null;
}

function previousMeeting(){
  const d=$('date').value;
  return history().filter(function(x){return x.date<d;}).sort(function(a,b){return a.date.localeCompare(b.date);}).slice(-1)[0]||null;
}

function oldTask(prev,name){
  const entries=Object.entries((prev&&prev.ordinary)||{});
  const found=entries.find(function(entry){return entry[1]===name;});
  return found?found[0]:null;
}

function taskShort(task){
  if(!task)return 'Sin actividad ordinaria';
  if(task==='pan')return 'Lectura libro';
  const t=ORDINARY.find(function(x){return x.id===task;});
  return t?t.label:task;
}

function toast(msg){
  const el=$('toast');
  el.textContent=msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(function(){el.classList.remove('show');},2600);
}

function upsertHistory(record){
  const h=history().filter(function(x){return x.date!==record.date;});
  h.push(record);
  h.sort(function(a,b){return a.date.localeCompare(b.date);});
  saveHistory(h);
}

function normalizePatients(record){
  const sp=(record&&record.specials)||{};
  if(Array.isArray(sp.patients)){
    return sp.patients.filter(function(p){return p&&p.name;}).slice(0,2).map(function(p){
      return {name:p.name,doesOrdinary:!!p.doesOrdinary,task:p.task||null};
    });
  }
  if(sp.patientWorker){
    const t=oldTask(record,sp.patientWorker);
    return [{name:sp.patientWorker,doesOrdinary:!!t,task:t}];
  }
  return [];
}

function migrateV5(){
  if(localStorage.getItem('vibraciones_v5_migrated')==='1')return;
  const migrated=history().map(function(rec){
    const sp=Object.assign({},rec.specials||{});
    if(!Array.isArray(sp.patients)){
      sp.patients=normalizePatients(rec);
    }
    return Object.assign({},rec,{schemaVersion:5,specials:sp});
  });
  saveHistory(migrated);
  localStorage.setItem('vibraciones_v5_migrated','1');
}

function derivedRestQueue(beforeDate){
  const q=[];
  const meetings=history().filter(function(x){return x.date<beforeDate;}).sort(function(a,b){return a.date.localeCompare(b.date);});
  meetings.forEach(function(m){
    (m.reentered||[]).forEach(function(n){
      const i=q.indexOf(n);
      if(i>=0)q.splice(i,1);
    });
    (m.resting||[]).forEach(function(n){
      if(q.indexOf(n)<0)q.push(n);
    });
  });
  return q;
}

function currentBook(){
  return books().find(function(b){return b.id===$('book').value;})||books()[0];
}

function initBooks(){
  const list=books();
  $('book').innerHTML=list.map(function(b){return '<option value="'+b.id+'">'+b.name+'</option>';}).join('');
}

function chapterForDate(){
  const b=currentBook();
  if(!b)return {no:1,title:'Capítulo 1'};
  if(state.chapterOverride!=null){
    const no=+state.chapterOverride;
    return {no:no,title:(b.chapters&&b.chapters[String(no)])||(b.chapters&&b.chapters[no])||('Capítulo '+no)};
  }
  const same=currentMeeting();
  if(same&&same.bookId===b.id){
    const no=+same.chapter||1;
    return {no:no,title:same.chapterTitle||(b.chapters&&b.chapters[String(no)])||(b.chapters&&b.chapters[no])||('Capítulo '+no)};
  }
  const prev=history().filter(function(x){return x.date<$('date').value&&x.bookId===b.id;}).sort(function(a,b){return a.date.localeCompare(b.date);}).slice(-1)[0];
  const no=prev?(+prev.chapter||0)+1:1;
  return {no:no,title:(b.chapters&&b.chapters[String(no)])||(b.chapters&&b.chapters[no])||('Capítulo '+no)};
}

function populateChapterSelect(){
  const b=currentBook();
  const entries=Object.entries((b&&b.chapters)||{}).sort(function(a,b2){return +a[0]-+b2[0];});
  $('chapterSelect').innerHTML=entries.map(function(entry){return '<option value="'+entry[0]+'">'+entry[0]+' · '+entry[1]+'</option>';}).join('');
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

function renderPeople(participants){
  const activeSet=new Set(participants||PEOPLE.map(function(p){return p.name;}));
  $('people').innerHTML=PEOPLE.map(function(p){
    const checked=p.coordinator||activeSet.has(p.name);
    return '<label class="person"><input type="checkbox" value="'+p.name+'" '+(checked?'checked':'')+' '+(p.coordinator?'disabled':'')+'><span class="name">'+p.name+'</span>'+(p.noPan?'<span class="chip">No Pan Nuestro</span>':'')+(p.coordinator?'<span class="chip">Coordinador</span>':'')+'</label>';
  }).join('');
  document.querySelectorAll('#people input').forEach(function(x){
    x.addEventListener('change',function(){
      clearGenerated();
      refreshSpecialSelects();
    });
  });
}

function setPatientUI(on){
  state.hasPatients=!!on;
  $('pYes').classList.toggle('active',state.hasPatients);
  $('pNo').classList.toggle('active',!state.hasPatients);
  $('patientArea').classList.toggle('hidden',!state.hasPatients);
  refreshSpecialSelects();
}

function optionList(names,includeBlank){
  let html=includeBlank?'<option value="">Sin segundo paciente</option>':'';
  html+=names.map(function(n){return '<option value="'+n+'">'+n+'</option>';}).join('');
  return html;
}

function patientConfig(i){
  const name=$('patient'+i).value;
  const does=$('patient'+i+'Ordinary').checked;
  return {name:name,doesOrdinary:does,task:does?$('patient'+i+'Task').value:null};
}

function currentPatients(){
  if(!state.hasPatients)return [];
  return [patientConfig(1),patientConfig(2)].filter(function(p){return !!p.name;});
}

function syncPatientChoices(){
  const p1=$('patient1').value;
  const p2=$('patient2').value;
  Array.from($('patient1').options).forEach(function(o){o.disabled=!!p2&&o.value===p2;});
  Array.from($('patient2').options).forEach(function(o){o.disabled=!!p1&&o.value===p1;});
}

function refreshSpecialSelects(saved){
  const list=selected();
  const oldP1=(saved&&saved.patients&&saved.patients[0]&&saved.patients[0].name)||$('patient1').value;
  const oldP2=(saved&&saved.patients&&saved.patients[1]&&saved.patients[1].name)||$('patient2').value;
  const oldWorker=(saved&&saved.workerVibration)||$('worker').value;

  $('patient1').innerHTML=optionList(list,false);
  $('patient2').innerHTML=optionList(list,true);
  $('worker').innerHTML=optionList(list,false);

  if(oldP1&&list.indexOf(oldP1)>=0)$('patient1').value=oldP1;
  else if(list.indexOf('Samuel')>=0)$('patient1').value='Samuel';
  else if(list.length)$('patient1').value=list[0];

  if(oldP2&&list.indexOf(oldP2)>=0&&oldP2!==$('patient1').value)$('patient2').value=oldP2;
  else $('patient2').value='';

  if(oldWorker&&list.indexOf(oldWorker)>=0)$('worker').value=oldWorker;
  else if(list.indexOf('Nikol')>=0)$('worker').value='Nikol';
  else if(list.length)$('worker').value=list[0];

  syncPatientChoices();
  refreshPatientTaskOptions(1);
  refreshPatientTaskOptions(2);
  syncWorkerRule();
}

function previewShift(){
  const prev=previousMeeting();
  if(!prev)return 1;
  let anitaOrdinary=selected().indexOf('Anita Suarez')>=0;
  currentPatients().forEach(function(p){
    if(p.name==='Anita Suarez'&&!p.doesOrdinary)anitaOrdinary=false;
    if(p.name==='Anita Suarez'&&p.doesOrdinary)anitaOrdinary=true;
  });
  const old=oldTask(prev,'Anita Suarez');
  if(anitaOrdinary&&old&&nextTask(old,1)==='pan')return 2;
  return 1;
}

function canProgress(name,task,shift){
  if(!name||!task)return true;
  if(person(name).noPan&&task==='pan')return false;
  const prev=previousMeeting();
  const old=oldTask(prev,name);
  if(!old)return true;
  const oldIndex=idx(old),newIndex=idx(task);
  if(oldIndex<0||newIndex<0)return true;
  const minAbs=oldIndex+shift;
  if(minAbs<ORDINARY.length){
    return newIndex>=minAbs;
  }
  return newIndex>=(minAbs%ORDINARY.length);
}

function progressReason(name,task,shift){
  if(person(name).noPan&&task==='pan')return 'No Pan Nuestro';
  const prev=previousMeeting();
  const old=oldTask(prev,name);
  if(!old)return '';
  if(old===task)return 'Misma actividad anterior';
  if(!canProgress(name,task,shift))return 'Retroceso';
  return '';
}

function refreshPatientTaskOptions(i){
  const name=$('patient'+i).value;
  const wrap=$('patient'+i+'TaskWrap');
  const does=$('patient'+i+'Ordinary').checked;
  wrap.classList.toggle('hidden',!does);
  if(!does)return;

  const shift=previewShift();
  const select=$('patient'+i+'Task');
  const oldValue=select.value;
  select.innerHTML=ORDINARY.map(function(t){
    const reason=progressReason(name,t.id,shift);
    return '<option value="'+t.id+'" '+(reason?'disabled':'')+'>'+t.label+(reason?' — '+reason:'')+'</option>';
  }).join('');

  if(oldValue&&Array.from(select.options).some(function(o){return o.value===oldValue&&!o.disabled;})){
    select.value=oldValue;
  }else{
    const first=Array.from(select.options).find(function(o){return !o.disabled;});
    if(first)select.value=first.value;
  }

  const old=oldTask(previousMeeting(),name);
  $('patient'+i+'Hint').textContent=old?('Anterior: '+taskShort(old)+'. Solo puede avanzar.'):'Sin actividad ordinaria anterior.';
}

function syncWorkerRule(){
  if(!state.hasPatients)return;
  const worker=$('worker').value;
  const shift=previewShift();
  const canEv=canProgress(worker,'evangelio',shift);
  if(!canEv){
    $('linkEv').checked=false;
    $('linkEv').disabled=true;
    $('linkHint').textContent=worker+' no puede realizar Evangelio esta semana porque implicaría repetir o retroceder.';
  }else{
    $('linkEv').disabled=false;
    $('linkHint').textContent='Si está marcado, '+worker+' realiza Evangelio + Vibración por trabajador.';
  }
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
  renderPeople(rec&&rec.participants?rec.participants:null);

  if(rec&&rec.bookId&&books().some(function(b){return b.id===rec.bookId;}))$('book').value=rec.bookId;
  else $('book').value='pan-nuestro';

  const patients=normalizePatients(rec);
  setPatientUI(patients.length>0);

  if(state.hasPatients){
    refreshSpecialSelects({
      patients:patients,
      workerVibration:rec&&rec.specials?rec.specials.workerVibration:null
    });
    if(patients[0]){
      $('patient1').value=patients[0].name;
      $('patient1Ordinary').checked=!!patients[0].doesOrdinary;
      refreshPatientTaskOptions(1);
      if(patients[0].task)$('patient1Task').value=patients[0].task;
    }
    if(patients[1]){
      $('patient2').value=patients[1].name;
      $('patient2Ordinary').checked=!!patients[1].doesOrdinary;
      refreshPatientTaskOptions(2);
      if(patients[1].task)$('patient2Task').value=patients[1].task;
    }else{
      $('patient2').value='';
      $('patient2Ordinary').checked=false;
      refreshPatientTaskOptions(2);
    }
    if(rec&&rec.specials&&rec.specials.workerVibration)$('worker').value=rec.specials.workerVibration;
    $('linkEv').checked=!!(rec&&rec.specials&&rec.specials.evangelioWithVibration);
    syncPatientChoices();
    syncWorkerRule();
  }else{
    $('patient1Ordinary').checked=false;
    $('patient2Ordinary').checked=false;
    $('linkEv').checked=false;
  }

  updateChapter();

  if(rec&&rec.ordinary){
    state.schedule=Object.assign({},rec.ordinary);
    state.resting=(rec.resting||[]).slice();
    state.reentered=(rec.reentered||[]).slice();
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
  const old=oldTask(prev,'Anita Suarez');
  if(names.indexOf('Anita Suarez')>=0&&old&&nextTask(old,1)==='pan')return 2;
  return 1;
}

function fixedAssignments(){
  const fixed=Object.assign({},state.manualLocks);
  let error='';

  function add(task,name,label){
    if(!task||!name)return;
    if(fixed[task]&&fixed[task]!==name){
      error=label+' entra en conflicto con '+taskShort(task)+'.';
      return;
    }
    Object.keys(fixed).forEach(function(t){
      if(t!==task&&fixed[t]===name){
        error=name+' no puede tener dos actividades ordinarias.';
      }
    });
    fixed[task]=name;
  }

  currentPatients().forEach(function(p,i){
    if(p.doesOrdinary)add(p.task,p.name,'Paciente '+(i+1));
  });

  if(state.hasPatients&&$('linkEv').checked){
    add('evangelio',$('worker').value,'Vibración por trabajador');
  }

  return {fixed:fixed,error:error};
}

function configError(){
  if(!state.hasPatients)return '';
  const patients=currentPatients();
  if(!patients.length||!patients[0].name)return 'Selecciona al menos el Paciente trabajador 1.';
  if(patients.length===2&&patients[0].name===patients[1].name)return 'Los dos pacientes deben ser personas diferentes.';

  const shift=previewShift();

  for(let i=0;i<patients.length;i++){
    const p=patients[i];
    if(p.doesOrdinary){
      if(!p.task)return 'Selecciona la actividad del paciente '+(i+1)+'.';
      if(!canProgress(p.name,p.task,shift)){
        return p.name+' no puede realizar '+taskShort(p.task)+' porque repetiría o retrocedería en la rotación.';
      }
    }
  }

  if(patients.length===2&&patients[0].doesOrdinary&&patients[1].doesOrdinary&&patients[0].task===patients[1].task){
    return 'Los dos pacientes no pueden ocupar la misma actividad ordinaria.';
  }

  if($('linkEv').checked&&!canProgress($('worker').value,'evangelio',shift)){
    return $('worker').value+' no puede realizar Evangelio porque repetiría o retrocedería.';
  }

  const worker=$('worker').value;
  const pSame=patients.find(function(p){return p.name===worker;});
  if(pSame&&!pSame.doesOrdinary&&$('linkEv').checked){
    return worker+' está configurado únicamente como paciente y no puede quedar también en Evangelio.';
  }
  if(pSame&&pSame.doesOrdinary&&$('linkEv').checked&&pSame.task!=='evangelio'){
    return worker+' ya tiene una actividad ordinaria como paciente y no puede tener además Evangelio.';
  }

  return '';
}

function chooseOrdinaryPeople(prev,forcedNames){
  let names=selected().filter(function(n){return n!=='Hector';});
  state.resting=[];
  state.reentered=[];
  state.specialOnly=[];

  const patients=currentPatients();
  patients.forEach(function(p){
    if(!p.doesOrdinary&&p.name!=='Hector'&&!forcedNames.has(p.name)){
      names=names.filter(function(n){return n!==p.name;});
      if(state.specialOnly.indexOf(p.name)<0)state.specialOnly.push(p.name);
    }
  });

  const worker=state.hasPatients?$('worker').value:null;
  const linked=state.hasPatients&&$('linkEv').checked;
  const hectorFixed=forcedNames.has('Hector');
  const targetNonHector=8-(hectorFixed?1:0);

  const queue=derivedRestQueue($('date').value);
  const returning=queue.filter(function(n){return names.indexOf(n)>=0;});
  const newcomers=names.filter(function(n){return !oldTask(prev,n);});
  state.reentered=returning.slice();

  while(names.length>targetNonHector){
    const protectedNames=new Set(returning.concat(newcomers).concat(Array.from(forcedNames)));
    let remove=null;

    if(worker&&worker!=='Hector'&&!linked&&names.indexOf(worker)>=0&&!forcedNames.has(worker)){
      remove=worker;
      names=names.filter(function(n){return n!==remove;});
      if(state.specialOnly.indexOf(remove)<0)state.specialOnly.push(remove);
      continue;
    }

    const finalPrev=prev&&prev.ordinary?prev.ordinary.final:null;
    if(finalPrev&&names.indexOf(finalPrev)>=0&&!protectedNames.has(finalPrev)){
      remove=finalPrev;
    }

    if(!remove){
      remove=names.find(function(n){return !protectedNames.has(n);})||names.find(function(n){return !forcedNames.has(n);})||null;
    }

    if(!remove)break;
    names=names.filter(function(n){return n!==remove;});
    state.resting.push(remove);
  }

  return names;
}

function allowedByProgress(prev,name,task,shift){
  if(person(name).noPan&&task==='pan')return false;
  const old=oldTask(prev,name);
  if(!old)return true;
  const oldIndex=idx(old),newIndex=idx(task);
  const minAbs=oldIndex+shift;
  if(minAbs<ORDINARY.length)return newIndex>=minAbs;
  return newIndex>=(minAbs%ORDINARY.length);
}

function prevalidateFixed(prev,fixed,shift){
  const seen={};
  for(const task in fixed){
    const name=fixed[task];
    if(seen[name]&&seen[name]!==task)return name+' no puede tener dos actividades ordinarias.';
    seen[name]=task;
    if(person(name).noPan&&task==='pan')return 'Anita Suárez no realiza la lectura de Pan Nuestro.';
    if(!allowedByProgress(prev,name,task,shift)){
      return name+' no puede pasar a '+taskShort(task)+' porque repetiría o retrocedería respecto al miércoles anterior.';
    }
  }
  return '';
}

function solve(prev,names,shift,fixed){
  let pool=names.slice();
  const fixedNames=new Set(Object.values(fixed));

  if((pool.length<8||fixedNames.has('Hector'))&&pool.indexOf('Hector')<0)pool.push('Hector');
  if(pool.length<8)return null;
  if(pool.length>8)return null;

  function allowed(name,task){
    if(person(name).noPan&&task==='pan')return false;
    if(fixed[task]&&fixed[task]!==name)return false;

    for(const ft in fixed){
      if(fixed[ft]===name&&ft!==task)return false;
    }

    if(name==='Hector'&&!fixedNames.has('Hector')&&names.length>=8)return false;
    return allowedByProgress(prev,name,task,shift);
  }

  function score(name,task){
    const old=oldTask(prev,name);
    if(!old)return 40-idx(task)/100;
    const d=dist(old,task);
    if(d===shift)return 500;
    return 300-d*25;
  }

  const assign={},used=new Set();
  for(const task in fixed){
    const name=fixed[task];
    if(pool.indexOf(name)<0||!allowed(name,task))return null;
    assign[task]=name;
    used.add(name);
  }

  const open=ORDINARY.map(function(x){return x.id;}).filter(function(t){return !assign[t];});
  let best=null,bestScore=-Infinity;

  function recurse(i,total){
    if(i===open.length){
      if(total>bestScore){
        bestScore=total;
        best=Object.assign({},assign);
      }
      return;
    }
    const task=open[i];
    pool.forEach(function(name){
      if(used.has(name)||!allowed(name,task))return;
      used.add(name);
      assign[task]=name;
      recurse(i+1,total+score(name,task));
      delete assign[task];
      used.delete(name);
    });
  }

  recurse(0,0);
  return best;
}

function computeSchedule(resetManual){
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
  const built=fixedAssignments();
  if(built.error){
    state.schedule=null;
    state.error=built.error;
    renderProgram();
    return false;
  }

  const fixed=built.fixed;
  const forcedNames=new Set(Object.values(fixed));
  const names=chooseOrdinaryPeople(prev,forcedNames);
  state.shift=determineShift(prev,names.concat(Array.from(forcedNames)));

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
    state.error='No existe una combinación completa que permita avanzar a todos sin repetir ni retroceder. Revisa los pacientes, las actividades fijadas o los participantes.';
    renderProgram();
    return false;
  }

  state.schedule=result;
  renderProgram();
  return true;
}

function taskLabel(task){
  if(task==='pan'){
    return 'LECTURA LIBRO “'+currentBook().name.toUpperCase()+'” – '+$('chNo').textContent+'. '+$('chTitle').textContent;
  }
  const t=ORDINARY.find(function(x){return x.id===task;});
  return t?t.label:task;
}

function patientFixedTask(name){
  const p=currentPatients().find(function(x){return x.name===name&&x.doesOrdinary;});
  return p?p.task:null;
}

function basicOptionRestriction(prev,name,task){
  if(person(name).noPan&&task==='pan')return 'No Pan Nuestro';

  const patients=currentPatients();
  const p=patients.find(function(x){return x.name===name;});
  if(p){
    if(!p.doesOrdinary)return 'Solo paciente';
    if(p.task!==task)return 'Paciente fijado a '+taskShort(p.task);
  }

  if(state.hasPatients&&$('linkEv').checked&&name===$('worker').value&&task!=='evangelio'){
    return 'Vinculado a Evangelio';
  }

  if(!allowedByProgress(prev,name,task,state.shift)){
    const old=oldTask(prev,name);
    return old===task?'Misma actividad anterior':'Retroceso';
  }

  return '';
}

function selectOptions(task,current){
  const prev=previousMeeting();
  return selected().map(function(name){
    const reason=basicOptionRestriction(prev,name,task);
    return '<option value="'+name+'" '+(current===name?'selected':'')+' '+(reason?'disabled':'')+'>'+name+(reason?' — '+reason:'')+'</option>';
  }).join('');
}

function previousPatientsLabel(prev){
  const p=normalizePatients(prev).map(function(x){return x.name;});
  return p.length?p.join(' / '):'—';
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
  const linkedWorker=state.hasPatients&&$('linkEv').checked?$('worker').value:null;

  let html=ORDINARY.map(function(t){
    const name=state.schedule[t.id];
    const previousResponsible=(prev&&prev.ordinary&&prev.ordinary[t.id])||'—';
    const fixedPatient=patientFixedTask(name)===t.id;
    const isLinked=t.id==='evangelio'&&linkedWorker===name;
    const disabled=fixedPatient||isLinked;

    return '<div class="row"><div class="task">'+taskLabel(t.id)+'<small>'+previousResponsible+'</small></div><select data-task="'+t.id+'" '+(disabled?'disabled':'')+'>'+selectOptions(t.id,name)+'</select></div>';
  }).join('');

  if(state.hasPatients){
    const pats=currentPatients();
    const prevPatients=previousPatientsLabel(prev);
    if(pats[0]){
      html+='<div class="row"><div class="task">PACIENTE TRABAJADOR GENE 1<small>'+prevPatients+'</small></div><div class="responsible">'+pats[0].name+'</div></div>';
    }
    if(pats[1]){
      html+='<div class="row"><div class="task">PACIENTE TRABAJADOR GENE 2<small>'+prevPatients+'</small></div><div class="responsible">'+pats[1].name+'</div></div>';
    }
    const prevWorker=(prev&&prev.specials&&prev.specials.workerVibration)||'—';
    html+='<div class="row"><div class="task">VIBRACIÓN POR TRABAJADOR<small>'+prevWorker+'</small></div><div class="responsible">'+$('worker').value+'</div></div>';
  }

  const prevReading=(prev&&prev.specials&&prev.specials.readingPatients)||'Hector';
  html+='<div class="row"><div class="task">LECTURA DE PACIENTES<small>'+prevReading+'</small></div><div class="responsible">Hector</div></div>';

  $('program').innerHTML=html;

  document.querySelectorAll('#program select[data-task]').forEach(function(sel){
    sel.addEventListener('change',function(){
      const task=sel.dataset.task;
      const chosen=sel.value;
      const previousSchedule=Object.assign({},state.schedule);
      const oldLocks=Object.assign({},state.manualLocks);

      Object.keys(state.manualLocks).forEach(function(t){
        if(state.manualLocks[t]===chosen&&t!==task)delete state.manualLocks[t];
      });
      state.manualLocks[task]=chosen;

      const ok=computeSchedule(false);
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
  if(state.resting.length)notes.push('<div class="note"><b>Descansa esta semana:</b> '+state.resting.join(', ')+'</div>');
  if(state.reentered.length)notes.push('<div class="note"><b>Reingresa esta semana:</b> '+state.reentered.join(', ')+'</div>');
  $('rotationNotes').innerHTML=notes.join('');
}

function validateSchedule(){
  if(!state.schedule)return state.error||'Primero genera una programación válida.';
  const names=Object.values(state.schedule);
  if(new Set(names).size!==ORDINARY.length)return 'Hay una persona repetida dentro de las actividades ordinarias.';
  if(state.schedule.pan==='Anita Suarez')return 'Anita Suárez no realiza la lectura de Pan Nuestro.';

  const prev=previousMeeting();
  for(const task in state.schedule){
    const name=state.schedule[task];
    if(!allowedByProgress(prev,name,task,state.shift)){
      return name+' quedó en una actividad que repite o retrocede respecto al miércoles anterior.';
    }
  }
  return '';
}

function saveCurrentSchedule(){
  const b=currentBook();
  const record={
    schemaVersion:5,
    date:$('date').value,
    bookId:b.id,
    bookName:b.name,
    chapter:+$('chNo').textContent,
    chapterTitle:$('chTitle').textContent,
    participants:selected(),
    ordinary:Object.assign({},state.schedule),
    specials:{
      patients:currentPatients(),
      workerVibration:state.hasPatients?$('worker').value:null,
      readingPatients:'Hector',
      evangelioWithVibration:state.hasPatients&&$('linkEv').checked
    },
    resting:state.resting.slice(),
    reentered:state.reentered.slice()
  };
  upsertHistory(record);
}

function messageText(){
  const greeting=GREETINGS[state.greeting%GREETINGS.length];
  const blocks=[];

  blocks.push('*ORACIÓN INICIO*\\n_'+state.schedule.inicio+'_');
  blocks.push('*'+taskLabel('pan')+'*\\n_'+state.schedule.pan+'_');
  blocks.push('*LECTURA EVANGELIO - Fragmento*\\n_'+state.schedule.evangelio+'_');

  if(state.hasPatients){
    const pats=currentPatients();
    if(pats.length===1){
      blocks.push('*PACIENTE TRABAJADOR GENE*\\n_'+pats[0].name+'_');
    }else if(pats.length===2){
      blocks.push('*PACIENTES TRABAJADORES GENE*\\n_'+pats[0].name+'_\\n_'+pats[1].name+'_');
    }
    blocks.push('*VIBRACIÓN POR TRABAJADOR*\\n_'+$('worker').value+'_');
  }

  blocks.push('*LECTURA DE PACIENTES*\\n_Hector_');
  ['fisica','espiritual','familias','general','final'].forEach(function(t){
    blocks.push('*'+taskLabel(t)+'*\\n_'+state.schedule[t]+'_');
  });

  return greeting+'\\n\\n'+blocks.join('\\n\\n')+'\\n\\n\\n*Nos vemos hoy a las 6:55.*\\n\\nBendiciones';
}

function generateMessage(){
  const err=validateSchedule();
  if(err){
    state.error=err;
    renderProgram();
    return;
  }
  saveCurrentSchedule();
  const text=messageText();
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
  const lines=$('newBookChapters').value.split('\\n').map(function(x){return x.trim();}).filter(Boolean);
  if(!name||!lines.length){
    toast('Escribe el nombre del libro y al menos un capítulo.');
    return;
  }
  const id='book-'+Date.now(),chapters={};
  lines.forEach(function(x,i){chapters[i+1]=x;});
  const list=books();
  list.push({id:id,name:name,chapters:chapters});
  saveBooks(list);
  initBooks();
  $('book').value=id;
  state.chapterOverride=null;
  updateChapter();
  $('bookEdit').classList.add('hidden');
}

$('pNo').addEventListener('click',function(){setPatientUI(false);clearGenerated();});
$('pYes').addEventListener('click',function(){setPatientUI(true);clearGenerated();});

['patient1','patient2'].forEach(function(id){
  $(id).addEventListener('change',function(){
    syncPatientChoices();
    refreshPatientTaskOptions(id==='patient1'?1:2);
    refreshPatientTaskOptions(id==='patient1'?2:1);
    syncWorkerRule();
    clearGenerated();
  });
});

[1,2].forEach(function(i){
  $('patient'+i+'Ordinary').addEventListener('change',function(){
    refreshPatientTaskOptions(i);
    syncWorkerRule();
    clearGenerated();
  });
  $('patient'+i+'Task').addEventListener('change',clearGenerated);
});

$('worker').addEventListener('change',function(){syncWorkerRule();clearGenerated();});
$('linkEv').addEventListener('change',clearGenerated);
$('generate').addEventListener('click',function(){computeSchedule(true);});
$('makeMsg').addEventListener('click',generateMessage);
$('greeting').addEventListener('click',function(){state.greeting++;generateMessage();});

$('copy').addEventListener('click',async function(){
  const text=$('preview').dataset.text||'';
  try{
    await navigator.clipboard.writeText(text);
    toast('Mensaje copiado.');
  }catch(e){
    toast('No fue posible copiar automáticamente.');
  }
});

$('share').addEventListener('click',async function(){
  const text=$('preview').dataset.text||'';
  if(navigator.share){
    try{await navigator.share({text:text});}catch(e){}
  }else{
    window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
  }
});

$('changeChapter').addEventListener('click',function(){
  $('chapterEdit').classList.toggle('hidden');
  populateChapterSelect();
});

$('chapterSelect').addEventListener('change',function(){
  state.chapterOverride=+$('chapterSelect').value;
  updateChapter();
  clearGenerated();
});

$('book').addEventListener('change',function(){
  state.chapterOverride=null;
  updateChapter();
  clearGenerated();
});

$('addBook').addEventListener('click',function(){$('bookEdit').classList.toggle('hidden');});
$('saveBook').addEventListener('click',addBook);
$('date').addEventListener('change',loadDateState);

function init(){
  migrateV5();
  $('date').value=isoToday();
  initBooks();
  loadDateState();
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  }
}

init();
