import { describe, expect, it } from 'vitest';

describe('env.load', () => {
  it('loads without error and is idempotent', async () => {
    // Dynamic import to test the module
    const { load } = await import('./env.js');
    expect(() => load()).not.toThrow();
    // Second call should be a no-op (idempotent)
    expect(() => load()).not.toThrow();
  });
});
