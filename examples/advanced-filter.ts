// Расширенный фильтр каталога через buildChips() — аналог фильтра на сайте
// https://smotret-anime.online/catalog/filter/genre@=8,35;genre_op=and
// Запуск: npm run build && npx tsx examples/advanced-filter.ts
import { Anime365API, buildChips } from 'anime365wrapper';

const api = new Anime365API({ userAgent: 'ExampleApp/1.0' });

const chips = buildChips([
  { field: 'genre', operator: '@=', value: [8, 35] },
  'genre_op=and',
]);

const results = await api.getSeriesList({ chips, fields: ['id', 'title'], limit: 10 });
console.log('chips:', chips);
for (const series of results) {
  console.log(`#${series.id} ${series.title}`);
}
