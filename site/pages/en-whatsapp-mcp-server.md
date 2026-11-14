---
lang: en
path: /en/whatsapp-mcp-server/
alternate: /servidor-mcp-whatsapp/
slug: whatsapp-mcp-server
title: WhatsApp MCP server for Claude Code, Codex and Cursor
seoTitle: "WhatsApp MCP Server: open source, 36 tools · WACrew"
description: An open-source WhatsApp MCP server with 36 tools. Your AI agent reads groups and chats, transcribes voice notes and replies at a human pace.
keyword: whatsapp mcp server
date: 2026-11-14
---

WACrew ships an open-source **WhatsApp MCP server** that connects your WhatsApp account to any client that speaks the Model Context Protocol: Claude Code, Claude Desktop, Codex, Cursor, Qwen Code and others. Your agent can read every group and direct chat, search the history, understand voice notes, screenshots and videos, and send replies that read like you wrote them.

It is published on npm as [`wacrew-mcp`](https://www.npmjs.com/package/wacrew-mcp) and listed in the [official MCP Registry](https://registry.modelcontextprotocol.io) as `io.github.sumioshi/wacrew`. The code is Apache 2.0 on [GitHub](https://github.com/sumioshi/wacrew).

## What the agent can do

The server exposes 36 tools, grouped by job:

| Job | Tools |
|---|---|
| Read | `listar_grupos`, `ler_mensagens`, `buscar`, `resumo_do_dia`, `caixa_de_entrada`, `novidades` |
| Media | `transcrever` (voice notes), `ver_imagem`, `ver_video`, `assistir_video`, `ler_documento` (PDF, docx, csv) |
| People | `listar_contatos`, with phone and LID of the same person merged |
| Write and send | `preparar_resposta`, `revisar_texto`, `responder`, `responder_midia`, `editar_mensagem`, `reagir` |
| Delivery | `status_envio`, `cancelar_envio` |
| Triage and CRM | `marcar_resolvido`, `silenciar_grupo`, `anotar`, `etiquetar`, `definir_modo`, `definir_contrato`, `dashboard` and more |
| Calendar | `agenda_ver`, `agenda_marcar`, `agenda_editar`, `agenda_apagar` (Google Calendar) |

Tool names are in Portuguese because the project started in Brazil. Every description tells the agent when to use the tool and when to pick a different one, so English prompts work fine.

## Install in one command

WACrew has two parts: the **collector**, a small server that stays connected to WhatsApp and stores your messages, and the **MCP server**, which your coding agent runs. Start the collector on a VPS with Docker:

```bash
git clone https://github.com/sumioshi/wacrew && cd wacrew
PANEL_USER=admin PANEL_PASS=change-me docker compose up -d --build
```

Open `http://<server-ip>:3000/config` and scan the QR code with WhatsApp (Linked devices). Then add the MCP server to Claude Code:

```bash
claude mcp add wacrew \
  -e WAC_CLOUD_URL=https://your-panel.example.com \
  -e WAC_CLOUD_USER=admin \
  -e WAC_CLOUD_PASS=change-me \
  -- npx -y wacrew-mcp
```

Codex, Cursor and Claude Desktop take the same `npx -y wacrew-mcp` command with the three environment variables. Put HTTPS in front of the panel before you expose it.

## Why the collector runs 24 hours

WhatsApp only delivers a message once, to the devices that are online. If your laptop is closed, nothing from that period reaches your history. The collector runs on a server so every message, voice note and file lands in a persistent volume, and the MCP server reads from it on demand.

## Replies that do not read like a bot

Sending is where most WhatsApp automations give themselves away. WACrew adds three layers between the agent and the chat:

1. **Your voice.** `preparar_resposta` returns how you write in that chat: punctuation, openings, message length, measured on your own past messages.
2. **A review in code.** Before anything leaves, more than 25 rules block robot tells: colon-led intros, em dashes, a greeting at the wrong time of day, repeated apologies, the same opening twice, a bubble identical to the last one. A cheap model also reads the last 60 messages to catch answers like "got it" that never say what was understood.
3. **Human-paced delivery.** `responder` returns a ticket. The message goes out later with a read receipt, typing indicator and pauses. In a live chat the median until typing starts is around 30 seconds; in a cold chat it can be minutes or hours. If the client writes again, or you answer from your phone, the delivery stops by itself.

Every chat has a mode. **Confirm** is the default: the agent shows you the text and waits for your OK. **Autonomous** is turned on per chat.

## How it compares

There are a few ways to connect WhatsApp to an AI agent. They solve different problems:

| | WACrew | WhatsApp Web bridge (e.g. lharries/whatsapp-mcp) | Official Cloud API servers |
|---|---|---|---|
| Connection | Baileys, WhatsApp Web multi-device | whatsmeow (Go bridge) plus a Python MCP server | Meta's WhatsApp Business Platform |
| Account | Your existing number, as a linked device | Your existing number, as a linked device | A number registered on the Business Platform |
| Where it runs | Docker server with a web panel, MCP via npm | Locally, history in SQLite | Meta's cloud, through a provider |
| Sending | Ticketed, human-paced, reviewed before sending | Direct send | Business messaging rules and templates |
| Beyond MCP | Inbox sorted by wait time, CRM, team access, calendar | Focused on the MCP tools | Depends on the provider |

If you need official support and bulk notifications, use the Cloud API. If you want your agent to work the conversations you already have, with groups, voice notes and a human pace, a linked-device server like WACrew fits better.

## Limits worth knowing

- **Unofficial client.** WACrew connects through Baileys, not the official API. It is meant for people who already talk to you. Bulk sending and cold outreach can get a number banned.
- **No history before pairing.** The collector keeps what arrives after you scan the QR code.
- **Costs.** The code is free. You pay for the server and for the AI provider you choose, with your own key.

## Questions

**Does it work with Claude Desktop?** Yes. Any MCP client that can start a stdio server with `npx` works.

**Can it read groups?** Yes. Groups and direct chats are both first-class, and a client's group and private chat show up together in the inbox.

**Can the agent send without my approval?** Only in chats you switch to autonomous mode. In confirm mode, the default, it must show you the text first.

**Is there a hosted version?** No. WACrew is self-hosted so your messages stay on your own server.
