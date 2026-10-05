import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
await rm('dist-pages', { recursive: true, force: true });
await mkdir('dist-pages');
for (const path of ['index.html', 'assets', 'styles.css', 'script.js', 'robots.txt', 'sitemap.xml', '_worker.js', '_routes.json']) {
  if (await stat(path).catch(() => null)) await cp(path, `dist-pages/${path}`, { recursive: true });
}
const html = await readFile('dist-pages/index.html', 'utf8');
for (const [, path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(?:https?:|mailto:|tel:)/.test(path)) await stat(`dist-pages/${path.split('?')[0]}`);
}
console.log('Public assets prepared; local image, CSS and script references verified.');
