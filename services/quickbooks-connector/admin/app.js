const apiBase = '/api/admin';

function authHeaders(){
  const token = document.getElementById('token').value.trim();
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

// obtain server-side session (connector will exchange client credentials and set cookie)
async function obtainSession(){
  try{ await fetch(apiBase + '/session', { method: 'POST' }); } catch(e){ console.warn('session obtain failed', e); }
}

async function fetchList(){
  const res = await fetch(apiBase + '/mappings', { headers: authHeaders() });
  const data = await res.json();
  const tbody = document.getElementById('list');
  tbody.innerHTML = '';
  data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.realm_id}</td><td>${row.tenant_id}</td><td>${row.company_name||''}</td><td>${new Date(row.created_at).toLocaleString()}</td><td><button data-realm="${row.realm_id}" class="del">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.del').forEach(b=>b.addEventListener('click', async (e)=>{
    const realm = e.currentTarget.getAttribute('data-realm');
    if(!confirm('Delete mapping for '+realm+'?')) return;
    await fetch(apiBase + '/mappings/' + encodeURIComponent(realm), { method: 'DELETE', headers: authHeaders() });
    fetchList();
  }));
}

document.getElementById('create').addEventListener('click', async ()=>{
  const realm = document.getElementById('realm').value.trim();
  const tenant = document.getElementById('tenant').value.trim();
  const company = document.getElementById('company').value.trim();
  if(!realm || !tenant){ alert('realmId and tenantId required'); return; }
  await fetch(apiBase + '/mappings', { method: 'POST', headers: Object.assign({'content-type':'application/json'}, authHeaders()), body: JSON.stringify({ realmId: realm, tenantId: tenant, companyName: company }) });
  document.getElementById('realm').value=''; document.getElementById('tenant').value=''; document.getElementById('company').value='';
  fetchList();
});

// try server-side session first
obtainSession().then(()=>fetchList());
