---
name: plantao
description: Use quando o operador pedir para ficar de olho, monitorar ou avisar quando chegar mensagem em um chat de WhatsApp. Resolve o chat, garante a captura e usa o mecanismo de monitoramento persistente disponível no runtime.
---

# Plantão de mensagens WhatsApp (adaptador de runtime)

Leia completamente a skill canônica antes de agir:

`<raiz-do-repo>/.claude/skills/plantao/SKILL.md` (a partir desta pasta: `../../../.claude/skills/plantao/SKILL.md`)

Preserve dela:

- a descoberta e confirmação do chat;
- a resolução do slug;
- a verificação de `watch` para grupos;
- a remoção de monitores duplicados;
- o filtro de mensagens `fromMe`;
- a regra de nunca responder automaticamente.

## Adaptação de runtime

As ferramentas `Monitor`, `TaskList` e `TaskStop` citadas na skill canônica são específicas do
Claude Code. O equivalente muda por runtime:

| Runtime | Armar | Inspecionar | Encerrar |
|---|---|---|---|
| Claude Code | `Monitor(timeout_ms: 1800000, command: …)`, rearmar quando expirar | `TaskList` | `TaskStop` |
| Qwen Code | `monitor(command: …, idle_timeout_ms: 600000, max_events: 10000)` | `list_agents` | `task_stop` |
| Antigravity, Codex e outros que só acordam quando a tarefa termina | comando em segundo plano com `--uma-vez` (abaixo) | a tarefa em segundo plano | encerrar a tarefa |

O comando vigiado é o mesmo (com `--uma-vez` nos runtimes da última linha):

```bash
<raiz-do-repo>/scripts/plantao-stream.sh <slug>
```

Instalado como plugin, `<raiz-do-repo>` é a pasta do plugin (no Antigravity,
`~/.gemini/config/plugins/wacrew`).

### Runtimes que acordam só quando a tarefa termina (`--uma-vez`)

No Antigravity e no Codex, uma tarefa em segundo plano acorda o agente quando SAI, não a cada
linha. O script tem um modo para isso:

```bash
<raiz-do-repo>/scripts/plantao-stream.sh --uma-vez <slug> [<slug2> ...]
```

Ele espera o primeiro evento, imprime a linha (mesmo formato do plantão normal) e sai com 0.
O ciclo é:

1. Rode o comando acima em segundo plano.
2. Quando ele terminar, leia a linha que saiu e trate pela skill (`ler_mensagens` se precisar de
   contexto; no autônomo, a tabela da skill `autonomo`).
3. Rode o mesmo comando de novo, na hora. Ele retoma de onde parou: o que chegou enquanto você
   tratava o evento sai na próxima execução, sem buraco.

Saída com código 3 = já existe plantão desse conjunto nesta máquina; não arme outro. O cursor só
vale por 60 min (`PLANTAO_CURSOR_MAX_MIN`): plantão parado há mais tempo recomeça em "agora".

**Credenciais:** fora do repositório não há o arquivo de variáveis da raiz. O script lê então
`~/.wacrew/env` (ou o arquivo em `WAC_ENV_FILE`), no mesmo formato: `WAC_CLOUD_URL`,
`WAC_CLOUD_USER`, `WAC_CLOUD_PASS` e, para o coletor pessoal (`PLANTAO_CLOUD=pessoal`),
`WAC_PESSOAL_URL`, `WAC_PESSOAL_USER`, `WAC_PESSOAL_PASS`. Se o script sair com
"WAC_CLOUD_URL não configurado", peça ao operador para criar esse arquivo (com permissão só
dele); não copie senha para dentro de nenhum outro lugar.

**Limite do Qwen Code (importante):** o `monitor` para sozinho após `idle_timeout_ms` sem saída
(teto 600000 ms = 10 min) ou `max_events` eventos. Chat quieto derruba o plantão — então, pra
vigília longa, prefira `/loop` ou `cron_create` chamando `novidades` em intervalo, e diga ao
operador qual dos dois você armou. Nunca declare plantão armado com o `monitor` prometendo horas.

Antes de armar, encerre o monitor anterior do mesmo chat (zumbi duplica resposta). Se o runtime não
oferecer monitoramento persistente capaz de despertar o agente, não declare que o plantão foi
armado: explique a limitação e ofereça `novidades` sob demanda ou `alertar_chat` (notificação no Mac).

Nunca substitua o plantão por um loop bloqueante improvisado nem envie mensagens ao chat.
