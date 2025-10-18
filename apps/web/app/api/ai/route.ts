import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

type ToolDef = { name: string, description: string, parameters: any };

// Tools mirrored in MCP server
const tools: ToolDef[] = [
  { name: 'search_templates', description: 'Semantic search templates by query', parameters: { type:'object', properties: { query: {type:'string'}}, required:['query']} },
  { name: 'save_page', description: 'Save AST to a site/path', parameters: { type:'object', properties: { subdomain:{type:'string'}, path:{type:'string'}, ast:{type:'object'}}, required:['subdomain','path','ast']}},
  { name: 'put_asset', description: 'Upload a base64 asset to object storage', parameters: { type:'object', properties: { key:{type:'string'}, base64:{type:'string'}, contentType:{type:'string'}}, required:['key','base64','contentType']}},
  { name: 'notify', description: 'Send a notification via Apprise', parameters: { type:'object', properties: { message:{type:'string'}}, required:['message']}},
];

export async function POST(req: NextRequest) {
  const body = await req.text();
  const { prompt } = JSON.parse(body || '{}');
  if (!prompt) return new Response('Missing prompt', { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const openaiKey = process.env.OPENAI_API_KEY || '';
      const mcpUrl = process.env.MCP_URL || 'http://mcp:8710';

      function log(msg: string) {
        controller.enqueue(encoder.encode(msg + "\n"));
      }

      try {
        // 1) Kick off a tool-aware Responses call
        let messages: any[] = [
          { role: 'system', content: 'You are a website section planner. When needed, call tools to search templates and save a page. Output succinct JSON AST when done.'},
          { role: 'user', content: prompt }
        ];

        while (true) {
          const res = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
              input: messages,
              tools: tools.map(t => ({ type:'function', function: t })),
              tool_choice: 'auto',
              temperature: 0.4
            })
          });

          if (!res.ok) {
            log('OpenAI error: ' + await res.text());
            break;
          }
          const data = await res.json();
          const out = data.output;
          if (!out || !Array.isArray(out)) { log(JSON.stringify(data)); break; }

          const last = out[out.length-1];
          if (last.type === 'message' && last.role === 'assistant') {
            log('ASSISTANT: ' + (last.content?.[0]?.text || '[no text]'));
            break;
          }

          const tool = out.find((x:any)=>x.type==='tool_call');
          if (!tool) { log(JSON.stringify(data)); break; }

          const { name, arguments: args } = tool;
          log(`TOOL_CALL: ${name}(${JSON.stringify(args)})`);

          // 2) Bridge to MCP (HTTP shim)
          const mres = await fetch(`${mcpUrl}/tool/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args || {})
          });
          const mjson = await mres.json();
          log('TOOL_RESULT: ' + JSON.stringify(mjson).slice(0, 2000));

          // 3) Feed result back to model and continue loop
          messages.push({ role:'tool', content: JSON.stringify(mjson), name });
          messages.push({ role:'user', content: 'Continue.' });
        }

        controller.close();
      } catch (e:any) {
        controller.enqueue(encoder.encode('ERROR: ' + e.message));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}
