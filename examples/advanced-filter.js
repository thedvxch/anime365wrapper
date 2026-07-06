// Расширенный фильтр каталога через buildChips() — аналог фильтра на сайте
// https://smotret-anime.online/catalog/filter/genre@=8,35;genre_op=and
// Запуск: npm run build && node examples/advanced-filter.js
import { SmotretAnimeAPI, buildChips } from '../dist/index.js';

const api = new SmotretAnimeAPI({ userAgent: 'ExampleApp/1.0' });

const chips = buildChips([
  { field: 'genre', operator: '@=', value: [8, 35] },
  'genre_op=and',
]);

const results = await api.getSeriesList({ chips, fields: ['id', 'title'], limit: 10 });
console.log('chips:', chips);
for (const series of results) {
  console.log(`#${series.id} ${series.title}`);
}
