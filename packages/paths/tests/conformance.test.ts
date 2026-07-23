import { describe, expect, test } from 'vitest';
import { compile } from '../lib';

describe('paths conformance matrix', () => {
  test.each([
    ['/user/:id', { id: 'alice' }],
    ['/user/:id<number>', { id: 42 }],
    ['/files/:path*', { path: ['docs', 'api'] }],
    ['/@:user', { user: 'alice' }],
    ['/name-:user?', { user: 'alice' }],
    ['/name-:user?', {}],
  ] as const)('round-trips %s', (pattern, params) => {
    const { build, parse } = compile(pattern);
    const path = build(params as any);

    expect(parse(path)).toStrictEqual({ path, params });
  });

  test('keeps adversarial literal segments bounded and deterministic', () => {
    const literal = `<${'{'.repeat(2_000)}`;
    const { build, parse } = compile(`/${literal}`);

    expect(build()).toBe(`/${literal}`);
    expect(parse(`/${literal}`)).toStrictEqual({
      path: `/${literal}`,
      params: null,
    });
  });
});
