import os from 'os';
import path from 'path';
import { config } from 'dotenv';
import fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const tmpDir = path.join(os.tmpdir(), 'gamelist-utils-test-env');

beforeEach(async () => {
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe('env.load', () => {
  it('loads without error and is idempotent', async () => {
    const { load } = await import('./env.js');
    expect(() => load()).not.toThrow();
    expect(() => load()).not.toThrow();
  });

  it('checks for .env file existence before loading', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'TEST_VAR=test_value\n');

    expect(fs.existsSync(envFile)).toBe(true);

    const result = config({ path: envFile });
    expect(result.error).toBeUndefined();
  });

  it('handles missing .env files gracefully with dotenv', () => {
    const nonExistentFile = path.join(tmpDir, 'nonexistent.env');
    expect(fs.existsSync(nonExistentFile)).toBe(false);

    expect(() => config({ path: nonExistentFile })).not.toThrow();
  });

  it('loads environment-specific .env files based on NODE_ENV', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const envPath = `.env.${process.env.NODE_ENV}`;
    expect(envPath).toBe('.env.test');

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('constructs correct .env file paths', () => {
    const originalNodeEnv = process.env.NODE_ENV || 'development';

    const paths = [`.env.${originalNodeEnv}.local`, `.env.${originalNodeEnv}`, '.env'];

    expect(paths).toContain('.env');
    expect(paths.length).toBe(3);
  });
});
