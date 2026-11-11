import { relay } from '../../../lib/api-relay.js';

const API_ORIGIN = 'https://api.bboptical.com';

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const local = raw.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
  return local ? `${local[3]}-${local[2]}-${local[1]}` : '';
}

function normalizeTime(value) {
  return String(value || '').trim().slice(0, 5);
}

function canonicalShop(value) {
  const key = normalize(value);
  const aliases = {
    'les-allemands': ['les-allemands'],
    'el-bouni': ['el-bouni'],
    valmascort: ['valmascort']
  };
  for (const [canonical, names] of Object.entries(aliases)) {
    if (canonical === key || names.includes(key)) return canonical;
  }
  return key;
}

export async function POST(request) {
  const authorization = request.headers.get('authorization');
  if (!authorization) return relay(request);

  let payload;
  try {
    payload = await request.clone().json();
  } catch {
    return relay(request);
  }

  const date = normalizeDate(payload.date);
  const time = normalizeTime(payload.time);
  const shop = canonicalShop(payload.shop || payload.place);
  if (!date || !time || !shop) return relay(request);

  const query = new URLSearchParams({ from: date, to: date, calendar: '1' });
  const headers = {
    accept: 'application/json',
    authorization,
    'user-agent': 'BBOptical-Server/1.0'
  };
  const staffName = request.headers.get('x-staff-name');
  if (staffName) headers['x-staff-name'] = staffName;

  try {
    const check = await fetch(`${API_ORIGIN}/api/admin/appointments?${query}`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(12000)
    });
    const data = await check.json().catch(() => null);
    if (!check.ok || !Array.isArray(data?.appointments)) {
      return Response.json(
        { error: 'Impossible de vérifier la disponibilité. Réessayez dans un instant.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const conflict = data.appointments.some(item => {
      if (['cancelled', 'refused', 'cancel'].includes(String(item.status || '').toLowerCase())) return false;
      if (normalizeDate(item.date || item.start_at) !== date) return false;
      if (normalizeTime(item.time || item.start_time) !== time) return false;
      if (item.isSharedBusy) return true;
      const existingShop = item.place || item.shop || item.shop_id || item.store_id || item.establishment || item.shop_name;
      return existingShop && canonicalShop(existingShop) === shop;
    });

    if (conflict) {
      return Response.json(
        { error: 'Ce créneau est déjà réservé dans ce magasin. Choisissez une autre heure.' },
        { status: 409, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  } catch {
    return Response.json(
      { error: 'Impossible de vérifier la disponibilité. Réessayez dans un instant.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return relay(request);
}
