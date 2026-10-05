import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../_worker.js',import.meta.url),'utf8');
const {default:worker} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const env = {ASSETS:{fetch:request => new Response(`asset:${new URL(request.url).pathname}`)}};
test('production and deployment aliases redirect once, preserving the full URL', async () => {
  for (const host of ['petruandines-higher-standards.pages.dev','abc123.petruandines-higher-standards.pages.dev']) {
    const response = await worker.fetch(new Request(`https://${host}/assets/images/logo-full.jpg?source=test`),env);
    assert.equal(response.status,301);
    assert.equal(response.headers.get('location'),'https://higherstandards.petruandines.com/assets/images/logo-full.jpg?source=test');
    const destination = await worker.fetch(new Request(response.headers.get('location')),env);
    assert.equal(destination.status,200);
    assert.equal(destination.headers.get('location'),null);
    assert.equal(await destination.text(),'asset:/assets/images/logo-full.jpg');
  }
});
test('canonical homepage serves assets without redirect; unrelated hostname is not redirected', async () => {
  assert.equal((await worker.fetch(new Request('https://higherstandards.petruandines.com/'),env)).status,200);
  assert.equal((await worker.fetch(new Request('https://petruandines.com/'),env)).status,404);
});
