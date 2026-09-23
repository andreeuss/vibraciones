/* Coordinador de Vibraciones v4.1.1 */
function syncWorkerRule(){
  if(!state.hasPatient)return;
  const worker=$('worker').value;
  const prev=previousMeeting();
  const previousTask=oldTask(prev,worker);

  if(previousTask==='evangelio'){
    $('linkEv').checked=false;
    $('linkEv').disabled=true;
    $('linkHint').textContent=`${worker} tuvo Evangelio en la programación anterior; esta semana no puede repetirlo.`;
    return;
  }

  if(worker==='Hector'){
    $('linkEv').disabled=false;
    $('linkHint').textContent='Puedes marcar esta opción si Héctor realizará también el Evangelio. La rueda se reorganizará automáticamente.';
    return;
  }

  $('linkEv').disabled=false;
  $('linkHint').textContent='Si está marcado, esta persona realiza Evangelio + Vibración por trabajador.';
}

function chooseOrdinaryPeople(prev,forcedNames=new Set()){
  let names=selected().filter(n=>n!=='Hector');
  state.resting=[];
  state.reentered=[];
  state.specialOnly=[];

  if(state.hasPatient){
    const patient=$('patient').value;
    const worker=$('worker').value;
    const linked=$('linkEv').checked;

    if(!$('patientExtra').checked&&patient!=='Hector'&&!forcedNames.has(patient)){
      names=names.filter(n=>n!==patient);
      state.specialOnly.push(patient);
    }

    if(!linked&&worker!=='Hector'&&names.length>8&&!forcedNames.has(worker)){
      names=names.filter(n=>n!==worker);
      if(!state.specialOnly.includes(worker))state.specialOnly.push(worker);
    }
  }

  const hectorOrdinary =
    Object.values(state.manualLocks).includes('Hector') ||
    (state.hasPatient&&$('worker').value==='Hector'&&$('linkEv').checked);

  const targetRegular=8-(hectorOrdinary?1:0);
  const queue=derivedRestQueue($('date').value);
  const returning=queue.filter(n=>names.includes(n));
  const newcomers=names.filter(n=>!oldTask(prev,n));
  state.reentered=returning.slice();

  while(names.length>targetRegular){
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
  if(state.hasPatient&&$('linkEv').checked)forcedNames.add($('worker').value);

  const names=chooseOrdinaryPeople(prev,forcedNames);
  state.shift=determineShift(prev,names);
  const fixed={...state.manualLocks};

  if(state.hasPatient&&$('linkEv').checked){
    const worker=$('worker').value;

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
    state.error='No existe una combinación completa que cumpla la rotación, las restricciones y los participantes seleccionados.';
    renderProgram();
    return false;
  }

  state.schedule=result;
  renderProgram();
  return true;
}

function validateSchedule(){
  if(!state.schedule)return state.error||'Primero genera una programación válida.';
  const names=Object.values(state.schedule);

  if(new Set(names).size!==ORDINARY.length){
    return 'Hay una persona repetida dentro de las actividades ordinarias.';
  }
  if(state.schedule.pan==='Anita Suarez'){
    return 'Anita Suárez no realiza la lectura de Pan Nuestro.';
  }

  const prev=previousMeeting();
  for(const [task,name] of Object.entries(state.schedule)){
    if(oldTask(prev,name)===task){
      return `${name} quedó nuevamente en ${taskShort(task)}. La programación debe avanzar.`;
    }
  }
  return '';
}

syncWorkerRule();


/* v4.1.1 — referencia por actividad: muestra quién hizo ESA tarea la semana anterior */
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
  const linkedWorker=state.hasPatient&&$('worker').value!=='Hector'&&$('linkEv').checked?$('worker').value:
    (state.hasPatient&&$('worker').value==='Hector'&&$('linkEv').checked?'Hector':null);

  let html=ORDINARY.map(t=>{
    const name=state.schedule[t.id];
    const previousResponsible=prev?.ordinary?.[t.id]||'—';
    const isLinked=t.id==='evangelio'&&linkedWorker===name;

    return `<div class="row">
      <div class="task">
        ${taskLabel(t.id)}
        <small>${previousResponsible}</small>
      </div>
      <select data-task="${t.id}" ${isLinked?'disabled':''}>${selectOptions(t.id,name)}</select>
    </div>`;
  }).join('');

  if(state.hasPatient){
    const prevPatient=prev?.specials?.patientWorker||'—';
    const prevWorker=prev?.specials?.workerVibration||'—';

    html+=`<div class="row">
      <div class="task">PACIENTE TRABAJADOR GENE<small>${prevPatient}</small></div>
      <div class="responsible">${$('patient').value}</div>
    </div>`;

    html+=`<div class="row">
      <div class="task">VIBRACIÓN POR TRABAJADOR<small>${prevWorker}</small></div>
      <div class="responsible">${$('worker').value}</div>
    </div>`;
  }

  const prevReading=prev?.specials?.readingPatients||'Hector';
  html+=`<div class="row">
    <div class="task">LECTURA DE PACIENTES<small>${prevReading}</small></div>
    <div class="responsible">Hector</div>
  </div>`;

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
