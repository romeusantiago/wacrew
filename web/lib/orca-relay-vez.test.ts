import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { OrcaSnapshot } from './orca-bridge';

// Cada chamada da CLI do Orca sobe o Electron inteiro. Quem não tem a vez (lock de outro
// processo ainda fresco) e quem está com o app do Orca fechado não podem chamar a CLI.
let leiturasDaCli = 0;
let appAberto = false;

vi.mock('./orca-bridge', () => ({
  getOrcaBin: () => '/fake/orca',
  orcaAppAberto: async () => appAberto,
  readLocalOrcaSnapshot: async (): Promise<OrcaSnapshot> => {
    leiturasDaCli++;
    return { available: true, source: 'local-cli', bySlug: {}, updatedAt: new Date().toISOString() } as OrcaSnapshot;
  },
  readLocalTerminalScreen: async () => null,
  executeLocalOrcaCommand: async () => ({ id: 'x', ok: true, completedAt: new Date().toISOString() }),
}));

vi.mock('./cloud', () => ({
  cloudDestinoDoEnv: () => null,
  cloudPostTo: async () => ({ json: async () => ({ ok: true }) }),
}));

let tmp: string;

beforeAll(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'wa-orca-vez-'));
  // Locks do relay moram em tmpdir(): isolado por teste.
  process.env.TMPDIR = tmp;
});

afterAll(async () => {
  delete process.env.WAC_ORCA_RELAY;
  await rm(tmp, { recursive: true, force: true });
});

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('vez do relay antes da CLI do Orca', () => {
  it('sem a vez ou com o app fechado não lê a CLI; com as duas, lê', async () => {
    const relay = await import('./orca-relay');
    const destino = { url: 'https://vez.example' };
    const lockFile = relay.orcaRelayLockFile(destino);
    // Outro processo (pid que não é o nosso) acabou de pegar a vez.
    await writeFile(lockFile, JSON.stringify({ pid: 999_999, ts: Date.now() }), 'utf8');

    const ciclos: Array<{ lock: boolean }> = [];
    relay.startOrcaRemoteRelayLoop(30, {
      destinos: [destino],
      unref: false,
      onCycle: (info) => ciclos.push({ lock: info.lock }),
    });

    // O primeiro ciclo sai em 800 ms; depois, a cada 30 ms.
    await esperar(1200);
    expect(ciclos.some((c) => !c.lock)).toBe(true);
    expect(leiturasDaCli).toBe(0);

    // O outro processo some: a vez passa a ser nossa, mas o app do Orca está fechado.
    await rm(lockFile, { force: true });
    await esperar(300);
    expect(leiturasDaCli).toBe(0);

    // O app abre: agora o ciclo lê a CLI e sincroniza.
    appAberto = true;
    await esperar(300);
    expect(leiturasDaCli).toBeGreaterThan(0);
    expect(ciclos.some((c) => c.lock)).toBe(true);
  });

  it('WAC_ORCA_RELAY=0 não liga a ponte', async () => {
    vi.resetModules();
    process.env.WAC_ORCA_RELAY = '0';
    const fresco = await import('./orca-relay');
    const ciclos: unknown[] = [];
    fresco.startOrcaRemoteRelayLoop(30, {
      destinos: [{ url: 'https://desligado.example' }],
      unref: false,
      onCycle: (info) => ciclos.push(info),
    });
    await esperar(1000);
    expect(ciclos).toEqual([]);
  });
});
