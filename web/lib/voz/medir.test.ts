import { describe, expect, it } from 'vitest';
import {
  corteAutomatico,
  digitadaPelaPessoa,
  escolherExemplos,
  medirPerfil,
  mensagensHumanas,
  type MsgVoz,
  type RegistroVoz,
  triagem,
} from './medir';
import { montarSkill } from './skill';

const reg = (timestamp: string, text: string, extra: Partial<RegistroVoz> = {}): RegistroVoz => ({
  timestamp,
  text,
  fromMe: true,
  ...extra,
});

describe('quem digitou', () => {
  it('celular é da pessoa; web só antes do corte; coletor e IA da Meta nunca', () => {
    expect(digitadaPelaPessoa(reg('2026-10-01', 'oi', { origem: 'celular' }), '2026-01-01')).toBe(true);
    expect(digitadaPelaPessoa(reg('2026-10-01', 'oi', { origem: 'web' }), '2026-01-01')).toBe(false);
    expect(digitadaPelaPessoa(reg('2025-10-01', 'oi', { origem: 'web' }), '2026-01-01')).toBe(true);
    expect(digitadaPelaPessoa(reg('2026-10-01', 'oi', { origem: 'coletor' }), null)).toBe(false);
    expect(digitadaPelaPessoa(reg('2026-10-01', 'oi', { origem: 'ia_meta' }), null)).toBe(false);
    expect(digitadaPelaPessoa(reg('2026-10-01', 'oi', { fromMe: false }), null)).toBe(false);
  });

  it('sem origem só vale antes do corte', () => {
    expect(digitadaPelaPessoa(reg('2026-05-01', 'oi'), '2026-06-01')).toBe(true);
    expect(digitadaPelaPessoa(reg('2026-07-01', 'oi'), '2026-06-01')).toBe(false);
    expect(digitadaPelaPessoa(reg('2026-07-01', 'oi'), null)).toBe(true);
  });

  it('painel: só o login do dono conta', () => {
    const r = reg('2026-10-01', 'oi', { ator: 'painel', usuario: 'rodrigo', origem: 'coletor' });
    expect(digitadaPelaPessoa(r, null, { donoPainel: 'rodrigo' })).toBe(true);
    expect(digitadaPelaPessoa({ ...r, usuario: 'ana' }, null, { donoPainel: 'rodrigo' })).toBe(false);
  });

  it('o corte é o primeiro envio automático, ou `antes` se vier antes dele', () => {
    const regs = [reg('2026-08-01', 'a', { origem: 'coletor' }), reg('2026-07-01', 'b', { origem: 'coletor' }), reg('2026-01-01', 'c')];
    expect(corteAutomatico(regs)).toBe('2026-07-01');
    expect(corteAutomatico(regs, { antes: '2026-06-01' })).toBe('2026-06-01');
    expect(corteAutomatico(regs, { antes: '2026-09-01' })).toBe('2026-07-01');
    expect(mensagensHumanas(regs, '2026-07-01').map((m) => m.t)).toEqual(['c']);
  });
});

describe('medirPerfil', () => {
  const msgs: MsgVoz[] = [
    { ts: '2026-05-01T10:00:00Z', t: 'opa, tudo certo?' },
    { ts: '2026-05-01T10:00:30Z', t: 'vc consegue ver isso pra mim' },
    { ts: '2026-05-01T12:00:00Z', t: 'Fechado.' },
    { ts: '2026-05-01T12:00:10Z', t: 'você viu q o deploy subiu' },
  ];
  const p = medirPerfil({ a: msgs });

  it('mede pontuação, vírgula e mediana', () => {
    expect(p.msgs).toBe(4);
    expect(p.ponto).toBe(25);
    expect(p.virgula).toBe(25);
    expect(p.semPontuacao).toBe(50);
    expect(p.mediana).toBe(msgs.map((m) => m.t.length).sort((a, b) => a - b)[2]);
  });

  it('conta os dois lados das abreviações e o tratamento', () => {
    const vc = p.pares.find(([a]) => a === 'vc');
    expect(vc).toEqual(['vc', 1, 'você', 1]);
    expect(p.pares.find(([a]) => a === 'q')?.[1]).toBe(1);
    expect(p.tratamento.voce).toBe(2);
    expect(p.tratamento.tu).toBe(0);
  });

  it('rajada junta balões com menos de 90 s', () => {
    expect(p.rajada).toBe(2);
  });
});

describe('triagem', () => {
  const muitas = (t: string) => Array.from({ length: 30 }, (_, i) => ({ ts: `2026-05-01T10:${String(i).padStart(2, '0')}:00Z`, t }));
  const porChat = {
    amigo: muitas('kkkk mano'),
    cliente: muitas('Bom dia, o deploy do sistema ficou pronto, pode testar o projeto'),
    pouco: muitas('oi').slice(0, 3),
  };

  it('separa pessoal de trabalho e ignora chat com pouca mensagem', () => {
    const t = triagem(porChat);
    expect(t.map((l) => [l.slug, l.modo])).toEqual([
      ['amigo', 'pessoal'],
      ['cliente', 'trabalho'],
    ]);
  });

  it('a escolha da pessoa vence o score', () => {
    const t = triagem(porChat, { trabalho: ['amigo'] });
    expect(t.find((l) => l.slug === 'amigo')?.modo).toBe('trabalho');
  });
});

describe('exemplos e skill', () => {
  it('não usa exemplo com link, e-mail ou número longo', () => {
    const e = escolherExemplos({
      a: [
        { ts: '2026-05-01T10:00:00Z', t: 'Olá, tudo bem? segue https://exemplo.com' },
        { ts: '2026-05-01T11:00:00Z', t: 'Olá, me chama no 11999998888' },
        { ts: '2026-05-02T11:00:00Z', t: 'Olá, tudo bem? Sou eu de novo' },
      ],
    });
    expect(e.primeiroContato).toEqual(['Olá, tudo bem? Sou eu de novo']);
  });

  it('a skill sai sem nenhum campo {{...}} e com o nome pedido', () => {
    const pf = medirPerfil({ a: [{ ts: '2026-05-01T10:00:00Z', t: 'opa, tudo certo?' }] });
    const md = montarSkill({
      nome: 'minha-voz',
      trabalho: pf,
      pessoal: null,
      exemplos: escolherExemplos({}),
      rajadasPessoais: [],
      geradoEm: '2026-11-16T00:00:00Z',
      corte: null,
    });
    expect(md.startsWith('---\nname: minha-voz\n')).toBe(true);
    expect(md).not.toContain('{{');
  });
});
