'use client';
import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('Restaurant homepage with hero, menu highlights, and booking CTA.');
  const [stream, setStream] = useState('');

  async function run() {
    setStream('');
    const res = await fetch('/api/ai', { method: 'POST', body: JSON.stringify({ prompt })});
    if (!res.ok || !res.body) { setStream('Error.'); return; }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      setStream(s => s + dec.decode(value));
    }
  }

  return (
    <main style={{padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
      <section>
        <h1>TheLux Vibe Builder</h1>
        <p>Describe the vibe. We build the sections. MCP tools fetch templates/assets and save pages.</p>
        <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={6} style={{width:'100%'}}/>
        <div><button onClick={run}>Generate</button></div>
        <p style={{opacity:.6}}>Streams model+tool traces below.</p>
      </section>
      <section>
        <pre style={{background:'#111', color:'#0f0', padding:12, height:400, overflow:'auto'}}>{stream}</pre>
      </section>
    </main>
  );
}
