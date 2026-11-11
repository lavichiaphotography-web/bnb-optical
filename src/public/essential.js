(() => {
  document.querySelectorAll('.nav [data-view="reminders"],.nav [data-view="audit"]').forEach(button=>button.remove());
  const base=selectView;
  selectView=function(view){
    if(view==='dashboard')view='statistics';
    base(view);
    document.querySelector('#new').hidden=!['calendar','appointments'].includes(view);
    document.querySelector('#newRx').hidden=view!=='prescriptions';
  };
  document.querySelector('#new').textContent='+ Rendez-vous';
  document.querySelector('#newRx').textContent='+ Ordonnance';
  document.querySelector('#previewRx').hidden=true;
  document.querySelector('#rxAge').closest('.field').hidden=true;
  document.querySelectorAll('#prescriptionForm .rx-help,#prescriptionForm .rx-signature,#prescriptionForm .rx-footer,#prescriptionModal > .create-card > .rx-letterhead,.rx-patient').forEach(el=>el.hidden=true);
  const history=document.querySelector('#rxHistory');
  if(history){const details=document.createElement('details');details.className='rx-patient-history';const summary=document.createElement('summary');summary.textContent='Historique du patient';details.append(summary);history.before(details);details.append(history);}
  document.querySelector('#extraView').addEventListener('change',event=>{if(event.target.matches('[data-agenda-status]'))setAgendaStatus(event.target.dataset.agendaStatus,event.target.value)});
  if(document.querySelector('#login').hidden)selectView('appointments');
})();
