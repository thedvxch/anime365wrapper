// Полное сканирование ленты переводов по afterId (а не offset — так рекомендует
// документация API при счёте на сотни тысяч записей).
// Запуск: npm run build && npx tsx examples/full-scan.ts
import { Anime365API } from 'anime365wrapper';

const api = new Anime365API({ userAgent: 'ExampleApp/1.0' });

let afterId: number | undefined;
let total = 0;
const PAGE_LIMIT = 3; // в реальном сканировании убрать ограничение и идти до пустой страницы

for (let page = 0; page < PAGE_LIMIT; page++) {
  const batch = await api.getTranslations({ feed: 'id', afterId, limit: 200 });
  if (batch.length === 0) break;

  total += batch.length;
  afterId = batch[batch.length - 1]!.id;
  console.log(`Страница ${page + 1}: ${batch.length} записей, afterId=${afterId}`);
}

console.log(`Всего обработано: ${total}`);
