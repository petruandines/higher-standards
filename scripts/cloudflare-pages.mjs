import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const account = '47b9f8498a9865c0fbbaca8f0f5cf59d';
const project = 'petruandines-higher-standards';
const hostname = 'higherstandards.petruandines.com';
const projectPath = `/accounts/${account}/pages/projects/${project}`;
const token = process.env.CLOUDFLARE_API_TOKEN;
assert(token, 'Missing CLOUDFLARE_API_TOKEN repository secret.');
async function api(path, method = 'GET', body, allow404 = false) {
  // Every mutation is confined to this Pages project or the exact new DNS name.
  assert(method === 'GET' || path === `/accounts/${account}/pages/projects` || path.startsWith(projectPath + '/') || /^\/zones\/[^/]+\/dns_records$/.test(path));
  if (method !== 'GET' && path.endsWith('/dns_records')) assert.equal(body.name, hostname);
  if (method !== 'GET' && path.endsWith('/pages/projects')) assert.equal(body.name, project);
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000)
  });
  const data = await response.json();
  if (allow404 && response.status === 404) return null;
  if (!response.ok || !data.success) throw new Error(`Cloudflare ${method} ${path}: ${response.status}; ${JSON.stringify(data.errors)}`);
  return data.result;
}
async function zone() {
  const zones = await api('/zones?name=petruandines.com&status=active');
  assert.equal(zones.length, 1, 'Expected one active petruandines.com zone');
  assert.equal(zones[0].account.id, account);
  return zones[0].id;
}
async function protectedState(zoneId) {
  let records = [];
  for (let page = 1; ; page++) {
    const result = await api(`/zones/${zoneId}/dns_records?per_page=100&page=${page}`);
    records.push(...result);
    if (result.length < 100) break;
  }
  const main = await api(`/accounts/${account}/pages/projects/petruandines-site`);
  return {
    dns: records.filter(r => r.name !== hostname).map(({id,type,name,content,proxied,ttl,priority}) => ({id,type,name,content,proxied,ttl,priority:priority ?? null})).sort((a,b) => a.id.localeCompare(b.id)),
    main: { id: main.id, domains: main.domains, deployment: main.canonical_deployment?.id }
  };
}
async function page(url) {
  const response = await fetch(url, {redirect:'manual', signal:AbortSignal.timeout(20000)});
  return { status:response.status, location:response.headers.get('location'), text:await response.text() };
}
const digest = text => createHash('sha256').update(text).digest('hex');
const mode = process.argv[2];
if (mode === 'prepare') {
  const zoneId = await zone();
  const before = await protectedState(zoneId);
  const home = await page('https://petruandines.com/');
  assert.equal(home.status, 200);
  await writeFile('.cloudflare-before.json', JSON.stringify({zoneId,before,mainHash:digest(home.text)}));
  let existing = await api(projectPath, 'GET', undefined, true);
  if (!existing) existing = await api(`/accounts/${account}/pages/projects`, 'POST', {name:project,production_branch:'main'});
  assert.equal(existing.name, project);
  assert.equal(existing.production_branch, 'main');
  assert.equal(existing.subdomain, `${project}.pages.dev`);
  assert((existing.domains || []).every(d => d === hostname || d === `${project}.pages.dev`));
  console.log(`Target ready: ${project}; main site and unrelated DNS captured for comparison.`);
} else if (mode === 'domain') {
  const {zoneId} = JSON.parse(await readFile('.cloudflare-before.json','utf8'));
  const domains = await api(`${projectPath}/domains`);
  if (!domains.some(d => d.name === hostname)) await api(`${projectPath}/domains`, 'POST', {name:hostname});
  const records = await api(`/zones/${zoneId}/dns_records?name=${hostname}`);
  if (!records.length) await api(`/zones/${zoneId}/dns_records`, 'POST', {type:'CNAME',name:hostname,content:`${project}.pages.dev`,proxied:true,ttl:1});
  else {
    assert.equal(records.length, 1, 'Conflicting records for the new subdomain; no record has been overwritten.');
    assert.equal(records[0].type, 'CNAME');
    assert.equal(records[0].content, `${project}.pages.dev`);
    assert.equal(records[0].proxied, true);
  }
  console.log(`Custom domain requested: https://${hostname}/`);
} else if (mode === 'verify') {
  const baseline = JSON.parse(await readFile('.cloudflare-before.json','utf8'));
  let verified = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const domain = await api(`${projectPath}/domains/${hostname}`);
      const home = await page(`https://${hostname}/`);
      if (domain.status === 'active' && home.status === 200 && home.text.includes('Aircraft Cleaning')) { verified = true; break; }
      console.log(`Waiting for certificate/domain activation (${attempt + 1}/60): ${domain.status}; HTTP ${home.status}`);
    } catch { console.log(`Waiting for HTTPS/DNS readiness (${attempt + 1}/60)`); }
    await new Promise(resolve => setTimeout(resolve,10000));
  }
  assert(verified, 'Custom domain is not yet verified; SEO and old-site migration must wait.');
  for (const path of ['assets/css/style.css','assets/js/script.js','assets/images/logo-full.jpg','assets/images/aircraft-hero.svg']) {
    assert.equal((await page(`https://${hostname}/${path}`)).status,200,path);
  }
  assert.deepEqual(await protectedState(baseline.zoneId),baseline.before,'Main Pages project or unrelated DNS changed.');
  const main = await page('https://petruandines.com/');
  assert.equal(main.status,200);
  assert.equal(digest(main.text),baseline.mainHash,'Main homepage changed.');
  console.log('VERIFIED: Higher Standards HTTPS 200, core assets 200, no root redirect; main project, unrelated DNS and main homepage unchanged.');
} else throw new Error('Expected prepare, domain or verify');
