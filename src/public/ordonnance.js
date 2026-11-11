(() => {
  const $ = id => document.getElementById(id);
  const value = id => $(id)?.value?.trim() || '';
  const date = input => /^\d{4}-\d{2}-\d{2}$/.test(input) ? new Intl.DateTimeFormat('fr-DZ').format(new Date(input + 'T12:00:00')) : '—';
  const power = input => input === '' ? '—' : Number.isFinite(Number(input)) ? (Number(input) >= 0 ? '+' : '−') + Math.abs(Number(input)).toFixed(2) : '—';
  function sync() {
    const data = {
      patient: [value('rxLastName'), value('rxFirstName')].filter(Boolean).join(' ') || '—',
      birth: date(value('rxBirthDate')), age: value('rxAge') ? value('rxAge') + ' ans' : '—',
      date: date(value('rxDate')), dp: value('rxDp') ? value('rxDp') + ' mm' : '—',
      add: power(value('rxAdd')), observations: value('rxObservations') || '—',
      lensMeta: [value('lensBrand'), value('lensSchedule')].filter(Boolean).join(' · '),
    };
    for (const prefix of ['od', 'og', 'nearOd', 'nearOg', 'lensOd', 'lensOg']) {
      for (const suffix of ['Sph', 'Cyl', 'Axis', 'Power', 'Bc', 'Dia']) {
        const key = prefix + suffix;
        if (!$(key)) continue;
        const input = value(key);
        data[key] = ['Sph', 'Cyl', 'Power'].includes(suffix) ? power(input) : input ? input + (suffix === 'Axis' ? '°' : '') : '—';
      }
    }
    document.querySelectorAll('[data-ord]').forEach(el => el.textContent = data[el.dataset.ord] ?? '—');
    $('ordContacts').hidden = !$('rxLensEnabled').checked;
  }
  $('previewRx').addEventListener('click', () => {
    sync();
    $('rxDocument').classList.toggle('is-preview');
    $('previewRx').textContent = $('rxDocument').classList.contains('is-preview') ? 'Masquer l’aperçu' : 'Voir l’aperçu';
    if ($('rxDocument').classList.contains('is-preview')) $('rxDocument').scrollIntoView({behavior: 'smooth', block: 'start'});
  });
  $('prescriptionForm').addEventListener('input', sync);
  $('prescriptionForm').addEventListener('change', sync);
  window.addEventListener('beforeprint', sync);
})();
