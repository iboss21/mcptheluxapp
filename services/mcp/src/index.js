import http from 'http';
import { Pool } from 'pg';
import { Client as MinioClient } from 'minio';

// ENV
const PORT = process.env.PORT || 8710;
const DATABASE_URL = process.env.DATABASE_URL || '';
const QDRANT_URL = process.env.QDRANT_URL || 'http://qdrant:6333';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'templates';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'minio';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_SSL = process.env.MINIO_SSL === 'true';
const MINIO_ACCESS = process.env.MINIO_ACCESS_KEY || '';
const MINIO_SECRET = process.env.MINIO_SECRET_KEY || '';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'thelux';
const APPRISE_URL = process.env.APPRISE_URL || 'http://apprise:8000/notify';

const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, max: 5 }) : null;
const minio = new MinioClient({ endPoint: MINIO_ENDPOINT, port: MINIO_PORT, useSSL: MINIO_SSL, accessKey: MINIO_ACCESS, secretKey: MINIO_SECRET });

async function ensureBucket() {
  try {
    const exists = await minio.bucketExists(MINIO_BUCKET);
    if (!exists) await minio.makeBucket(MINIO_BUCKET, 'us-east-1');
  } catch (e) {
    console.error('MinIO bucket check/create failed', e.message);
  }
}
ensureBucket();

async function json(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', d => buf += d);
    req.on('end', () => {
      try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); }
    });
  });
}

// ---- Tools (HTTP shim endpoints) ----
// POST /tool/search_templates { query: string }
async function search_templates({ query }) {
  // 1) embed query via OpenAI (text-embedding-3-small: 1536 dims)
  const embRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: query })
  });
  const embJson = await embRes.json();
  const vector = embJson.data[0].embedding;

  // 2) query Qdrant
  const qres = await fetch(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vector, limit: 5 })
  });
  const qjson = await qres.json();
  return qjson;
}

// POST /tool/save_page { subdomain, path, ast }
async function save_page({ subdomain, path, ast }) {
  if (!pool) throw new Error('DB not configured');
  // upsert site by subdomain
  await pool.query(`insert into sites (id, subdomain) values ($1, $1) on conflict (id) do nothing`, [subdomain]);
  await pool.query(`insert into pages (site_id, path, ast) values ($1, $2, $3)
                    on conflict (site_id, path) do update set ast=EXCLUDED.ast, updated_at=now()`,
                    [subdomain, path || '/', ast]);
  return { ok: true };
}

// POST /tool/put_asset { key, base64, contentType }
async function put_asset({ key, base64, contentType }) {
  const buf = Buffer.from(base64, 'base64');
  await minio.putObject(MINIO_BUCKET, key, buf, { 'Content-Type': contentType });
  const url = `${MINIO_SSL ? 'https' : 'http'}://${MINIO_ENDPOINT}:${MINIO_PORT}/${MINIO_BUCKET}/${encodeURIComponent(key)}`;
  return { key, url };
}

// POST /tool/notify { message }
async function notify({ message }) {
  try {
    const res = await fetch(APPRISE_URL, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ body: message })});
    const t = await res.text();
    return { ok: true, response: t.slice(0,2000) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// POST /tool/trigger_flow { url, payload }
async function trigger_flow({ url, payload }) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload || {}) });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 2000) };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, {'Content-Type':'application/json'});
      return res.end(JSON.stringify({ ok:true }));
    }

    if (req.method === 'POST' && req.url?.startsWith('/tool/')) {
      const tool = req.url.split('/').pop();
      const body = await json(req);

      let result;
      if (tool === 'search_templates') result = await search_templates(body);
      else if (tool === 'save_page') result = await save_page(body);
      else if (tool === 'put_asset') result = await put_asset(body);
      else if (tool === 'notify') result = await notify(body);
      else if (tool === 'trigger_flow') result = await trigger_flow(body);
      else throw new Error('Unknown tool: '+tool);

      res.writeHead(200, {'Content-Type':'application/json'});
      return res.end(JSON.stringify(result));
    }

    res.writeHead(404); res.end('Not found');
  } catch (e) {
    res.writeHead(500, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => console.log('MCP shim listening on', PORT));
