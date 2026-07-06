// Последние добавленные переводы онгоингов.
// Запуск: npm run build && npx tsx examples/recent-translations.ts
import { SmotretAnimeAPI } from 'anime365wrapper';

const api = new SmotretAnimeAPI({ userAgent: 'ExampleApp/1.0' });

const translations = await api.getTranslations({ feed: 'recent' });

for (const t of translations.slice(0, 20)) {
  console.log(`[${t.typeKind}/${t.typeLang}] ${t.title} — ${t.authorsSummary}`);
}
