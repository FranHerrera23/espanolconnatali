import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const assetFiles = {
  MALLORCA: ['private-preview/themes/mallorca.jpg', 'image/jpeg'],
  PINAR: ['private-preview/themes/pinar.jpg', 'image/jpeg'],
  LYNX: ['private-preview/themes/lynx-small.png', 'image/png'],
  'ONEST-REGULAR': ['private-preview/themes/onest-400.woff', 'font/woff'],
  'ONEST-SEMIBOLD': ['private-preview/themes/onest-600.woff', 'font/woff'],
};
const [shell, original, result, assets] = await Promise.all([
  readFile('private-preview/pilot-shell.html', 'utf8'),
  readFile('private-preview/tutor-shell.html', 'utf8'),
  build({ entryPoints: ['private-preview/pilot-client.js'], bundle: true, minify: true, write: false, format: 'esm', target: 'es2022' }),
  Promise.all(Object.entries(assetFiles).map(async ([marker, [path, type]]) =>
    [marker, `data:${type};base64,${(await readFile(path)).toString('base64')}`])),
]);
const avatar = /class="natali-avatar" src="(data:image\/webp;base64,[^"]+)"/.exec(original)?.[1];
if (!avatar) throw new Error('Missing existing photo of Natali');
const js = result.outputFiles[0].text.replaceAll('</script', '<\\/script');
const replacements = Object.fromEntries([...assets, ['AVATAR', avatar], ['CLIENT', `<script type="module">${js}</script>`]]);
await writeFile('private-preview/pilot.html', shell.replace(/<!--([A-Z-]+)-->/g, (match, key) => replacements[key] ?? match));
