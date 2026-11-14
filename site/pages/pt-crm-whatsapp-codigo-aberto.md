---
lang: pt-BR
path: /crm-whatsapp-codigo-aberto/
alternate: /en/open-source-whatsapp-crm/
slug: crm-whatsapp-codigo-aberto
title: CRM de WhatsApp de código aberto para quem atende clientes em grupos
seoTitle: "CRM de WhatsApp de código aberto, no seu servidor · WACrew"
description: CRM de WhatsApp de código aberto e auto-hospedado. Fila por tempo de espera, clientes com contrato e entregas, equipe com acesso por conversa e IA que rascunha respostas.
keyword: crm whatsapp código aberto
date: 2026-11-14
---

Quem entrega trabalho pelo WhatsApp tem a carteira de clientes dentro da lista de conversas. Quarenta grupos, centenas de conversas individuais, áudio no meio da conversa e o cliente que escreveu há três dias e ninguém viu. O WACrew é um **CRM de WhatsApp** de código aberto que transforma essas conversas numa fila e numa base de clientes, no seu servidor, com licença Apache 2.0.

## Uma fila por tempo de espera

Todo grupo e conversa individual entra numa fila só, ordenada por quem espera há mais tempo. O grupo e o privado do mesmo cliente aparecem juntos, mensagens seguidas viram um bloco e o áudio chega transcrito. A conversa sai da fila quando alguém da sua conta responde, quando você marca como resolvida ou quando silencia. Se o cliente escrever de novo depois do "resolvido", ela volta.

## Clientes, não só conversas

- **Ficha do cliente** com o projeto, as conversas ligadas e notas livres.
- **Contrato** com situação e limite de mensagens opcional: o painel avisa quem está usando muito além do que paga.
- **Entregas** registradas por cliente, que alimentam o contador do painel.
- **Etiquetas** para filtrar por equipe, produto ou prioridade.
- **Painel** com tempo de resposta, horários de pico e quem respondeu cada mensagem: você, a equipe ou a IA.

## Equipe no mesmo número

Crie logins para a equipe no painel e escolha quais conversas cada pessoa vê. O resto não existe para ela: sem QR code, sem notas, sem contratos. O envio sai pelo mesmo número, passa pela mesma revisão e fica registrado com o nome de quem mandou.

## IA que rascunha, você decide

O assistente lê a conversa e rascunha a resposta na sua voz. No padrão, nada sai sem o seu OK; dá para ligar o modo autônomo conversa por conversa. A entrega sai no ritmo de gente, com visto, digitando e pausa. Mais detalhes em [agente de IA para WhatsApp](/agente-de-ia-whatsapp/).

## Também no painel

- **Google Agenda** dentro do painel, para ver e marcar reunião sem sair da fila.
- **Escritório 2D em pixel art** ao vivo, em que cada projeto é uma mesa que fica vermelha quando uma mensagem espera demais.
- **API REST e servidor MCP** para outras ferramentas e agentes de código lerem e responderem. Veja o [servidor MCP de WhatsApp](/servidor-mcp-whatsapp/).

## No seu servidor, de propósito

Conversa de cliente é sensível, então o WACrew não roda como serviço compartilhado. Você sobe com Docker em qualquer VPS, guarda a sessão do WhatsApp e as mensagens no seu volume e protege o painel com login. O código é grátis; você paga o servidor e, se usar a IA, o provedor.

```bash
git clone https://github.com/sumioshi/wacrew && cd wacrew
PANEL_USER=admin PANEL_PASS=troque-esta-senha docker compose up -d
```

## Bom saber

O WACrew usa o Baileys, cliente não oficial do WhatsApp Web, e conecta como aparelho conectado no seu número. Foi feito para clientes que já falam com você, não para campanha em massa. Não importa o histórico anterior ao pareamento.
