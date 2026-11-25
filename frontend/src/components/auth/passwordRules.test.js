import { describe, it, expect } from 'vitest';
import {
  checkNewPassword,
  generatePassword,
  PASSWORD_MIN,
  PASSWORD_MAX,
} from './passwordRules';

describe('password rules', () => {
  it('spec 3: refuses fewer than 8 characters', () => {
    expect(checkNewPassword('short1', 'short1')).toBe(`At least ${PASSWORD_MIN} characters.`);
  });

  it('spec 3: refuses more than 72 characters', () => {
    const tooLong = 'a'.repeat(PASSWORD_MAX + 1);
    expect(checkNewPassword(tooLong, tooLong)).toBe(`At most ${PASSWORD_MAX} characters.`);
  });

  it('spec 3: refuses two different passwords', () => {
    expect(checkNewPassword('longenough1', 'longenough2')).toBe(
      'The two passwords do not match.',
    );
  });

  it('spec 3: accepts 8 to 72 characters when both fields match', () => {
    expect(checkNewPassword('longenough1', 'longenough1')).toBeNull();
    const max = 'a'.repeat(PASSWORD_MAX);
    expect(checkNewPassword(max, max)).toBeNull();
  });

  it('spec 3/D11: generatePassword gives 10 readable characters, never 0O1lI', () => {
    for (let i = 0; i < 1000; i += 1) {
      const password = generatePassword();
      expect(password).toHaveLength(10);
      expect(password).toMatch(/^[abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/);
      expect(password).not.toMatch(/[0O1lI]/);
    }
  });
});
