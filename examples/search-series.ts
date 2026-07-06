// Поиск аниме по названию и вывод основных полей.
// Запуск: npm run build && npx tsx examples/search-series.ts "gate"
import { SmotretAnimeAPI } from 'anime365wrapper';

const api = new SmotretAnimeAPI({ userAgent: 'ExampleApp/1.0' });

const query = process.argv[2] ?? 'gate';
const results = await api.getSeriesList({
  query,
  fields: ['id', 'title', 'typeTitle', 'year', 'posterUrlSmall'],
  limit: 10,
});

for (const series of results) {
  console.log(`#${series.id} ${series.title} — ${series.typeTitle}, ${series.year}`);
}
