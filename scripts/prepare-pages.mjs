import { access, copyFile, readFile, writeFile } from 'node:fs/promises';

const pastaBuild = new URL('../dist/', import.meta.url);
await access(new URL('mockServiceWorker.js', pastaBuild));
const html = await readFile(new URL('index.html', pastaBuild), 'utf8');
if (!html.includes('/Ponto-Verde/assets/')) {
  throw new Error(
    'O build não utiliza o base /Ponto-Verde/. Execute yarn build antes de preparar o Pages.',
  );
}
// O Pages entrega este mesmo HTML, com status 404, para uma rota profunda.
// A URL não é reescrita: o BrowserRouter preserva caminho, query string e fragmento.
await copyFile(new URL('index.html', pastaBuild), new URL('404.html', pastaBuild));
await writeFile(new URL('.nojekyll', pastaBuild), '');
console.log('Pages preparado: 404.html, .nojekyll, assets e Service Worker presentes.');
