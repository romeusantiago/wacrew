---
lang: pt-BR
path: /agente-de-ia-whatsapp/
alternate: /en/whatsapp-ai-agent/
slug: agente-de-ia-whatsapp
title: Agente de IA para WhatsApp de código aberto, que responde como você
seoTitle: "Agente de IA para WhatsApp: código aberto, na sua voz · WACrew"
description: Agente de IA para WhatsApp que roda no seu servidor, escreve as respostas na sua voz, revisa antes de enviar e entrega no ritmo de uma pessoa. Você no controle.
keyword: agente de ia whatsapp
date: 2026-11-14
---

Robô de WhatsApp é fácil de reconhecer. Responde em dois segundos, abre toda mensagem igual, pede desculpa demais e nunca deixa nada para depois. O cliente percebe e a relação esfria. O WACrew é um **agente de IA para WhatsApp** de código aberto feito ao contrário: escreve como você, espera como uma pessoa e nada sai sem a sua permissão.

## Como sai uma resposta

1. **O agente lê a conversa.** Texto, áudio (transcrito), print, vídeo e documento. Mensagens seguidas da mesma pessoa viram um bloco, e o grupo e o privado do mesmo cliente são lidos juntos.
2. **Aprende como você escreve ali.** Antes de rascunhar, recebe a pontuação, as aberturas e o tamanho de mensagem que você usa naquela conversa, medidos no seu histórico, e o que o cliente deixou em aberto.
3. **Rascunha duas ou três versões.** O código escolhe a que menos destoa das suas últimas mensagens.
4. **Revisão barra vício de robô.** Mais de 25 regras rodam em código antes do envio: dois-pontos de introdução, travessão, "bom dia" às 15h, abertura repetida, desculpa em excesso, balão igual ao anterior. Uma segunda checagem lê as últimas 60 mensagens e recusa resposta vazia, como "entendi" sem dizer o quê.
5. **Entrega no ritmo de gente.** Visto, digitando e pausa entre balões. Se o cliente escrever antes do primeiro balão, a entrega para e o agente lê o contexto novo.

## Você no controle

- **Confirmar** (padrão): o agente mostra o texto exato e espera o seu OK.
- **Autônomo**: ligado conversa por conversa, onde você confia que ele responda sozinho.

Se você responde pelo celular, o agente sai daquela conversa. Se o cliente pergunta se está falando com um robô, o agente fica quieto e passa a conversa para você. Ele não diz que é humano e não promete prazo, valor ou acesso em seu nome.

## Onde roda

No seu servidor. Um coletor fica conectado ao WhatsApp 24 horas (Docker, qualquer VPS ou a Railway) e um painel web mostra a fila, os clientes e as configurações. A IA roda no provedor que você escolher, com a sua chave, então custo e dados ficam com você.

O mesmo agente também pode ser usado pelo seu agente de código: o [servidor MCP de WhatsApp](/servidor-mcp-whatsapp/) dá 36 ferramentas ao Claude Code, ao Codex e ao Cursor.

## Para quem é

- Agências e software houses que atendem clientes em dezenas de grupos de WhatsApp.
- Freelancers e consultores que atendem sozinhos e perdem a conta de quem está esperando.
- Devs que querem o agente de código cuidando das mensagens de cliente junto do código.

## O que não é

Não é disparador em massa nem robô de marketing. Conecta como aparelho conectado pelo Baileys, o cliente não oficial do WhatsApp Web, e foi feito para quem já fala com você. Abordagem fria em volume é o jeito mais rápido de ter o número bloqueado.
