const API_ORIGIN = 'https://api.bboptical.com';
export async function relay(request, path) {
  const headers = new Headers({accept:'application/json','user-agent':'BBOptical-Server/1.0'});
  for (const key of ['content-type','origin','authorization','x-staff-name']) {
    const value = request.headers.get(key);
    if (value) headers.set(key,value);
  }
  try {
    const response = await fetch(API_ORIGIN + new URL(request.url).pathname + new URL(request.url).search, {
      method:request.method, headers, redirect:'manual', cache:'no-store',
      signal:AbortSignal.timeout(25000),
      ...(!['GET','HEAD'].includes(request.method)?{body:await request.arrayBuffer()}:{})
    });
    if (response.status>=300 && response.status<400) throw new Error('upstream_redirect');
    return new Response(response.body,{status:response.status,headers:{
      'Content-Type':response.headers.get('content-type')||'application/json',
      'Cache-Control':'no-store'
    }});
  } catch {
    return Response.json({error:'Service temporairement indisponible.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
