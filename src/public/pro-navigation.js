(() => {
  // One local home entry: the first Back stays in the professional workspace.
  // Do not reinsert entries on popstate, so leaving the site remains possible.
  const key = 'bbProfessionalNavigation';
  const existing = history.state && typeof history.state === 'object' ? history.state : {};
  if (!existing[key]) {
    history.replaceState({ ...existing, [key]: 'home' }, '', location.href);
    history.pushState({ [key]: 'workspace' }, '', location.href);
  }
  addEventListener('popstate', event => {
    if (!event.state || !event.state[key]) return;
    for (const close of [
      typeof closeCreate === 'function' ? closeCreate : null,
      typeof closePatientPicker === 'function' ? closePatientPicker : null,
      typeof closePrescription === 'function' ? closePrescription : null,
      typeof closeDetail === 'function' ? closeDetail : null,
    ]) close?.();
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    if (document.querySelector('#login')?.hidden && typeof selectView === 'function') selectView('calendar');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
})();
