// Последние добавленные переводы онгоингов.
// Запуск: npm run build && node examples/recent-translations.js
import { SmotretAnimeAPI } from '../dist/index.js';

const api = new SmotretAnimeAPI({ userAgent: 'ExampleApp/1.0' });

const translations = await api.getTranslations({ feed: 'recent' });

for (const t of translations.slice(0, 20)) {
  console.log(`[${t.typeKind}/${t.typeLang}] ${t.title} — ${t.authorsSummary}`);
}
