import { parseWith, parseSafe } from './validate.js';

const goodImporter = () =>
  Promise.resolve({ demoSchema: { parse: (d) => ({ ...d, parsed: true }) } });
const throwingImporter = () =>
  Promise.resolve({
    strictSchema: {
      parse: () => {
        const err = new Error('Invalid input');
        err.issues = [{ path: ['name'], message: 'expected string, received null' }];
        throw err;
      },
    },
  });

describe('validate.js', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  describe('parseWith — the strict primitive', () => {
    it('returns the parsed value', async () => {
      expect(await parseWith('demoSchema', goodImporter, { a: 1 })).toEqual({ a: 1, parsed: true });
    });

    it('throws when the shape does not match', async () => {
      await expect(parseWith('strictSchema', throwingImporter, {})).rejects.toThrow(
        'Invalid input',
      );
    });
  });

  // A hand-maintained response schema always lags the API a little. When it
  // drifts, a strict parse throws down the same path as a failed request and
  // the page tells the user the network is down over data that arrived intact.
  describe('parseSafe — never turns schema drift into an outage', () => {
    it('returns the parsed value on success', async () => {
      expect(await parseSafe('demoSchema', goodImporter, { a: 1 })).toEqual({ a: 1, parsed: true });
    });

    it('returns the raw data unchanged when validation fails', async () => {
      const raw = { name: null, rows: [1, 2, 3] };
      expect(await parseSafe('strictSchema', throwingImporter, raw)).toBe(raw);
    });

    it('warns once per schema rather than once per row', async () => {
      const raw = { name: null };
      await parseSafe('noisySchema', throwingImporter, raw);
      await parseSafe('noisySchema', throwingImporter, raw);
      await parseSafe('noisySchema', throwingImporter, raw);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('survives the schema module itself failing to load', async () => {
      const raw = { a: 1 };
      const broken = () => Promise.reject(new Error('chunk load failed'));
      expect(await parseSafe('missingSchema', broken, raw)).toBe(raw);
    });
  });
});
