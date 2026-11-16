// Várias contas de WhatsApp (vários painéis) num servidor MCP só.
//
// A conta padrão é o trio WAC_CLOUD_URL / WAC_CLOUD_USER / WAC_CLOUD_PASS. As outras
// entram de dois jeitos, que podem ser combinados:
//   - na própria WAC_CLOUD_URL, depois do endereço principal, separadas por espaço ou
//     vírgula: "https://painel.exemplo.com pessoal=https://login:senha@outro.exemplo.com";
//   - em WAC_CONTAS, no mesmo formato "nome=https://login:senha@endereço", ou em JSON:
//     {"pessoal": {"url": "...", "user": "...", "pass": "..."}}.
// O primeiro formato existe porque a tela de plugins do Antigravity só tem os três
// campos do painel: quem tem mais de um WhatsApp acrescenta os outros no campo do endereço.
//
// Cada chamada de ferramenta roda dentro de `comConta`, e o acesso à nuvem (`cloud.ts`)
// lê a conta ativa daqui. Fora de uma chamada, vale a padrão.

import { AsyncLocalStorage } from 'node:async_hooks';

export interface Conta {
  nome: string;
  url: string;
  user?: string;
  pass?: string;
}

const NOME_PADRAO = 'principal';

/** Valor que não configura nada: vazio, marcador sem substituir ("${X}") ou "nenhuma". */
function vazio(v: string | undefined): boolean {
  const t = (v ?? '').trim();
  return !t || /^\$\{[^}]*\}$/.test(t) || /^(-|none|nenhuma|nenhum)$/i.test(t);
}

function semBarraFinal(url: string): string {
  return url.replace(/\/+$/, '');
}

function nomeValido(nome: string): string {
  const n = nome.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(n)) {
    throw new Error(`nome de conta inválido: "${nome}" (use letras, números, - ou _)`);
  }
  return n;
}

/** "nome=https://login:senha@host" -> Conta. Sem "nome=", usa `nomeSeFaltar`. */
function contaDoToken(token: string, nomeSeFaltar?: string): Conta {
  const m = /^([^=\s]+)=(.+)$/.exec(token);
  const nome = m ? m[1] : nomeSeFaltar;
  const bruto = m ? m[2] : token;
  if (!nome) throw new Error(`conta sem nome: "${token}" (use nome=https://login:senha@endereço)`);
  let u: URL;
  try {
    u = new URL(bruto);
  } catch {
    throw new Error(`endereço inválido na conta "${nome}"`);
  }
  const user = u.username ? decodeURIComponent(u.username) : undefined;
  const pass = u.password ? decodeURIComponent(u.password) : undefined;
  u.username = '';
  u.password = '';
  return { nome: nomeValido(nome), url: semBarraFinal(u.toString()), user, pass };
}

function tokens(texto: string): string[] {
  return texto.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
}

function contasDoJson(texto: string): Conta[] {
  const dado = JSON.parse(texto) as unknown;
  const lista: Array<Record<string, unknown>> = Array.isArray(dado)
    ? (dado as Array<Record<string, unknown>>)
    : Object.entries(dado as Record<string, Record<string, unknown>>).map(([nome, c]) => ({ nome, ...c }));
  return lista.map((c) => {
    if (typeof c.nome !== 'string' || typeof c.url !== 'string') {
      throw new Error('WAC_CONTAS em JSON precisa de "nome" e "url" em cada conta');
    }
    return {
      nome: nomeValido(c.nome),
      url: semBarraFinal(c.url),
      user: typeof c.user === 'string' ? c.user : undefined,
      pass: typeof c.pass === 'string' ? c.pass : undefined,
    };
  });
}

/** Lê as contas das variáveis de ambiente. A primeira da lista é a padrão. */
export function lerContas(env: Record<string, string | undefined> = process.env): Conta[] {
  const contas: Conta[] = [];
  const nomePadrao = vazio(env.WAC_CONTA_NOME) ? NOME_PADRAO : (env.WAC_CONTA_NOME as string);

  if (!vazio(env.WAC_CLOUD_URL)) {
    const [principal, ...extras] = tokens(env.WAC_CLOUD_URL as string);
    const p = contaDoToken(principal, nomePadrao);
    contas.push({
      ...p,
      user: p.user ?? (vazio(env.WAC_CLOUD_USER) ? undefined : env.WAC_CLOUD_USER),
      pass: p.pass ?? (vazio(env.WAC_CLOUD_PASS) ? undefined : env.WAC_CLOUD_PASS),
    });
    for (const t of extras) contas.push(contaDoToken(t));
  }

  if (!vazio(env.WAC_CONTAS)) {
    const texto = (env.WAC_CONTAS as string).trim();
    const extras = /^[[{]/.test(texto) ? contasDoJson(texto) : tokens(texto).map((t) => contaDoToken(t));
    contas.push(...extras);
  }

  const vistos = new Set<string>();
  for (const c of contas) {
    if (vistos.has(c.nome)) throw new Error(`conta repetida: "${c.nome}"`);
    vistos.add(c.nome);
  }
  return contas;
}

let memo: { chave: string; contas: Conta[] } | null = null;

/** Contas configuradas agora (relê se as variáveis mudarem). Erro de formato vira lista vazia
 *  aqui; quem quiser a mensagem chama `lerContas` direto. */
export function contas(): Conta[] {
  const e = process.env;
  const chave = [e.WAC_CLOUD_URL, e.WAC_CLOUD_USER, e.WAC_CLOUD_PASS, e.WAC_CONTAS, e.WAC_CONTA_NOME].join('\u0000');
  if (memo?.chave !== chave) {
    let lista: Conta[] = [];
    try {
      lista = lerContas(e);
    } catch {
      lista = [];
    }
    memo = { chave, contas: lista };
  }
  return memo.contas;
}

const ativa = new AsyncLocalStorage<Conta>();

/** Conta da chamada em andamento; fora de uma chamada, a padrão. */
export function contaAtiva(): Conta | undefined {
  return ativa.getStore() ?? contas()[0];
}

/** Roda `fn` com a conta `nome` ativa (sem nome, a padrão). Nome desconhecido lança. */
export function comConta<T>(nome: string | undefined, fn: () => T): T {
  const lista = contas();
  const conta = nome ? lista.find((c) => c.nome === nome.trim().toLowerCase()) : lista[0];
  if (!conta) {
    const nomes = lista.map((c) => c.nome).join(', ') || 'nenhuma';
    throw new Error(`conta "${nome}" não existe (configuradas: ${nomes})`);
  }
  return ativa.run(conta, fn);
}
