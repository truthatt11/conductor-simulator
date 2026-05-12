import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './store';

const initial = useAppStore.getState();

describe('app store: meter ↔ path compatibility', () => {
  beforeEach(() => {
    useAppStore.setState(initial, true);
  });

  it('starts with 4/4 + four-beat', () => {
    const s = useAppStore.getState();
    expect(s.timeSignature).toEqual({ numerator: 4, denominator: 4 });
    expect(s.pathId).toBe('four-beat');
  });

  it('switching meter keeps path when still compatible', () => {
    useAppStore.getState().setPathId('two-beat');
    expect(useAppStore.getState().pathId).toBe('two-beat');

    useAppStore.getState().setTimeSignature({ numerator: 2, denominator: 4 });
    expect(useAppStore.getState().pathId).toBe('two-beat');

    useAppStore.getState().setTimeSignature({ numerator: 6, denominator: 8 });
    expect(useAppStore.getState().pathId).toBe('two-beat');
  });

  it('switching meter snaps path to default when incompatible', () => {
    useAppStore.getState().setTimeSignature({ numerator: 3, denominator: 4 });
    expect(useAppStore.getState().pathId).toBe('three-beat');

    useAppStore.getState().setTimeSignature({ numerator: 4, denominator: 4 });
    expect(useAppStore.getState().pathId).toBe('four-beat');
  });

  it('setPathId rejects incompatible path silently', () => {
    useAppStore.getState().setTimeSignature({ numerator: 3, denominator: 4 });
    useAppStore.getState().setPathId('two-beat');
    expect(useAppStore.getState().pathId).toBe('three-beat');
  });

  it('setPathId accepts compatible alternates', () => {
    useAppStore.getState().setPathId('two-beat');
    expect(useAppStore.getState().pathId).toBe('two-beat');
  });
});
