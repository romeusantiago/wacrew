// Mede como o operador escreve, a partir das mensagens que ele mesmo digitou.
// Tradução do `extrair-voz.py` (molde voz-do-operador), com duas diferenças: separa
// sozinho o que foi digitado pela pessoa do que a automação mandou (campo `origem`),
// e escolhe exemplos reais para cada situação da skill.

export interface MsgVoz {
  ts: string;
  t: string;
}

export interface RegistroVoz {
  timestamp: string;
  fromMe?: boolean;
  text?: string | null;
  origem?: string;
  ator?: string;
  usuario?: string;
}

export interface FiltroHumano {
  /** Só mensagens anteriores a esta data contam quando não têm `origem` (ISO). */
  antes?: string;
  /** Login do dono no painel: o envio dele pelo painel também é dele. */
  donoPainel?: string;
}

export const EMOJI = /[\u{1F300}-\u{1FAFF}☀-➿]/gu;
export const RISO = /k{2,}|(?:ha){2,}|rs+/gi;
const GIRIA =
  /\b(mano|cara|po|vlw|tmj|bora|top|massa|show|blz|beleza|opa|eita|vish|pqp|mds|slk|foda|caraca|nossa|uai|oxe|pera)\b/i;
const TRABALHO =
  /\b(projeto|cliente|deploy|prazo|orçamento|proposta|contrato|entrega|sistema|plataforma|pagamento|reunião|fatura)\b/i;
const MARCADORES_PESSOAIS = [
  'mano', 'vei', 'véi', 'slk', 'mds', 'pqp', 'caralho', 'porra', 'oxe', 'uai', 'oloco', 'carai',
  'foda', 'caraca', 'eita', 'vish', 'tmj', 'bora', 'pera', 'mlk', 'kkkk',
];

/**
 * Mensagem digitada pela pessoa (e não pela automação). `celular` é sempre dela;
 * `coletor` e `ia_meta` nunca. `web` e sem `origem` só valem antes do primeiro envio
 * automático: outro aparelho conectado na mesma conta (um segundo coletor, uma
 * ferramenta de automação) aparece para o WhatsApp como "web", e numa conta real o
 * que entrou como `web` depois da automação tinha o dobro do tamanho e da vírgula do
 * que a pessoa escreve no celular.
 */
export function digitadaPelaPessoa(r: RegistroVoz, corte: string | null, filtro: FiltroHumano = {}): boolean {
  if (!r.fromMe) return false;
  if (r.ator === 'painel') return !!filtro.donoPainel && r.usuario === filtro.donoPainel;
  if (r.origem === 'celular') return true;
  if (r.origem && r.origem !== 'web') return false;
  return corte === null || r.timestamp < corte;
}

/** Primeiro envio da automação: daí em diante, `fromMe` sem `origem` é suspeito. */
export function corteAutomatico(registros: RegistroVoz[], filtro: FiltroHumano = {}): string | null {
  let primeiro: string | null = null;
  for (const r of registros) {
    if (r.fromMe && r.origem === 'coletor' && r.ator !== 'painel' && (!primeiro || r.timestamp < primeiro)) {
      primeiro = r.timestamp;
    }
  }
  if (filtro.antes && (!primeiro || filtro.antes < primeiro)) return filtro.antes;
  return primeiro;
}

export function mensagensHumanas(registros: RegistroVoz[], corte: string | null, filtro: FiltroHumano = {}): MsgVoz[] {
  return registros
    .filter((r) => digitadaPelaPessoa(r, corte, filtro))
    .map((r) => ({ ts: r.timestamp, t: (r.text ?? '').trim() }))
    .filter((m) => m.t)
    .sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
}

function pct(textos: string[], teste: (t: string) => boolean): number {
  if (!textos.length) return 0;
  return (textos.filter(teste).length / textos.length) * 100;
}

const temRiso = (t: string) => new RegExp(RISO.source, 'i').test(t);
const temEmoji = (t: string) => new RegExp(EMOJI.source, 'u').test(t);

/**
 * Score alto = informal (risada, gíria, balão curto). Baixo = registro de trabalho.
 * A vírgula pesa contra: com cliente a frase sai inteira, com amigo sai em pedaços. Calibrado
 * num corpus real separado à mão (56 chats): acerta 51, e 97% das mensagens caem no modo certo.
 */
export function scoreRegistro(textos: string[]): number {
  const n = textos.length || 1;
  const riso = textos.filter(temRiso).length / n;
  const giria = textos.filter((t) => GIRIA.test(t)).length / n;
  const trab = textos.filter((t) => TRABALHO.test(t)).length / n;
  const curta = textos.filter((t) => t.length < 20).length / n;
  const virg = textos.filter((t) => t.includes(',')).length / n;
  return Math.round((riso * 3 + giria * 1.5 + curta * 1.5 - trab * 4 - virg * 3) * 100) / 100;
}

export interface LinhaTriagem {
  slug: string;
  score: number;
  msgs: number;
  modo: 'pessoal' | 'trabalho';
}

/** Separa os chats em trabalho e pessoal pelo score; `forcar` vence o score. */
export function triagem(
  porChat: Record<string, MsgVoz[]>,
  opts: { minimo?: number; limiar?: number; trabalho?: string[]; pessoal?: string[] } = {},
): LinhaTriagem[] {
  const minimo = opts.minimo ?? 25;
  const limiar = opts.limiar ?? 0.45;
  const linhas: LinhaTriagem[] = [];
  for (const [slug, msgs] of Object.entries(porChat)) {
    if (msgs.length < minimo) continue;
    const score = scoreRegistro(msgs.map((m) => m.t));
    let modo: LinhaTriagem['modo'] = score >= limiar ? 'pessoal' : 'trabalho';
    if (opts.trabalho?.includes(slug)) modo = 'trabalho';
    if (opts.pessoal?.includes(slug)) modo = 'pessoal';
    linhas.push({ slug, score, msgs: msgs.length, modo });
  }
  return linhas.sort((a, b) => b.score - a.score);
}

function quantil(ordenado: number[], q: number): number {
  if (!ordenado.length) return 0;
  return ordenado[Math.min(ordenado.length - 1, Math.floor(q * ordenado.length))];
}

function rajadas(porChat: Record<string, MsgVoz[]>, gapS = 90): number {
  let total = 0;
  let baloes = 0;
  for (const msgs of Object.values(porChat)) {
    if (!msgs.length) continue;
    total += 1;
    baloes += msgs.length;
    for (let i = 1; i < msgs.length; i++) {
      const gap = (Date.parse(msgs[i].ts) - Date.parse(msgs[i - 1].ts)) / 1000;
      if (gap >= gapS) total += 1;
    }
  }
  return total ? baloes / total : 0;
}

function contaPalavra(textos: string[], palavra: string): number {
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${palavra}(?![\\p{L}\\p{N}])`, 'giu');
  let n = 0;
  for (const t of textos) n += (t.toLowerCase().match(re) ?? []).length;
  return n;
}

const semPontuacaoFinal = (t: string) => !'.?!…'.includes(t.slice(-1));
const pontoFinal = (t: string) => t.endsWith('.') && !t.endsWith('...');
const virgula = (t: string) => t.includes(',');

export interface Faixa {
  min: number;
  max: number;
}

export interface Perfil {
  msgs: number;
  chats: number;
  mediana: number;
  p75: number;
  p95: number;
  rajada: number;
  semPontuacao: number;
  ponto: number;
  interrogacao: number;
  virgula: number;
  maiuscula: number;
  minusculo: number;
  emoji: number;
  riso: number;
  multilinha: number;
  faixa: { semPontuacao: Faixa; ponto: Faixa; virgula: Faixa };
  pares: Array<[string, number, string, number]>;
  tratamento: { voce: number; seu: number; tu: number; teu: number; ti: number };
  aberturasDistintas: number;
  aberturaTopo: { palavra: string; pct: number };
  aberturas: Array<{ forma: string; primeiro: number; continuacao: number }>;
  emojis: Array<[string, number]>;
  risadas: Array<[string, number]>;
  marcadores: Array<[string, number]>;
}

function faixa(porChat: Record<string, MsgVoz[]>, teste: (t: string) => boolean, minimo: number): Faixa {
  const vals = Object.values(porChat)
    .filter((m) => m.length >= minimo)
    .map((m) => pct(m.map((x) => x.t), teste));
  if (!vals.length) return { min: 0, max: 0 };
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

const FORMAS_ABERTURA: Array<[string, string[]]> = [
  ['opa', ['opa']],
  ['olá', ['olá', 'ola']],
  ['oi', ['oi']],
  ['bom dia', ['bom dia']],
  ['boa tarde', ['boa tarde']],
  ['boa noite', ['boa noite']],
  ['fala', ['fala']],
];

export function medirPerfil(porChat: Record<string, MsgVoz[]>, minimoFaixa = 25): Perfil {
  const textos = Object.values(porChat).flatMap((m) => m.map((x) => x.t));
  const n = textos.length;
  const tam = textos.map((t) => t.length).sort((a, b) => a - b);
  const baixo = textos.map((t) => t.toLowerCase());

  const primeiras = new Map<string, number>();
  for (const t of baixo) {
    const w = t.trim().split(/[\s,!?.]+/)[0]?.slice(0, 12);
    if (w) primeiras.set(w, (primeiras.get(w) ?? 0) + 1);
  }
  const totalP = [...primeiras.values()].reduce((a, b) => a + b, 0) || 1;
  const [topo, qtdTopo] = [...primeiras.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];

  // 1º contato = primeira mensagem do chat ou depois de 6 h de silêncio; o resto é continuação.
  const prim: string[] = [];
  const cont: string[] = [];
  for (const msgs of Object.values(porChat)) {
    msgs.forEach((m, i) => {
      const novo = i === 0 || Date.parse(m.ts) - Date.parse(msgs[i - 1].ts) > 6 * 3600 * 1000;
      (novo ? prim : cont).push(m.t.toLowerCase());
    });
  }
  const aberturas = FORMAS_ABERTURA.map(([forma, prefixos]) => ({
    forma,
    primeiro: pct(prim, (t) => prefixos.some((p) => t.startsWith(p))),
    continuacao: pct(cont, (t) => prefixos.some((p) => t.startsWith(p))),
  })).filter((a) => a.primeiro >= 1 || a.continuacao >= 1);

  const conta = (re: RegExp) => {
    const m = new Map<string, number>();
    for (const t of textos) for (const x of t.match(re) ?? []) m.set(x, (m.get(x) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };

  return {
    msgs: n,
    chats: Object.values(porChat).filter((m) => m.length).length,
    mediana: quantil(tam, 0.5),
    p75: quantil(tam, 0.75),
    p95: quantil(tam, 0.95),
    rajada: rajadas(porChat),
    semPontuacao: pct(textos, semPontuacaoFinal),
    ponto: pct(textos, pontoFinal),
    interrogacao: pct(textos, (t) => t.endsWith('?')),
    virgula: pct(textos, virgula),
    maiuscula: pct(textos, (t) => /^\p{Lu}/u.test(t)),
    minusculo: pct(textos, (t) => t === t.toLowerCase() && /\p{L}/u.test(t)),
    emoji: pct(textos, temEmoji),
    riso: pct(textos, temRiso),
    multilinha: pct(textos, (t) => t.includes('\n')),
    faixa: {
      semPontuacao: faixa(porChat, semPontuacaoFinal, minimoFaixa),
      ponto: faixa(porChat, pontoFinal, minimoFaixa),
      virgula: faixa(porChat, virgula, minimoFaixa),
    },
    pares: (
      [
        ['vc', 'você'],
        ['q', 'que'],
        ['pra', 'para'],
        ['pq', 'porque'],
        ['tb', 'também'],
        ['n', 'não'],
        ['to', 'estou'],
        ['ta', 'está'],
      ] as const
    ).map(([a, b]) => [a, contaPalavra(baixo, a), b, contaPalavra(baixo, b)] as [string, number, string, number]),
    tratamento: {
      voce: contaPalavra(baixo, 'vc') + contaPalavra(baixo, 'você') + contaPalavra(baixo, 'voce'),
      seu: contaPalavra(baixo, 'seu') + contaPalavra(baixo, 'sua'),
      tu: contaPalavra(baixo, 'tu'),
      teu: contaPalavra(baixo, 'teu') + contaPalavra(baixo, 'tua'),
      ti: contaPalavra(baixo, 'ti'),
    },
    aberturasDistintas: primeiras.size,
    aberturaTopo: { palavra: topo, pct: (qtdTopo / totalP) * 100 },
    aberturas,
    emojis: conta(new RegExp(EMOJI.source, 'gu')).slice(0, 12),
    risadas: conta(/k{2,}|(?:ha){2,}|rs+/gi).slice(0, 8),
    marcadores: MARCADORES_PESSOAIS.map((p) => [p, contaPalavra(baixo, p)] as [string, number]).filter(
      ([, c]) => c > 0,
    ),
  };
}

// Exemplo bom é do próprio operador e não expõe dado de terceiro na skill.
function exemploSeguro(t: string): boolean {
  if (t.length < 6 || t.length > 420) return false;
  if (/https?:\/\/|www\.|@\w+\.\w+/i.test(t)) return false;
  if (/\d{6,}|\d{3}[.\s-]?\d{3}[.\s-]?\d{3}/.test(t)) return false;
  return true;
}

function escolher(textos: string[], teste: (t: string) => boolean, quantos: number): string[] {
  const vistos = new Set<string>();
  const bons = textos.filter((t) => exemploSeguro(t) && teste(t)).filter((t) => {
    const k = t.toLowerCase();
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  if (bons.length <= quantos) return bons;
  // espalhado ao longo do histórico, não só o começo
  const passo = bons.length / quantos;
  return Array.from({ length: quantos }, (_, i) => bons[Math.floor(i * passo + passo / 2)]);
}

export interface Exemplos {
  primeiroContato: string[];
  continuacao: string[];
  explica: string[];
  discorda: string[];
  pede: string[];
  grave: string[];
  negocia: string[];
}

export function escolherExemplos(porChat: Record<string, MsgVoz[]>): Exemplos {
  const prim: string[] = [];
  const cont: string[] = [];
  for (const msgs of Object.values(porChat)) {
    msgs.forEach((m, i) => {
      const novo = i === 0 || Date.parse(m.ts) - Date.parse(msgs[i - 1].ts) > 6 * 3600 * 1000;
      (novo ? prim : cont).push(m.t);
    });
  }
  const todos = Object.values(porChat).flatMap((m) => m.map((x) => x.t));
  return {
    primeiroContato: escolher(prim, (t) => /^(ol[áa]|oi|bom dia|boa tarde|boa noite|opa|fala)(?!\p{L})/iu.test(t), 5),
    continuacao: escolher(cont, (t) => t.length >= 12 && t.length <= 120, 5),
    explica: escolher(todos, (t) => t.length >= 90 && /\b(porque|pq|então|ent[aã]o|assim|por isso|o que acontece)\b/i.test(t), 3),
    discorda: escolher(todos, (t) => t.length >= 40 && /\b(entendi|entendo|concordo)\b.*\bmas\b|\bmas pelo que\b|\bn[aã]o [ée] bem\b/i.test(t), 3),
    pede: escolher(todos, (t) => t.length >= 25 && /\?/.test(t) && /\b(consegue|pode|poderia|me (manda|passa|envia)|preciso|confirma)\b/i.test(t), 3),
    grave: escolher(todos, (t) => t.length >= 120 && /\b(infelizmente|cancel|atraso|urgente|problema|inaceit|não posso|nao posso)\w*/i.test(t), 2),
    negocia: escolher(todos, (t) => t.length >= 40 && /(R\$|\bvalor\b|\bor[çc]amento\b|\bdesconto\b|\bproposta\b|pode ser\?|\bmensalidade\b)/i.test(t), 5),
  };
}

/** Duas rajadas reais (balões seguidos com menos de 90 s). */
export function rajadasExemplo(porChat: Record<string, MsgVoz[]>, quantas = 2): string[][] {
  const todas: string[][] = [];
  for (const msgs of Object.values(porChat)) {
    let atual: string[] = [];
    msgs.forEach((m, i) => {
      if (i > 0 && Date.parse(m.ts) - Date.parse(msgs[i - 1].ts) >= 90_000) {
        if (atual.length >= 3) todas.push(atual);
        atual = [];
      }
      atual.push(m.t);
    });
    if (atual.length >= 3) todas.push(atual);
  }
  const seguras = todas.filter((r) => r.length <= 6 && r.every(exemploSeguro));
  if (seguras.length <= quantas) return seguras;
  const passo = seguras.length / quantas;
  return Array.from({ length: quantas }, (_, i) => seguras[Math.floor(i * passo + passo / 2)]);
}
