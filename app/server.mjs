// Transfer Desk demo server — serves the chat UI and POST /api/ask
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { ask } from './agent.mjs';

const PORT = process.env.PORT || 3817;
const html = readFileSync(new URL('./index.html', import.meta.url));

createServer(async (req, res) => {
  if (req.url === '/' || req.url.startsWith('/?')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(html);
  }
  if (req.url === '/api/ask' && req.method === 'POST') {
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', async () => {
      try {
        const { question } = JSON.parse(body);
        const t0 = Date.now();
        const out = await ask(question);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...out, ms: Date.now() - t0 }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(e) }));
      }
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`Transfer Desk on http://localhost:${PORT}`));
