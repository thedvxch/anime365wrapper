/**
 * Одно условие расширенного фильтра каталога, например `{ field: 'genre', operator: '@=', value: [8, 35] }`
 * превращается в `genre@=8,35` — так же, как в URL каталога сайта
 * (https://smotret-anime.online/catalog/filter/genre@=8,35;genre_op=and).
 *
 * API пока не публикует список допустимых полей/операторов, поэтому эта функция
 * ничего не проверяет и не подставляет — она лишь механически собирает строку.
 * Актуальные варианты нужно подсматривать на сайте (вкладка фильтров) или в `site.ccsData`
 * исходного кода страницы каталога.
 */
export interface ChipCondition {
  field: string;
  operator: string;
  value: string | number | Array<string | number>;
}

export type Chip = ChipCondition | string;

function stringifyChip(chip: Chip): string {
  if (typeof chip === 'string') {
    return chip;
  }
  const value = Array.isArray(chip.value) ? chip.value.join(',') : chip.value;
  return `${chip.field}${chip.operator}${value}`;
}

/** Собирает значение параметра `chips` из списка условий, разделяя их `;`. */
export function buildChips(chips: Chip[]): string {
  return chips.map(stringifyChip).join(';');
}
