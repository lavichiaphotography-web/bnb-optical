(() => {
  let mode = 'week', anchor = new Date(), sequence = 0, opened = false, dashboardRows = [];
  const names = ['Les Allemands', 'El Bouni', 'Valmascort'];
  const statuses = [['pending','En attente'],['accepted','Confirmés'],['arrived','Arrivés'],['done','Terminés'],['cancelled','Annulés'],['no_show','Absents']];
  const statusLabel = {pending:'En attente',accepted:'Confirmé',arrived:'Arrivé',done:'Terminé',cancelled:'Annulé',refused:'Refusé',no_show:'Absent'};
  const statusClass = {pending:'wait',accepted:'ok',arrived:'arrived',done:'done',cancelled:'cancel',refused:'cancel',no_show:'no_show'};
  const baseSelect = selectView;

  const dashboardNav = document.createElement('button');
  dashboardNav.type = 'button';
  dashboardNav.dataset.view = 'dashboard';
  dashboardNav.innerHTML = '<i aria-hidden="true">⌂</i>Vue d’ensemble';
  document.querySelector('.nav').prepend(dashboardNav);

  selectView = function(view) {
    if (view === 'dashboard') {
      baseSelect('appointments');
      document.querySelectorAll('.nav button').forEach(button => {
        const active = button.dataset.view === 'dashboard';
        button.classList.toggle('on', active);
        if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
      });
      document.querySelector('#pageTitle').textContent = 'Vue d’ensemble';
      document.querySelector('.stats').style.display = 'none';
      document.querySelector('.panel:not(.extra-view)').style.display = 'none';
      const extra = document.querySelector('#extraView');
      extra.classList.add('show');
      loadOverview();
      return;
    }
    if (view !== 'statistics') { baseSelect(view); return; }
    baseSelect('statistics');
    document.querySelectorAll('.nav button').forEach(button => {
      button.classList.toggle('on', button.dataset.view === view);
      if (button.dataset.view === view) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    document.querySelector('#pageTitle').textContent = 'Statistiques des magasins';
    refresh();
  };

  function range() {
    const start = new Date(anchor), end = new Date(anchor);
    if (mode === 'week') { start.setDate(start.getDate() - (start.getDay()+6)%7); end.setTime(start.getTime()); end.setDate(start.getDate()+6); }
    if (mode === 'month') { start.setDate(1); end.setMonth(end.getMonth()+1,0); }
    return {from:dateKey(start),to:dateKey(end)};
  }
  function count(rows,status) { return rows.filter(row => status === 'cancelled' ? ['cancelled','refused'].includes(row.status) : row.status === status).length; }
  function toolbar(period) {
    const format = input => new Intl.DateTimeFormat('fr-DZ',{day:'numeric',month:'short',year:'numeric'}).format(new Date(input+'T12:00:00'));
    return `<div class="dash-toolbar"><div class="agenda-modes" aria-label="Période des statistiques">${[['day','Jour'],['week','Semaine'],['month','Mois']].map(([key,label])=>`<button type="button" data-dash-mode="${key}" class="${mode===key?'on':''}" aria-pressed="${mode===key}">${label}</button>`).join('')}</div><div class="quick-actions"><button type="button" data-dash-shift="-1" aria-label="Statistiques période précédente">←</button><button type="button" data-dash-today>Aujourd’hui</button><button type="button" data-dash-shift="1" aria-label="Statistiques période suivante">→</button><input type="date" data-dash-date aria-label="Date des statistiques" value="${dateKey(anchor)}"></div><strong>${esc(format(period.from))}${period.from===period.to?'':' — '+esc(format(period.to))}</strong><button type="button" class="row-btn" data-dash-refresh>Actualiser</button></div>`;
  }
  async function refresh() {
    const id = ++sequence, period = range(), extra = document.querySelector('#extraView');
    extra.innerHTML = toolbar(period)+'<div class="empty-state" role="status"><strong>Chargement de l’activité…</strong></div>';
    try {
      const response = await fetch(`/api/admin/appointments?from=${period.from}&to=${period.to}`,{headers:staffHeaders({Accept:'application/json'})});
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.appointments)) throw new Error();
      if (id !== sequence || document.querySelector('#pageTitle').textContent !== 'Statistiques des magasins') return;
      render(data.appointments,period);
    } catch {
      if (id !== sequence) return;
      extra.innerHTML = toolbar(period)+'<div class="empty-state" role="alert"><strong>Statistiques indisponibles</strong><p>Les données n’ont pas pu être chargées.</p><button type="button" class="primary" data-dash-refresh>Réessayer</button></div>';
    }
  }
  function render(rows,period){
    const shops=adminScope?.shop?[shopNames[adminScope.shop]]:names;
    const groups=shops.map(name=>({name,rows:rows.filter(row=>row.place===name)}));
    document.querySelector('#extraView').innerHTML=toolbar(period)+`<div class="panel-head"><div><h2>Activité par magasin</h2><p>${rows.length} rendez-vous sur la période</p></div></div><div class="table-wrap"><table class="dash-table"><thead><tr><th>Magasin</th><th>Total</th>${statuses.map(([,label])=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${groups.map(group=>`<tr><th>${esc(group.name)}</th><td><strong>${group.rows.length}</strong></td>${statuses.map(([status])=>`<td>${count(group.rows,status)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function todayKey(){ return dateKey(new Date()); }
  function fmtToday(){ return new Intl.DateTimeFormat('fr-DZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()); }
  function appointmentTime(row){ return String(row.time||row.appointment_time||'').slice(0,5); }
  function appointmentName(row){ return row.name||row.patient_name||[row.first_name,row.last_name].filter(Boolean).join(' ')||'Patient'; }
  function appointmentPhone(row){ return row.phone||row.patient_phone||'Téléphone non renseigné'; }
  function renderOverview(rows,query='',refocus=false){
    const active=rows.filter(row=>!['cancelled','refused'].includes(row.status));
    const pending=count(rows,'pending'),confirmed=count(rows,'accepted'),arrived=count(rows,'arrived'),done=count(rows,'done');
    const term=query.trim().toLocaleLowerCase('fr');
    const visible=active.filter(row=>!term||`${appointmentName(row)} ${appointmentPhone(row)} ${row.motif||''}`.toLocaleLowerCase('fr').includes(term));
    const sorted=[...visible].sort((a,b)=>appointmentTime(a).localeCompare(appointmentTime(b)));
    const now=new Intl.DateTimeFormat('fr-DZ',{hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
    const next=active.filter(row=>!['done','no_show'].includes(row.status)&&appointmentTime(row)>=now).sort((a,b)=>appointmentTime(a).localeCompare(appointmentTime(b)))[0];
    const list=sorted.length?sorted.map(row=>{
      const id=row.id||row.appointment_id||'';
      return `<article class="dash-appointment"><div class="dash-appointment-time">${esc(appointmentTime(row)||'—')}</div><div class="dash-appointment-person"><strong>${esc(appointmentName(row))}</strong><span>${esc(appointmentPhone(row))}</span></div><div class="dash-appointment-meta"><span>${esc(row.motif||'Consultation')}</span><small>${esc(row.place||row.shop_name||'B&B Optical')}</small></div><span class="status ${statusClass[row.status]||'wait'}">${esc(statusLabel[row.status]||'À traiter')}</span><button type="button" class="row-btn" data-dash-open="${esc(id)}" aria-label="Ouvrir le rendez-vous de ${esc(appointmentName(row))}">Ouvrir</button></article>`;
    }).join(''):'<div class="dash-empty"><strong>Aucun rendez-vous trouvé</strong><span>Changez votre recherche ou créez un rendez-vous.</span></div>';
    document.querySelector('#extraView').innerHTML=`
      <section class="dash-intro"><div><div class="eyebrow">B&B Optical · ${esc(adminScope?.name||'Vue générale')}</div><h2>Bonjour, ${esc((adminScope?.name||'équipe B&B Optical').split(' ')[0])}</h2><p>${esc(fmtToday())} · Voici le programme de votre journée.</p></div><button type="button" class="primary" data-dash-create>+ Nouveau rendez-vous</button></section>
      <section class="dash-kpis" aria-label="Résumé du jour">
        <button type="button" data-dash-status="" aria-label="Afficher tous les rendez-vous du jour"><small>Rendez-vous prévus</small><strong>${active.length}</strong><span>${rows.length} au total aujourd’hui</span></button>
        <button type="button" data-dash-status="wait" aria-label="Afficher les rendez-vous en attente"><small>À confirmer</small><strong>${pending}</strong><span>En attente de confirmation</span></button>
        <button type="button" data-dash-status="ok" aria-label="Afficher les rendez-vous confirmés"><small>Confirmés</small><strong>${confirmed}</strong><span>Patients attendus</span></button>
        <button type="button" data-dash-status="arrived" aria-label="Afficher les patients arrivés"><small>Patients arrivés</small><strong>${arrived}</strong><span>${done} consultation${done>1?'s':''} terminée${done>1?'s':''}</span></button>
      </section>
      <div class="dash-layout">
        <section class="dash-section"><div class="dash-section-head"><div><h2>Rendez-vous du jour</h2><p>Retrouvez les patients et ouvrez leur fiche de rendez-vous.</p></div><button type="button" class="dash-link" data-dash-nav="appointments">Voir le planning <span aria-hidden="true">→</span></button></div><label class="dash-search"><span aria-hidden="true">⌕</span><input type="search" data-dash-appointment-search placeholder="Filtrer par patient, téléphone ou motif…" value="${esc(query)}"></label><div class="dash-appointment-list">${list}</div></section>
        <aside class="dash-side"><section class="dash-section dash-shortcuts"><h2>Accès rapide</h2><p>Les outils utilisés au quotidien.</p><form class="dash-patient-search"><label for="dashPatientSearch">Rechercher un patient</label><div><input id="dashPatientSearch" type="search" placeholder="Nom ou téléphone…" required><button type="submit" aria-label="Rechercher le patient">→</button></div></form><button type="button" data-dash-nav="prescriptions"><span class="dash-shortcut-icon" aria-hidden="true">▤</span><span><strong>Ordonnances</strong><small>Consulter et ouvrir les prescriptions</small></span><b aria-hidden="true">›</b></button><button type="button" data-dash-nav="calendar"><span class="dash-shortcut-icon" aria-hidden="true">▦</span><span><strong>Agenda</strong><small>Voir les autres jours et créneaux</small></span><b aria-hidden="true">›</b></button></section>
          <section class="dash-next"><div class="eyebrow">Prochain rendez-vous</div>${next?`<strong>${esc(appointmentTime(next))} · ${esc(appointmentName(next))}</strong><span>${esc(next.motif||'Consultation')} · ${esc(next.place||next.shop_name||'B&B Optical')}</span><button type="button" class="dash-link" data-dash-open="${esc(next.id||next.appointment_id||'')}">Ouvrir le rendez-vous →</button>`:'<strong>Aucun rendez-vous à venir</strong><span>Vous êtes à jour pour aujourd’hui.</span>'}</section>
        </aside>
      </div>`;
    if(refocus){const input=document.querySelector('[data-dash-appointment-search]');input?.focus();input?.setSelectionRange(query.length,query.length);}
  }
  async function loadOverview(){
    const id=++sequence, today=todayKey(), extra=document.querySelector('#extraView');
    dashboardRows=[];
    extra.innerHTML='<div class="empty-state" role="status"><strong>Préparation de votre journée…</strong><p>Chargement des rendez-vous du jour.</p></div>';
    try{
      const response=await fetch(`/api/admin/appointments?from=${today}&to=${today}`,{headers:staffHeaders({Accept:'application/json'})});
      const data=await response.json();
      if(!response.ok||!Array.isArray(data.appointments))throw new Error();
      if(id!==sequence||document.querySelector('#pageTitle').textContent!=='Vue d’ensemble')return;
      dashboardRows=data.appointments;
      renderOverview(dashboardRows);
    }catch{
      if(id!==sequence)return;
      extra.innerHTML='<div class="empty-state" role="alert"><strong>Le tableau de bord est indisponible</strong><p>Les rendez-vous du jour n’ont pas pu être chargés.</p><button type="button" class="primary" data-dash-refresh>Réessayer</button></div>';
    }
  }
  function findPatient(query){
    const input=String(query||'').trim();
    if(!input)return;
    selectView('patients');
    let tries=0;
    const timer=setInterval(()=>{
      const search=document.querySelector('#clientSearch');
      if(search){clearInterval(timer);search.value=input;search.dispatchEvent(new Event('input',{bubbles:true}));search.focus();}
      else if(++tries>60)clearInterval(timer);
    },100);
  }

  document.querySelector('#extraView').addEventListener('click',event=>{
    const selected=event.target.closest('[data-dash-mode]'),shift=event.target.closest('[data-dash-shift]');
    if(selected){mode=selected.dataset.dashMode;refresh();}
    if(shift){const delta=Number(shift.dataset.dashShift);if(mode==='month'){anchor.setDate(1);anchor.setMonth(anchor.getMonth()+delta);}else anchor.setDate(anchor.getDate()+delta*(mode==='week'?7:1));refresh();}
    if(event.target.closest('[data-dash-today]')){anchor=new Date();refresh();}
    if(event.target.closest('[data-dash-refresh]')){if(document.querySelector('#pageTitle').textContent==='Vue d’ensemble')loadOverview();else refresh();}
    const status=event.target.closest('[data-dash-status]');
    if(status){document.querySelector('#filterStatus').value=status.dataset.dashStatus;selectView('appointments');document.querySelector('#filterStatus').dispatchEvent(new Event('input',{bubbles:true}));}
    const nav=event.target.closest('[data-dash-nav]');
    if(nav)selectView(nav.dataset.dashNav);
    if(event.target.closest('[data-dash-create]'))document.querySelector('#new').click();
    const open=event.target.closest('[data-dash-open]');
    if(open){const id=open.dataset.dashOpen;selectView('appointments');if(id)setTimeout(()=>openDetail(String(id)),0);}
  });
  document.querySelector('#extraView').addEventListener('input',event=>{
    if(event.target.matches('[data-dash-appointment-search]'))renderOverview(dashboardRows,event.target.value,true);
  });
  document.querySelector('#extraView').addEventListener('submit',event=>{
    if(!event.target.matches('.dash-patient-search'))return;
    event.preventDefault();findPatient(document.querySelector('#dashPatientSearch').value);
  });
  document.querySelector('#extraView').addEventListener('change',event=>{if(event.target.matches('[data-dash-date]')&&event.target.value){anchor=new Date(event.target.value+'T12:00:00');refresh();}});
  const login=document.querySelector('#login');
  new MutationObserver(()=>{if(!login.hidden){opened=false;return;}if(!opened){opened=true;selectView('dashboard');}}).observe(login,{attributes:true,attributeFilter:['hidden']});
  if(login.hidden){opened=true;selectView('dashboard');}
})();
