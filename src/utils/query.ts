/** Строит query-строку из объекта, пропуская `undefined`/`null` и склеивая массивы через запятую. */
export function toSearchParams(params: object): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as Array<[string, unknown]>) {
    if (value === undefined || value === null) continue;
    search.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return search;
}
