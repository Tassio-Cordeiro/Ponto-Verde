import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Servidor de verificação: reproduz o fallback 404 do Pages, sem rewrite 200 do Vite.
const pastaBuild = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const base = '/Ponto-Verde/';
const porta = 4176;
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};
const servidor = createServer(async (requisicao, resposta) => {
  try {
    const caminho = decodeURIComponent(new URL(requisicao.url ?? '/', 'http://localhost').pathname);
    if (!caminho.startsWith(base)) throw new Error('fora-do-base');
    let arquivo = resolve(pastaBuild, caminho.slice(base.length) || 'index.html');
    if (!arquivo.startsWith(pastaBuild + sep)) throw new Error('fora-do-build');
    if ((await stat(arquivo)).isDirectory()) arquivo = resolve(arquivo, 'index.html');
    const conteudo = await readFile(arquivo);
    resposta.writeHead(200, {
      'Content-Type': tipos[extname(arquivo)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    resposta.end(requisicao.method === 'HEAD' ? undefined : conteudo);
  } catch {
    resposta.writeHead(404, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    resposta.end(
      requisicao.method === 'HEAD' ? undefined : await readFile(resolve(pastaBuild, '404.html')),
    );
  }
});
servidor.listen(porta, '127.0.0.1', () =>
  console.log(`Pages local: http://127.0.0.1:${porta}${base}`),
);
process.once('SIGTERM', () => servidor.close());
process.once('SIGINT', () => servidor.close());
