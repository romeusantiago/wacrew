---
lang: en
path: /en/open-source-whatsapp-crm/
alternate: /crm-whatsapp-codigo-aberto/
slug: open-source-whatsapp-crm
title: An open-source WhatsApp CRM for teams that serve clients in groups
seoTitle: "Open-source WhatsApp CRM, self-hosted · WACrew"
description: A self-hosted, open-source WhatsApp CRM. One inbox sorted by who has waited longest, clients with contracts and deliveries, team access per chat and an AI that drafts replies.
keyword: open source whatsapp crm
date: 2026-11-14
---

If you deliver work over WhatsApp, the client list lives in your chat list. Forty groups, a few hundred direct chats, voice notes in the middle of threads, and the client who wrote three days ago that nobody saw. WACrew is an open-source **WhatsApp CRM** that turns those chats into an inbox and a client base, on your own server, with the Apache 2.0 license.

## One inbox sorted by waiting time

Every group and direct chat lands in a single queue, ordered by who has waited longest. A client's group and their private chats appear together, back-to-back messages collapse into one block, and voice notes arrive transcribed. A chat leaves the queue when someone from your account answers, when you mark it resolved, or when you mute it. If the client writes again after you marked it resolved, it comes back.

## Clients, not just conversations

- **Client records** with the project, the linked chats and free notes.
- **Contracts** with status and an optional message limit, so the dashboard flags clients who are using far more than they pay for.
- **Deliveries** logged per client, which feed the delivery counter on the dashboard.
- **Tags** to filter by team, product or priority.
- **Dashboard** with response times, busiest hours and who answered each message: you, your team or the AI.

## A team on the same number

Create logins for your team in the panel and choose which chats each person can see. Everything else does not exist for them: no QR code, no notes, no contracts. Their replies go out from the same number, pass through the same review, and are recorded with their name, so you always know who said what.

## An AI that drafts, you decide

The built-in assistant reads the chat and drafts a reply in your own voice. By default nothing is sent without your OK; you can switch a chat to autonomous mode when you trust it. Delivery happens at a human pace, with read receipt, typing and pauses. More on how it avoids sounding like a bot on the [WhatsApp AI agent](/en/whatsapp-ai-agent/) page.

## Also in the panel

- **Google Calendar** inside the panel, to check and book meetings without leaving the inbox.
- **A live 2D pixel-art office** where each client project is a desk that turns red when a message waits too long.
- **A REST API and an MCP server** so other tools and coding agents can read and reply. See the [WhatsApp MCP server](/en/whatsapp-mcp-server/).

## Self-hosted by design

Your client conversations are sensitive, so WACrew does not run as a shared cloud service. You run it with Docker on any VPS, keep the WhatsApp session and every message in your own volume, and protect the panel with a login. The code is free; you pay for the server and, if you use the AI, for your provider.

```bash
git clone https://github.com/sumioshi/wacrew && cd wacrew
PANEL_USER=admin PANEL_PASS=change-me docker compose up -d
```

## Good to know

WACrew uses Baileys, the unofficial WhatsApp Web client, and connects as a linked device on your existing number. It is built for clients who already talk to you, not for bulk campaigns. It does not import history from before you paired the number.
