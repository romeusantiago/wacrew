---
lang: en
path: /en/whatsapp-ai-agent/
alternate: /agente-de-ia-whatsapp/
slug: whatsapp-ai-agent
title: An open-source WhatsApp AI agent that answers like you
seoTitle: "WhatsApp AI Agent: open source, replies in your voice · WACrew"
description: A self-hosted WhatsApp AI agent that drafts replies in your own voice, reviews them for robot tells and delivers them at a human pace. You stay in control.
keyword: whatsapp ai agent
date: 2026-11-14
---

Most WhatsApp bots are easy to spot. They answer in two seconds, open every message the same way, apologise too much and never leave a question for later. Clients notice, and the relationship cools down. WACrew is an open-source **WhatsApp AI agent** built the other way around: it writes like you, it waits like a person, and nothing goes out until you allow it.

## How a reply is made

1. **The agent reads the chat.** Text, voice notes (transcribed), screenshots, videos and documents. Back-to-back messages from the same person are treated as one block, and a client's group and private chat are read together.
2. **It learns how you write there.** Before drafting, it gets the punctuation, openings and message length you actually use in that chat, measured on your own past messages, plus what the client left open.
3. **It drafts two or three versions.** The code keeps the one that sounds least like a template next to your recent messages.
4. **A review blocks robot tells.** More than 25 rules run in code before sending: colon-led intros, em dashes, a "good morning" at 3 p.m., the same opening twice, repeated apologies, a bubble identical to the last one. A second check reads the last 60 messages and refuses empty answers like "got it" when the client asked something specific.
5. **Delivery at a human pace.** Read receipt, typing indicator, pauses between bubbles. In a live chat the median until typing starts is around 30 seconds; in a cold chat it can be minutes or hours. If the client writes again before the first bubble, the delivery stops and the agent reads the new context.

## You stay in control

Each chat has a mode:

- **Confirm** (default): the agent shows you the exact text and waits for your OK.
- **Autonomous**: turned on chat by chat, for conversations where you trust it to answer alone.

If you answer from your phone, the agent steps back from that chat. If a client asks whether they are talking to a bot, the agent goes quiet and hands the chat to you. It never claims to be human, and it never promises deadlines, prices or access on your behalf.

## Where it runs

WACrew is self-hosted. A small collector stays connected to WhatsApp 24 hours a day on your server (Docker, any VPS or Railway), and a web panel shows the inbox, clients and settings. The AI runs through the provider you choose, with your own key, so you control cost and data.

You can also drive the same agent from a coding agent. The [WhatsApp MCP server](/en/whatsapp-mcp-server/) gives Claude Code, Codex or Cursor 36 tools to read, search and reply.

## Who it is for

- Agencies and software houses that serve clients in dozens of WhatsApp groups.
- Freelancers and consultants who answer clients alone and lose track of who is waiting.
- Developers who want their coding agent to handle client messages next to the code.

## What it is not

WACrew is not a bulk sender or a marketing bot. It connects as a linked device through Baileys, the unofficial WhatsApp Web client, and is meant for people who already talk to you. Cold outreach at volume is the fastest way to get a number banned.

## Questions

**Does the agent pretend to be me?** It writes in your style and in first person, because the number is yours. It never denies being an AI when asked; in that case it stops and calls you.

**Which AI models does it use?** The panel copilot works with Anthropic or any OpenAI-compatible API. Through MCP, the agent is whatever client you use, such as Claude Code or Codex.

**Is it free?** The code is free under Apache 2.0. You pay for your server and your AI provider.
