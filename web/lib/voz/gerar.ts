// Gera a skill de voz a partir do histórico do coletor: lê todos os chats, fica só
// com o que a pessoa digitou, separa trabalho de pessoal e monta o SKILL.md.

import { listGroups, readGroupRecords } from '../data';
import {
  corteAutomatico,
  escolherExemplos,
  type LinhaTriagem,
  medirPerfil,
  mensagensHumanas,
  type MsgVoz,
  rajadasExemplo,
  type RegistroVoz,
  triagem,
} from './medir';
import { montarSkill } from './skill';

export interface OpcoesVoz {
  /** Mensagens sem `origem` só contam antes desta data (ISO). */
  antes?: string;
  /** Slugs que vão para o modo trabalho ou pessoal, por cima do score. */
  trabalho?: string[];
  pessoal?: string[];
  /** Mínimo de mensagens da pessoa para um chat entrar (default 25). */
  minimo?: number;
  /** Nome da skill gerada (default voz-do-operador). */
  nome?: string;
}

export interface ResultadoVoz {
  nome: string;
  skill: string;
  resumo: {
    mensagens_da_pessoa: number;
    chats_trabalho: number;
    chats_pessoal: number;
    corte: string | null;
    mediana_trabalho: number | null;
    sem_pontuacao_trabalho: number | null;
    virgula_trabalho: number | null;
  };
  triagem: Array<LinhaTriagem & { nome: string }>;
  aviso?: string;
}

const MINIMO_TOTAL = 150;

export async function gerarVoz(opts: OpcoesVoz = {}): Promise<ResultadoVoz> {
  const grupos = await listGroups();
  const registros = new Map<string, RegistroVoz[]>();
  for (const g of grupos) registros.set(g.slug, (await readGroupRecords(g.slug)) as RegistroVoz[]);

  const filtro = { antes: opts.antes, donoPainel: process.env.PANEL_USER };
  const corte = corteAutomatico([...registros.values()].flat(), filtro);
  const porChat: Record<string, MsgVoz[]> = {};
  for (const [slug, regs] of registros) {
    const msgs = mensagensHumanas(regs, corte, filtro);
    if (msgs.length) porChat[slug] = msgs;
  }

  const linhas = triagem(porChat, { minimo: opts.minimo ?? 25, trabalho: opts.trabalho, pessoal: opts.pessoal });
  const deModo = (modo: 'trabalho' | 'pessoal') =>
    Object.fromEntries(linhas.filter((l) => l.modo === modo).map((l) => [l.slug, porChat[l.slug]]));
  const trab = deModo('trabalho');
  const pess = deModo('pessoal');
  const perfilTrab = Object.keys(trab).length ? medirPerfil(trab) : null;
  const perfilPess = Object.keys(pess).length ? medirPerfil(pess) : null;
  const nome = opts.nome ?? 'voz-do-operador';
  const total = (perfilTrab?.msgs ?? 0) + (perfilPess?.msgs ?? 0);

  const skill = montarSkill({
    nome,
    nomeOperador: process.env.WAC_NOME_OPERADOR || undefined,
    trabalho: perfilTrab,
    pessoal: perfilPess,
    exemplos: escolherExemplos(Object.keys(trab).length ? trab : pess),
    rajadasPessoais: rajadasExemplo(pess),
    geradoEm: new Date().toISOString(),
    corte,
  });

  const nomes = new Map(grupos.map((g) => [g.slug, g.name]));
  return {
    nome,
    skill,
    resumo: {
      mensagens_da_pessoa: total,
      chats_trabalho: Object.keys(trab).length,
      chats_pessoal: Object.keys(pess).length,
      corte,
      mediana_trabalho: perfilTrab?.mediana ?? null,
      sem_pontuacao_trabalho: perfilTrab ? Math.round(perfilTrab.semPontuacao) : null,
      virgula_trabalho: perfilTrab ? Math.round(perfilTrab.virgula) : null,
    },
    triagem: linhas.map((l) => ({ ...l, nome: nomes.get(l.slug) ?? l.slug })),
    ...(total < MINIMO_TOTAL
      ? { aviso: `só ${total} mensagens digitadas pela pessoa em chats com ${opts.minimo ?? 25}+ mensagens: o perfil ainda é fraco; gere de novo quando o histórico crescer` }
      : {}),
  };
}
