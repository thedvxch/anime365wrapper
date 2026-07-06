import { describe, expect, it } from 'vitest';
import { buildChips } from '../src/utils/chips.js';

describe('buildChips', () => {
  it('собирает одно условие с массивом значений', () => {
    expect(buildChips([{ field: 'genre', operator: '@=', value: [8, 35] }])).toBe('genre@=8,35');
  });

  it('повторяет пример из документации API', () => {
    const result = buildChips([{ field: 'genre', operator: '@=', value: [8, 35] }, 'genre_op=and']);
    expect(result).toBe('genre@=8,35;genre_op=and');
  });

  it('поддерживает одиночное значение и произвольный оператор', () => {
    expect(buildChips([{ field: 'year', operator: '=', value: 2024 }])).toBe('year=2024');
  });

  it('пропускает необработанные строковые chips без изменений', () => {
    expect(buildChips(['season_op=or', 'type=tv'])).toBe('season_op=or;type=tv');
  });
});
