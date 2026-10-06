import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
await rm('dist-pages', { recursive: true, force: true });
await mkdir('dist-pages');
for (const path of ['index.html', 'legal', 'assets', 'styles.css', 'script.js', 'robots.txt', 'sitemap.xml', '_worker.js', '_routes.json']) {
  if (await stat(path).catch(() => null)) await cp(path, `dist-pages/${path}`, { recursive: true });
}
for (const page of ['index.html', 'legal/index.html']) {
const html = await readFile(`dist-pages/${page}`, 'utf8');
for (const [, path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(?:https?:|mailto:|tel:)/.test(path)) {
    const root = new URL(`file://${process.cwd()}/dist-pages/`);
    const local = path.split(/[?#]/)[0];
    await stat(new URL(local.startsWith('/') ? local.slice(1) : local, local.startsWith('/') ? root : new URL(page, root)));
  }
}
}
console.log('Public assets prepared; local image, CSS and script references verified.');
