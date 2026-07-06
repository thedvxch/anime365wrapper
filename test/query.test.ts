import { describe, expect, it } from 'vitest';
import { toSearchParams } from '../src/utils/query.js';

describe('toSearchParams', () => {
  it('пропускает undefined и null', () => {
    const search = toSearchParams({ a: 1, b: undefined, c: null, d: 'x' });
    expect(search.get('a')).toBe('1');
    expect(search.has('b')).toBe(false);
    expect(search.has('c')).toBe(false);
    expect(search.get('d')).toBe('x');
  });

  it('склеивает массивы через запятую', () => {
    const search = toSearchParams({ fields: ['id', 'title', 'year'] });
    expect(search.get('fields')).toBe('id,title,year');
  });

  it('приводит числа и булевы значения к строке', () => {
    const search = toSearchParams({ limit: 10, pretty: 1 });
    expect(search.get('limit')).toBe('10');
    expect(search.get('pretty')).toBe('1');
  });
});
