import { readdir, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { publicPath } from '../site/analytics.js';
const production = process.argv.includes('--production') || process.env.DEPLOY_MODE === 'production' || process.env.VERCEL_ENV === 'production';
if (production) {
  await build({ entryPoints: ['site/analytics.js'], bundle: true, minify: true, format: 'iife', outfile: 'dist/analytics.js', define: { 'process.env.NODE_ENV': '"production"' } });
  let count = 0;
  async function walk(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      const file = dir + '/' + item.name;
      if (item.isDirectory()) await walk(file);
      else if (item.name === 'index.html') {
        const route = file.slice(4).replace(/index\.html$/, '');
        if (!publicPath(route)) continue;
        const html = await readFile(file, 'utf8');
        if (/src=["'][^"']*(?:analytics|insights)/.test(html)) throw Error('Duplicate analytics: ' + route);
        await writeFile(file, html.replace('</body>', '<script defer src="/analytics.js"></script></body>'));
        count++;
      }
    }
  }
  await walk('dist');
  console.log('Analytics: ' + count + ' public learning/home pages; private and preview routes excluded.');
}
