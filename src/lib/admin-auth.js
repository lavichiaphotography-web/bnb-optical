import crypto from 'node:crypto';

function matches(expected, provided) {
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const accessProfiles = [
  { env: 'ADMIN_ACCESS_TOKEN', role: 'master', shop: null, name: 'Administration générale' },
  { env: 'LES_ALLEMANDS_ACCESS_TOKEN', role: 'shop', shop: 'les-allemands', name: 'Les Allemands' },
  { env: 'EL_BOUNI_ACCESS_TOKEN', role: 'shop', shop: 'el-bouni', name: 'El Bouni' },
  { env: 'VALMASCORT_ACCESS_TOKEN', role: 'shop', shop: 'valmascort', name: 'Valmascort' }
];

export function getAdminScope(request) {
  const header = request.headers.get('authorization') || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  return accessProfiles.find(profile => matches(process.env[profile.env] || '', provided)) || null;
}

export function isAdmin(request) { return Boolean(getAdminScope(request)); }
