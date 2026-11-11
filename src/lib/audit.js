import crypto from 'node:crypto';

export function actorName(request, fallback = 'Équipe B&B Optical') {
  const value = String(request.headers.get('x-staff-name') || '').trim().replace(/[<>]/g, '').slice(0, 80);
  return value || fallback;
}

export async function addAudit(client, { shopId = null, actor, action, entityType, entityId = null, details = null }) {
  await client.query(`insert into audit_logs (id,shop_id,actor_name,action,entity_type,entity_id,details)
    values ($1,$2,$3,$4,$5,$6,$7::jsonb)`, [crypto.randomUUID(), shopId, actor, action, entityType, entityId, details ? JSON.stringify(details) : null]);
}
