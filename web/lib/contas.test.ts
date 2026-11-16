import { afterEach, describe, expect, it } from 'vitest';
import { comConta, contaAtiva, lerContas } from './contas';

const ENV = ['WAC_CLOUD_URL', 'WAC_CLOUD_USER', 'WAC_CLOUD_PASS', 'WAC_CONTAS', 'WAC_CONTA_NOME'] as const;
const salvo = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of ENV) {
    if (salvo[k] === undefined) delete process.env[k];
    else process.env[k] = salvo[k];
  }
});

describe('lerContas', () => {
  it('uma conta só, pelo trio de sempre', () => {
    const contas = lerContas({ WAC_CLOUD_URL: 'https://painel.exemplo.com/', WAC_CLOUD_USER: 'admin', WAC_CLOUD_PASS: 's3nha' });
    expect(contas).toEqual([{ nome: 'principal', url: 'https://painel.exemplo.com', user: 'admin', pass: 's3nha' }]);
  });

  it('contas extras no campo do endereço, com login na URL', () => {
    const contas = lerContas({
      WAC_CLOUD_URL: 'https://a.exemplo.com pessoal=https://ana:p%40ss@b.exemplo.com',
      WAC_CLOUD_USER: 'admin',
      WAC_CLOUD_PASS: 'x',
      WAC_CONTA_NOME: 'business',
    });
    expect(contas.map((c) => c.nome)).toEqual(['business', 'pessoal']);
    expect(contas[1]).toEqual({ nome: 'pessoal', url: 'https://b.exemplo.com', user: 'ana', pass: 'p@ss' });
  });

  it('WAC_CONTAS em texto e em JSON', () => {
    const texto = lerContas({ WAC_CLOUD_URL: 'https://a.exemplo.com', WAC_CONTAS: 'b=https://u:p@b.exemplo.com, c=https://u:p@c.exemplo.com' });
    expect(texto.map((c) => c.nome)).toEqual(['principal', 'b', 'c']);
    const json = lerContas({ WAC_CONTAS: '{"pessoal":{"url":"https://b.exemplo.com/","user":"u","pass":"p"}}' });
    expect(json).toEqual([{ nome: 'pessoal', url: 'https://b.exemplo.com', user: 'u', pass: 'p' }]);
  });

  it('ignora marcador vazio do plugin e "nenhuma"', () => {
    expect(lerContas({ WAC_CLOUD_URL: 'https://a.exemplo.com', WAC_CONTAS: '${WAC_CONTAS}' })).toHaveLength(1);
    expect(lerContas({ WAC_CLOUD_URL: 'https://a.exemplo.com', WAC_CONTAS: 'nenhuma' })).toHaveLength(1);
    expect(lerContas({})).toEqual([]);
  });

  it('recusa nome repetido e conta sem nome', () => {
    expect(() => lerContas({ WAC_CLOUD_URL: 'https://a.exemplo.com', WAC_CONTAS: 'principal=https://b.exemplo.com' })).toThrow(/repetida/);
    expect(() => lerContas({ WAC_CLOUD_URL: 'https://a.exemplo.com https://b.exemplo.com' })).toThrow(/sem nome/);
  });
});

describe('comConta', () => {
  it('troca a conta ativa só dentro da chamada, inclusive depois de await', async () => {
    process.env.WAC_CLOUD_URL = 'https://a.exemplo.com pessoal=https://u:p@b.exemplo.com';
    delete process.env.WAC_CONTAS;
    expect(contaAtiva()?.nome).toBe('principal');
    const url = await comConta('pessoal', async () => {
      await new Promise((r) => setTimeout(r, 5));
      return contaAtiva()?.url;
    });
    expect(url).toBe('https://b.exemplo.com');
    expect(contaAtiva()?.nome).toBe('principal');
  });

  it('conta desconhecida lança com a lista', () => {
    process.env.WAC_CLOUD_URL = 'https://a.exemplo.com';
    expect(() => comConta('outra', () => 1)).toThrow(/configuradas: principal/);
  });
});
