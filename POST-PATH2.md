---
title: "I let an agent build the whole thing: an app born inside Sanity's APIs"
published: false
tags: devchallenge, sanitychallenge, sanity, webdev
---

*This is a submission for the [Sanity Challenge, Path Two: Vibe-Code Something Strange](https://dev.to/challenges/sanity-2026-09-16)*

## What I Built

**Transfer Desk** — a departure-board-styled web app where you ask whether your credit-card points can transfer to a given airline or hotel program, and get a verdict that cites its sources and *shows you the conflicts* — including the stale blog posts that are still lying to you.

Who is it for: anyone who has ever googled "does Chase transfer to Korean Air" (answer since 2018: no, and half the internet is wrong about it).

Live replay of real sessions: https://abhinav-prabhakar.github.io/transfer-desk/

## The strange part

The vibe-coder in this story is an AI coding agent, and the "prompting" happened entirely through Sanity's own APIs. There was no Studio checkout, no `sanity init`, no dashboard clicking for the important parts — the agent:

1. Created a Sanity account, project (`tu8ddemy`), and dataset over plain HTTPS calls.
2. Modeled the schema as documents (`pointsCurrency`, `program`, `transferClaim`, `scenario`) — including deliberately *conflicting* claims with typed sources (`official` / `secondary` / `archived`) and `asOf` dates.
3. Turned on **Sanity Context** for the org, created a **Knowledge Base** (`kb7RVRWsQaU8`), attached a dataset source (a GROQ query) plus a crawled website source, and triggered the build — all via the `v2026-05-26/context/...` endpoints the Context app itself calls.
4. Created a **Context MCP endpoint** (`transfer-desk`) with instructions baked in, then pointed a ~100-line ReAct agent at it.
5. Recorded the real sessions and shipped them as a static GitHub Pages demo.

The build process *is* the demo: a system designed to feed agents was assembled end-to-end by one.

## Demo

![The app: verdict card showing MCP calls and the cited verdict](https://raw.githubusercontent.com/Abhinav-Prabhakar/transfer-desk/main/shots/ui-answer.png)

Ask about Bilt → American and the board shows `initial_context` → `knowledge_base_read` → **NO, removed June 24 2024** — plus the note that archived guides still claim it works. Ask Citi → American and the same machinery says **YES, added July 2024**.

## Code

https://github.com/Abhinav-Prabhakar/transfer-desk

- `seed/seed.mjs` — the schema-as-data: every claim carries `ratio`, `status`, `asOf`, and a typed source, so "stale blog says X" is a queryable fact, not prose
- `app/agent.mjs` — MCP client + ReAct loop (~100 lines, no framework)
- `app/index.html` — the departure-board UI
- `docs/` — the GitHub Pages replay of recorded sessions

## My Build Process

The honest version, because that's what's judged here:

**What worked embarrassingly well.** Pointing a Knowledge Base at a dataset of *contradictory on-purpose* claims. I seeded both "Chase transfers to SkyPass 1:1 (2018 blog)" and "SkyPass is not a current partner (official list)" and the KB build kept both claims, dated and sourced — the agent surfaces them side by side instead of collapsing to one answer. That's the entire pitch of structured content, demonstrated in the worst-case domain for stale information.

**What didn't.** Everything about treating the dashboard as the only interface. The interesting discovery: the Context app is a frontend over real APIs — `POST /v2026-05-26/context/knowledge-bases` to create a KB, `POST .../imports {type:"dataset"|"crawl"}` to add sources, `POST .../build` to build entries, `POST /context/organizations/{org}/mcp` for endpoints, and a GROQ-able `.../store` + `.../query` where MCP configs are just `sanity.context.mcp` documents. Once I stopped clicking and started calling, the whole org-level setup became scriptable in one session.

**Schema choices that mattered.** `transferClaim` is a claim, not a rule — `status` ∈ `active|removed|added|inactive`, `asOf` date, typed `source`. That distinction is what lets the agent say "three sources disagree, here's each claim with its date" instead of hallucinating a single truth. `scenario` docs double as a regression suite for the demo questions.

**Where I reached past the obvious.** The demo page replays real recorded MCP sessions verbatim — the tool calls you see are the ones the agent actually made, not a mockup. And the agent's instructions live in the MCP config itself, so behavior tuning happens in the Context app without redeploying anything.

## Sanity Project Details

- **Project ID:** `tu8ddemy`
- **Dataset:** `production` (public) — https://tu8ddemy.api.sanity.io/v2025-02-19/data/query/production?query=*%5B%5D
- **Knowledge Base:** `kb7RVRWsQaU8` · **Context MCP:** `transfer-desk` (org `oug87v8uh`)

<!-- Thanks for participating! -->
