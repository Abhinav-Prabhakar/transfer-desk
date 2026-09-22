# Transfer Desk

**Transfers are irreversible. Ask first.**

An award-travel agent that answers whether flexible credit-card points can be
transferred to a given airline or hotel program — and under which terms —
without ever guessing. Built for the DEV.to Sanity Challenge (Path One).

Every answer is grounded in a **Sanity Context Knowledge Base**, queried over a
hosted **Sanity Context MCP** endpoint. When sources disagree — a 2018 blog
claiming a dead transfer route vs. the current official partner list — the
agent surfaces *both* claims with their sources and dates instead of silently
picking one.

## Why a Knowledge Base

Transfer rules are the worst kind of content for an agent:

- They change constantly (Chase dropped Korean SkyPass in 2018; Bilt dropped
  AAdvantage in 2024; Citi *added* AAdvantage in 2024).
- Old advice never dies — high-ranking blog posts keep claiming stale rules
  for years.
- The cost of a wrong answer is irreversible: once points leave your account
  they do not come back.

A keyword search happily hands you the stale claim. A Knowledge Base keeps
every claim tied to its source and as-of date, and files issues when sources
contradict each other.

## Stack

- **Sanity dataset** (`production`): `pointsCurrency`, `program`,
  `transferClaim` (asserted rule + ratio + status + asOf + typed source) and
  `scenario` docs — including deliberately conflicting archived claims.
- **Sanity Context Knowledge Base** `kb7RVRWsQaU8` built from that dataset +
  crawled program pages.
- **Sanity Context MCP** endpoint `transfer-desk` serving
  `initial_context` + `knowledge_base_read` to the agent.
- **Agent** (`app/agent.mjs`): a ~100-line ReAct loop — the model emits one
  JSON action at a time (`tool` call or `final` answer) over the MCP endpoint,
  then composes a verdict that must cite sources and surface conflicts.
- **Demo UI** (`app/index.html`): departure-board style chat that shows the
  raw MCP tool calls and results next to the verdict.

## Run it

```bash
cp .env.example .env   # fill in SANITY_ORGANIZATION_TOKEN + one LLM key
npm start              # http://localhost:3817
```

Reseed the dataset into your own project:

```bash
SANITY_PROJECT_ID=xxx SANITY_PROJECT_TOKEN=sk... npm run seed
```

## Sanity project details

- Project ID: `tu8ddemy`
- Dataset: `production` (public)
- Public dataset API:
  `https://tu8ddemy.api.sanity.io/v2025-02-19/data/query/production?query=*%5B%5D`
- Context MCP endpoint:
  `https://api.sanity.io/v1/context/organizations/oug87v8uh/mcp/transfer-desk`
  (needs an org token with Context Viewer permissions)
- Knowledge Base: `kb7RVRWsQaU8`
