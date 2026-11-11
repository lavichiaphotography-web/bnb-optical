(() => {
  let mode = 'week', anchor = new Date(), sequence = 0, opened = false;
  const names = ['Les Allemands', 'El Bouni', 'Valmascort'];
  const statuses = [['pending','En attente'],['accepted','Confirmés'],['arrived','Arrivés'],['done','Terminés'],['cancelled','Annulés'],['no_show','Absents']];
  const baseSelect = selectView;
  selectView = function(view) {
    if (view !== 'dashboard' && view !== 'statistics') { baseSelect(view); return; }
    baseSelect('statistics');
    document.querySelectorAll('.nav button').forEach(button => {
      button.classList.toggle('on', button.dataset.view === view);
      if (button.dataset.view === view) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
    document.querySelector('#pageTitle').textContent = view === 'dashboard' ? 'Tableau de bord' : 'Statistiques des magasins';
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
      if (id !== sequence || !['Tableau de bord','Statistiques des magasins'].includes(document.querySelector('#pageTitle').textContent)) return;
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
  document.querySelector('#extraView').addEventListener('click',event=>{
    const selected = event.target.closest('[data-dash-mode]'), shift = event.target.closest('[data-dash-shift]');
    if (selected) { mode=selected.dataset.dashMode;refresh(); }
    if (shift) { const delta=Number(shift.dataset.dashShift);if(mode==='month'){anchor.setDate(1);anchor.setMonth(anchor.getMonth()+delta);}else anchor.setDate(anchor.getDate()+delta*(mode==='week'?7:1));refresh(); }
    if(event.target.closest('[data-dash-today]')){anchor=new Date();refresh();}
    if(event.target.closest('[data-dash-refresh]'))refresh();
    if(event.target.closest('[data-dash-agenda]')){calendarMode=mode;calendarAnchor=new Date(anchor);selectView('calendar');}
  });
  document.querySelector('#extraView').addEventListener('change',event=>{if(event.target.matches('[data-dash-date]')&&event.target.value){anchor=new Date(event.target.value+'T12:00:00');refresh();}});
  const login=document.querySelector('#login');
  new MutationObserver(()=>{if(!login.hidden){opened=false;return;}if(!opened){opened=true;selectView('calendar');}}).observe(login,{attributes:true,attributeFilter:['hidden']});
  if(login.hidden){opened=true;selectView('calendar');}
})();
