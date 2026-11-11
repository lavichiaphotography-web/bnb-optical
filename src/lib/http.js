export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function originAllowed(request) {
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = request.headers.get('origin');
  return !allowed || !origin || origin === allowed;
}
