// Transfer Desk — an award-travel transfer-partner agent.
// Agent harness: ReAct loop over Sanity Context MCP (Knowledge Base mode)
// + an OpenAI-compatible chat model. No frameworks — the loop is ~100 lines.

const MCP_URL =
  process.env.SANITY_CONTEXT_MCP_URL ||
  'https://api.sanity.io/v1/context/organizations/oug87v8uh/mcp/transfer-desk';
const ORG_TOKEN = process.env.SANITY_ORGANIZATION_TOKEN;
// provider fallbacks: try in order on rate-limit/error
const PROVIDERS = [
  { url: process.env.LLM_BASE_URL || 'https://api.voidai.app/v1', key: process.env.LLM_API_KEY, model: process.env.LLM_MODEL || 'gpt-4o-mini' },
  { url: 'https://api.groq.com/openai/v1', key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b' },
].filter(p => p.key);

// ---------- minimal MCP (Streamable HTTP, JSON-RPC 2.0) ----------
let rpcId = 0;
async function mcp(method, params = {}) {
  const r = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ORG_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
  });
  const text = await r.text();
  // server may answer with plain JSON or an SSE stream; take the first data frame
  if (text.trimStart().startsWith('{')) return JSON.parse(text);
  for (const line of text.split('\n')) {
    if (line.startsWith('data:')) {
      try { return JSON.parse(line.slice(5).trim()); } catch { /* keep looking */ }
    }
  }
  throw new Error('Bad MCP response: ' + text.slice(0, 300));
}
async function callTool(name, args) {
  const r = await mcp('tools/call', { name, arguments: args });
  const parts = r?.result?.content || [];
  return parts.map(p => p.text || JSON.stringify(p)).join('\n');
}

// ---------- LLM ----------
const SYSTEM = `You are Transfer Desk, an award-travel agent answering whether flexible credit-card points can be transferred to a given airline or hotel program, and on what terms.

Points transfers are IRREVERSIBLE. A wrong answer costs real money, so you never answer from memory — you always check the knowledge base first.

You have tools served by a Sanity Context MCP endpoint:
- initial_context — call first; returns the knowledge-base outline (entry paths) and its id.
- knowledge_base_read — args {"knowledgeBase": "<kb id>", "paths": ["entry/path", ...]}. Read several candidate paths at once.

Reply with EXACTLY ONE JSON object, no prose:
{"action":"tool","name":"<tool>","args":{...}}
or
{"action":"final","answer":"<markdown answer>"}

Final-answer rules:
- Lead with the verdict: YES / NO / CHANGED.
- If any sources disagree (a stale guide vs a current official list, an old ratio vs a new one), present EVERY conflicting claim with its source name and as-of date. Never silently pick one — flag it as a conflict and say which claim is current and why.
- Always cite the source names and as-of dates the knowledge base gave you.
- Keep it tight: verdict, the current rule, conflicts if any, one line of practical advice.`;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function llm(messages) {
  let lastErr;
  for (const p of PROVIDERS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetch(`${p.url}/chat/completions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${p.key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: p.model, messages, temperature: 0.2 }),
        });
        const d = await r.json();
        if (!r.ok) {
          if (r.status === 429) { lastErr = new Error('rate limited'); await sleep(4000 * (attempt + 1)); continue; }
          throw new Error(`LLM ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
        }
        return d.choices[0].message.content;
      } catch (e) { lastErr = e; await sleep(1500); }
    }
  }
  throw lastErr;
}

const TOOL_NAMES = ['initial_context', 'knowledge_base_read'];
function parseAction(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return { action: 'final', answer: text };
  try {
    const a = JSON.parse(m[0]);
    // normalize: {"action":"<toolName>"} or {"name":"<tool>","arguments":{...}}
    if (a.action === 'tool' && a.name) return { action: 'tool', name: a.name, args: a.args || a.arguments || {} };
    if (TOOL_NAMES.includes(a.action)) return { action: 'tool', name: a.action, args: a.args || a.arguments || {} };
    if (a.name && TOOL_NAMES.includes(a.name)) return { action: 'tool', name: a.name, args: a.args || a.arguments || {} };
    if (a.action === 'final') return { action: 'final', answer: a.answer || a.text || text };
    return { action: 'final', answer: text };
  } catch { return { action: 'final', answer: text }; }
}

// ---------- agent loop ----------
export async function ask(question, onEvent = () => {}) {
  const trace = [];
  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: question },
  ];
  for (let i = 0; i < 8; i++) {
    const raw = await llm(messages);
    const action = parseAction(raw);
    if (action.action === 'final') {
      trace.push({ type: 'answer', text: action.answer });
      onEvent({ type: 'answer', text: action.answer });
      return { answer: action.answer, trace };
    }
    if (action.action === 'tool') {
      trace.push({ type: 'call', tool: action.name, args: action.args });
      onEvent({ type: 'call', tool: action.name, args: action.args });
      let result;
      try {
        result = await callTool(action.name, action.args || {});
      } catch (e) {
        result = `tool error: ${e.message}`;
      }
      trace.push({ type: 'result', tool: action.name, text: result.slice(0, 6000) });
      onEvent({ type: 'result', tool: action.name, text: result.slice(0, 2000) });
      messages.push({ role: 'assistant', content: raw });
      messages.push({
        role: 'user',
        content: `Tool "${action.name}" returned:\n${result.slice(0, 14000)}\n\nReply with one JSON action.`,
      });
      continue;
    }
    // unknown action: treat as final
    trace.push({ type: 'answer', text: raw });
    return { answer: raw, trace };
  }
  return { answer: 'Stopped after 8 steps without a verdict.', trace };
}
