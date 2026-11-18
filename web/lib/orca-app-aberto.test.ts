import { describe, expect, it } from 'vitest';
import { processoDoAppOrca } from './orca-bridge';

const CLI =
  '/Applications/Orca.app/Contents/MacOS/Orca /Applications/Orca.app/Contents/Resources/app.asar.unpacked/out/cli/index.js worktree ps --json';

describe('processoDoAppOrca', () => {
  it('a própria CLI rodando não conta como app aberto', () => {
    expect(processoDoAppOrca(`/usr/sbin/cfprefsd agent\n${CLI}\n`)).toBe(false);
    expect(processoDoAppOrca('')).toBe(false);
  });

  it('reconhece o binário principal do app', () => {
    expect(processoDoAppOrca(`${CLI}\n/Applications/Orca.app/Contents/MacOS/Orca\n`)).toBe(true);
    expect(processoDoAppOrca('/Applications/Orca.app/Contents/MacOS/Orca -psn_0_12345')).toBe(true);
  });

  it('reconhece um helper do Electron do app', () => {
    const helper =
      '/Applications/Orca.app/Contents/Frameworks/Orca Helper (Renderer).app/Contents/MacOS/Orca Helper (Renderer) --type=renderer';
    expect(processoDoAppOrca(helper)).toBe(true);
  });
});
