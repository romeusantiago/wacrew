---
lang: pt-BR
path: /servidor-mcp-whatsapp/
alternate: /en/whatsapp-mcp-server/
slug: servidor-mcp-whatsapp
title: Servidor MCP de WhatsApp para Claude Code, Codex e Cursor
seoTitle: "Servidor MCP de WhatsApp: código aberto, 36 ferramentas · WACrew"
description: Servidor MCP de WhatsApp de código aberto, com 36 ferramentas. Seu agente lê grupos e conversas, transcreve áudio e responde no ritmo de uma pessoa.
keyword: servidor mcp whatsapp
date: 2026-11-14
---

O WACrew tem um **servidor MCP de WhatsApp** de código aberto que liga a sua conta a qualquer cliente compatível com o Model Context Protocol: Claude Code, Claude Desktop, Codex, Cursor, Qwen Code e outros. O agente lê todos os grupos e conversas, busca no histórico, entende áudio, print e vídeo, e responde de um jeito que parece seu.

Ele está no npm como [`wacrew-mcp`](https://www.npmjs.com/package/wacrew-mcp) e no [registro oficial de MCP](https://registry.modelcontextprotocol.io) como `io.github.sumioshi/wacrew`. O código é Apache 2.0, no [GitHub](https://github.com/sumioshi/wacrew).

## O que o agente consegue fazer

São 36 ferramentas, separadas por função:

| Função | Ferramentas |
|---|---|
| Ler | `listar_grupos`, `ler_mensagens`, `buscar`, `resumo_do_dia`, `caixa_de_entrada`, `novidades` |
| Mídia | `transcrever` (áudio), `ver_imagem`, `ver_video`, `assistir_video`, `ler_documento` (PDF, docx, csv) |
| Pessoas | `listar_contatos`, com telefone e LID da mesma pessoa numa linha só |
| Escrever e enviar | `preparar_resposta`, `revisar_texto`, `responder`, `responder_midia`, `editar_mensagem`, `reagir` |
| Entrega | `status_envio`, `cancelar_envio` |
| Triagem e CRM | `marcar_resolvido`, `silenciar_grupo`, `anotar`, `etiquetar`, `definir_modo`, `definir_contrato`, `dashboard` e outras |
| Agenda | `agenda_ver`, `agenda_marcar`, `agenda_editar`, `agenda_apagar` (Google Agenda) |

## Instalar

O WACrew tem duas partes: o **coletor**, um servidor pequeno que fica conectado ao WhatsApp e guarda as mensagens, e o **servidor MCP**, que roda junto do seu agente. Suba o coletor numa VPS com Docker:

```bash
git clone https://github.com/sumioshi/wacrew && cd wacrew
PANEL_USER=admin PANEL_PASS=troque-esta-senha docker compose up -d --build
```

Abra `http://ip-do-servidor:3000/config` e leia o QR code pelo WhatsApp (Aparelhos conectados). Depois adicione o MCP no Claude Code:

```bash
claude mcp add wacrew \
  -e WAC_CLOUD_URL=https://seu-painel.exemplo.com \
  -e WAC_CLOUD_USER=admin \
  -e WAC_CLOUD_PASS=troque-esta-senha \
  -- npx -y wacrew-mcp
```

No Codex, no Cursor e no Claude Desktop é o mesmo `npx -y wacrew-mcp` com as três variáveis. Coloque HTTPS na frente do painel antes de abrir para a internet.

## Por que o coletor fica ligado 24 horas

O WhatsApp entrega cada mensagem uma vez, para os aparelhos que estão online. Se o seu computador está desligado, o que chegou nesse período não entra no histórico. Rodando num servidor, o coletor guarda toda mensagem, áudio e arquivo num volume persistente, e o MCP lê dali quando o agente precisa.

## Resposta que não parece robô

1. **A sua voz.** `preparar_resposta` devolve como você escreve naquela conversa: pontuação, aberturas e tamanho das mensagens, medidos no seu próprio histórico.
2. **Revisão em código.** Mais de 25 regras barram vício de robô antes do envio: dois-pontos de introdução, travessão, "bom dia" às 15h, abertura repetida, desculpa em excesso, balão igual ao anterior. Um modelo barato lê as últimas 60 mensagens e recusa respostas vazias como "entendi" sem dizer o quê.
3. **Entrega no ritmo de gente.** `responder` devolve um ticket e a mensagem sai depois, com visto, digitando e pausa. Numa conversa ativa, a mediana até começar a digitar fica em torno de 30 segundos. Se o cliente escrever de novo, ou você responder pelo celular, a entrega para sozinha.

Cada conversa tem um modo. **Confirmar** é o padrão: o agente mostra o texto e espera o seu OK. **Autônomo** é ligado conversa por conversa.

## Comparando as opções

| | WACrew | Ponte com o WhatsApp Web (ex.: lharries/whatsapp-mcp) | API oficial (Cloud API) |
|---|---|---|---|
| Conexão | Baileys, WhatsApp Web multidispositivo | whatsmeow (ponte em Go) e servidor MCP em Python | WhatsApp Business Platform da Meta |
| Número | O seu, como aparelho conectado | O seu, como aparelho conectado | Número cadastrado na plataforma Business |
| Onde roda | Servidor Docker com painel web, MCP pelo npm | Na sua máquina, histórico em SQLite | Na nuvem da Meta, via provedor |
| Envio | Por ticket, no ritmo humano, revisado antes | Envio direto | Regras de mensagem comercial e templates |
| Além do MCP | Fila por tempo de espera, CRM, equipe, agenda | Foco nas ferramentas MCP | Depende do provedor |

Para notificação em massa com suporte oficial, a API oficial é o caminho. Para o seu agente trabalhar as conversas que você já tem, com grupos, áudio e ritmo de gente, um servidor como o WACrew encaixa melhor.

## Limites

- **Cliente não oficial.** Conecta pelo Baileys, não pela API oficial. Serve para atender quem já fala com você; disparo em massa e abordagem fria podem bloquear o número.
- **Sem histórico anterior ao pareamento.** O coletor guarda o que chega depois que você lê o QR code.
- **Custos.** O código é grátis. Você paga o servidor e o provedor de IA que escolher, com a sua chave.
