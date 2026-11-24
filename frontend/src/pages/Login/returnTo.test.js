import { expect, it } from 'vitest';
import { loginReturnTo } from './returnTo';

it('preserves a protected vehicle deep link, including its query and anchor', () => {
  const destination = '/vehicles/WB11G1234?tab=documents#uploads';
  expect(loginReturnTo(destination)).toBe(destination);
});

it.each([
  '//other.invalid',
  '/\\other.invalid',
  '/\n/other.invalid',
  'https://other.invalid',
  '/x/../superadmin',
  '/x/..//other.invalid',
  '/login?next=/vehicles',
])('rejects an unsafe or inappropriate return destination %s', (destination) =>
  expect(loginReturnTo(destination)).toBeNull(),
);
