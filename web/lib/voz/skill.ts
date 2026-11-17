// Monta o SKILL.md de voz a partir do que `medir.ts` mediu. A estrutura é a do molde
// `voz-do-operador`, com números e exemplos reais no lugar dos campos {{...}}.

import type { Exemplos, Perfil } from './medir';

const p = (n: number) => `${Math.round(n)}%`;
const bloco = (linhas: string[]) => (linhas.length ? '```\n' + linhas.join('\n') + '\n```' : '_(sem exemplo seguro no histórico)_');
const umaLinha = (t: string) => t.replace(/\s*\n\s*/g, ' / ');

export interface DadosSkill {
  nome: string;
  nomeOperador?: string;
  trabalho: Perfil | null;
  pessoal: Perfil | null;
  exemplos: Exemplos;
  rajadasPessoais: string[][];
  geradoEm: string;
  corte: string | null;
}

function tabelaPerfil(pf: Perfil): string {
  return [
    '| traço | média | faixa entre chats |',
    '|---|---|---|',
    `| mediana do balão | ${pf.mediana} caracteres | p75 = ${pf.p75}, p95 = ${pf.p95} |`,
    `| sem pontuação final | ${p(pf.semPontuacao)} | ${p(pf.faixa.semPontuacao.min)} – ${p(pf.faixa.semPontuacao.max)} |`,
    `| ponto final | ${p(pf.ponto)} | ${p(pf.faixa.ponto.min)} – ${p(pf.faixa.ponto.max)} |`,
    `| vírgula | ${p(pf.virgula)} | ${p(pf.faixa.virgula.min)} – ${p(pf.faixa.virgula.max)} |`,
    `| maiúscula inicial | ${p(pf.maiuscula)} | |`,
    `| tudo minúsculo | ${p(pf.minusculo)} | |`,
    `| emoji | ${p(pf.emoji)} | |`,
    `| risada | ${p(pf.riso)} | |`,
    `| multi-linha | ${p(pf.multilinha)} | |`,
    `| rajada média | ${pf.rajada.toFixed(2)} balões | |`,
  ].join('\n');
}

function tratamento(pf: Perfil): string {
  const t = pf.tratamento;
  const proibido =
    t.voce > 20 && t.tu + t.teu + t.ti <= Math.max(1, t.voce * 0.01)
      ? `\n\n**Proibido:** \`tu\`, \`teu\`, \`tua\`, \`ti\`, \`contigo\` (${t.tu + t.teu + t.ti} ocorrências contra ${t.voce} de \`vc\`/\`você\`). Tratamento é traço fixo: não espelhe o pronome do interlocutor.`
      : '';
  return `- \`vc\` / \`você\`: ${t.voce}   ·   \`seu\` / \`sua\`: ${t.seu}\n- \`tu\`: ${t.tu}   ·   \`teu\` / \`tua\`: ${t.teu}   ·   \`ti\`: ${t.ti}${proibido}`;
}

function naoAparece(trab: Perfil | null, pess: Perfil | null): string {
  if (!trab || !pess) return '_(precisa dos dois modos medidos para comparar)_';
  const noTrab = new Map(trab.marcadores);
  const so = pess.marcadores.filter(([m, c]) => c >= 3 && (noTrab.get(m) ?? 0) <= Math.max(0, Math.floor(c * 0.02)));
  if (!so.length) return '_(nenhum marcador do pessoal ficou de fora do trabalho)_';
  return so.map(([m, c]) => `\`${m}\` (${c}× no pessoal, ${noTrab.get(m) ?? 0}× no trabalho)`).join(' · ');
}

export function montarSkill(d: DadosSkill): string {
  const t = d.trabalho;
  const e = d.exemplos;
  const quem = d.nomeOperador ? `${d.nomeOperador}` : 'o operador';
  const descr = [
    `Como ${quem} escreve no WhatsApp, medido nas mensagens que ele mesmo digitou (${t?.msgs ?? 0} de trabalho${d.pessoal ? `, ${d.pessoal.msgs} pessoais` : ''}).`,
    'Carregue antes de qualquer mensagem para cliente, parceiro ou lead. O default é o modo PROFISSIONAL; o pessoal é só para amigo e família.',
    'Os números são faixas a mirar ao longo da conversa, não regra por balão.',
  ].join(' ');

  const partes: string[] = [];
  partes.push(`---\nname: ${d.nome}\ndescription: ${JSON.stringify(descr)}\n---\n`);
  partes.push(`# Voz de ${quem}

> Gerada pelo WACrew (\`gerar_voz\`) em ${d.geradoEm.slice(0, 10)}. Só entram mensagens digitadas pela
> pessoa: celular, painel do dono${d.corte ? ` e as do WhatsApp Web ou sem origem anteriores a ${d.corte.slice(0, 10)}` : ''}. O que a automação mandou fica de fora,
> para o perfil não aprender o próprio eco. Gere de novo quando o volume crescer.
>
> Os exemplos são reais e foram escolhidos por regra (sem link, e-mail ou número longo). Leia,
> corte o que não representa a pessoa e complete o que faltar: estatística dá as proporções,
> mas o ritmo só aparece lendo.

# COMO USAR

Os percentuais **não são regra por mensagem. São a média que a conversa inteira deve ter.**
Aplicar um número a cada balão produz uniformidade, e uniformidade é o que denuncia texto de
máquina, inclusive uniformidade "informal".
`);
  if (t) {
    partes.push(`O mesmo traço varia entre chats, e é assim que gente escreve:

| traço | chat mais solto | chat mais formal |
|---|---|---|
| balão com ponto final | ${p(t.faixa.ponto.min)} | ${p(t.faixa.ponto.max)} |
| vírgula | ${p(t.faixa.virgula.min)} | ${p(t.faixa.virgula.max)} |
`);
  }
  partes.push(`**Decida caso a caso, com três eixos:**

1. **Quem é o interlocutor.** Cliente novo ou institucional → mais formal. Parceiro de longa data → mais solto.
2. **A temperatura do assunto.** Status corriqueiro → solto. Dinheiro, prazo estourado, erro que custou caro → sobe o registro, mesmo num chat informal.
3. **Onde a conversa está.** Primeiro contato e proposta → mais cuidado. Meio da execução → mais solto.

**Espelhe o interlocutor** e **varie de propósito** dentro da mesma conversa.

---
`);

  if (t) {
    partes.push(`# MODO PROFISSIONAL — o default para cliente, parceiro e lead

## As faixas deste modo (${t.msgs} msgs, ${t.chats} chats)

${tabelaPerfil(t)}

## Abreviação — os DOIS lados contam

${t.pares.map(([a, ca, b, cb]) => `- \`${a}\` ${ca} × \`${b}\` ${cb}`).join('\n')}

## Tratamento

${tratamento(t)}

## NENHUM MARCADOR É OBRIGATÓRIO — o teto de frequência

**${t.aberturasDistintas} aberturas distintas, e a mais comum (\`${t.aberturaTopo.palavra}\`) é só ${t.aberturaTopo.pct.toFixed(1)}%.**
Se o mesmo marcador aparece em toda mensagem, está ${t.aberturaTopo.pct > 0 ? Math.round(100 / t.aberturaTopo.pct) : '?'}× acima do real.

1. Olhe o que já foi mandado neste chat. Marcador repetido da mensagem anterior sai.
2. **A maioria das mensagens no meio de uma conversa não precisa de abertura nenhuma.**
3. Cumprimento se justifica por tempo decorrido, não por educação.
4. Na dúvida entre repetir e cortar, corte.

## Aberturas — primeiro contato × continuação

(primeiro contato = primeira mensagem do chat ou depois de 6 h de silêncio)

| abertura | 1º contato | continuação |
|---|---|---|
${t.aberturas.map((a) => `| ${a.forma} | ${p(a.primeiro)} | ${p(a.continuacao)} |`).join('\n') || '| (nenhuma forma passou de 1%) | | |'}

Exemplos reais de primeiro contato:
${bloco(e.primeiroContato.map(umaLinha))}

Exemplos reais de continuação:
${bloco(e.continuacao.map(umaLinha))}

## Como esta pessoa explica / discorda / pede

**Explica:**
${bloco(e.explica.map(umaLinha))}

**Discorda:**
${bloco(e.discorda.map(umaLinha))}

**Pede alguma coisa:**
${bloco(e.pede.map(umaLinha))}

**Assunto grave** (aqui o registro quase sempre sobe):
${bloco(e.grave.map(umaLinha))}

## Emoji: paleta fechada

Paleta: ${t.emojis.map(([em, c]) => `${em}×${c}`).join(' ') || '(nenhum)'} — frequência ${p(t.emoji)}. Fora dessa paleta entrega na hora.

## Risada, exatamente como é escrita

${t.risadas.map(([r, c]) => `\`${r}\` ×${c}`).join(' · ') || '(nenhuma no trabalho)'}

## O que NÃO aparece no registro profissional

${naoAparece(t, d.pessoal)}

## O que é cara de IA (vale para qualquer pessoa)

\`fico à disposição\` · \`crucial\` · \`fundamental\` · \`essencial\` como muleta · \`aprimorar\` · \`otimizar\` · \`robusto\` · \`vale ressaltar\` · \`espero que esteja bem\` · tríade de três adjetivos · travessão · aforismo de fecho que serviria para qualquer cliente.

---
`);
  }

  if (d.pessoal) {
    const ps = d.pessoal;
    partes.push(`# MODO PESSOAL — só amigo e família, nunca em atendimento

| traço | valor |
|---|---|
| rajada média | ${ps.rajada.toFixed(2)} balões |
| mediana do balão | ${ps.mediana} caracteres |
| sem pontuação final | ${p(ps.semPontuacao)} |
| vírgula | ${p(ps.virgula)} |
| emoji | ${p(ps.emoji)} |

Marcadores próprios: ${ps.marcadores.map(([m, c]) => `\`${m}\` ${c}`).join(' · ') || '(nenhum dos conhecidos)'}

${d.rajadasPessoais.map((r) => bloco(r.map(umaLinha))).join('\n\n') || '_(sem rajada segura para mostrar)_'}

---
`);
  }

  partes.push(`# CAMADA DE VENDA (quando ligar)

**Persuasão só entra quando o cliente não está com dor.** LIGA em proposta, entrega concluída, elogio espontâneo, renovação, objeção de preço, pedido fora de escopo. DESLIGA com sistema fora do ar, cliente irritado, erro nosso, dúvida técnica simples, assunto grave.

Como esta pessoa já negocia:
${bloco(e.negocia.map(umaLinha))}

---

# Gate final

1. Usei o pronome de tratamento certo?
2. É atendimento? Modo profissional.
3. Escolhi a calibragem pelo interlocutor e pelo peso do assunto, em vez da média cega?
4. Repeti algum marcador da mensagem anterior deste chat?
5. Vazou termo do modo pessoal?
6. Terminei todos os balões com ponto final? Compare com a faixa medida.
7. É momento de vender?
8. Soa como qualquer atendente educado? Então ainda não é a voz de ninguém.

# Relação com outras skills

Ordem fixa ao redigir para o WhatsApp: **\`preparar_resposta\` → esta skill → \`comunicacao-cliente\` → \`responder\`**. Esta skill define a forma; \`comunicacao-cliente\` define a conduta. O contável é código: o \`responder\` recusa tratamento errado, confissão de culpa, dois-pontos de introdução, travessão, repetição e saudação reflexa.
`);
  return partes.join('\n');
}
