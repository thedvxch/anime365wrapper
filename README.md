# anime365wrapper

TypeScript/ESM-обёртка над API [smotret-anime.online](https://smotret-anime.online/api) (бывший anime365.ru): каталог аниме, переводы, эпизоды, ссылки на видео/субтитры и авторизация.

## Требования

- Node.js 18 или новее (используется встроенный `fetch`)
- ESM (`"type": "module"`)

## Установка

```bash
npm install anime365wrapper
```

## Быстрый старт

```typescript
import { SmotretAnimeAPI } from 'anime365wrapper';

const api = new SmotretAnimeAPI({ userAgent: 'MyApp/1.0' });

const series = await api.getSeriesList({ query: 'gate', limit: 10 });
const translations = await api.getTranslations({ feed: 'recent' });
```

API всегда указывать `userAgent` — название сайта или программы, отправляемое в заголовке `User-Agent`.

## Особенности API, которые важно знать

- **Ошибки приходят с HTTP 200.** Тело ответа при ошибке — `{ "error": { "code": number, "message": string } }`, статус при этом не меняется. Библиотека разбирает это сама и бросает `AnimeApiError` — проверять `response.ok` бессмысленно, полагайтесь на try/catch.
- **Для полного сканирования используйте `afterId`, а не `offset`.** При счёте на сотни тысяч записей `offset` работает медленно; `feed: 'id'` и `feed: 'all'` поддерживают постраничный проход через `afterId` (id последней полученной записи).
- **`subtitlesUrl` из `getTranslationEmbed()` бывает относительным** (например `/episodeTranslations/123.ass?willcache`). Библиотека сама приводит его к абсолютному URL относительно домена API.
- **У `access_token` нет срока действия** — он действителен, пока не сменится пароль. Храните его как секрет (переменная окружения, секрет-хранилище), не коммитьте в репозиторий.
- **Домен API может меняться и блокироваться регионально** — у сервиса несколько официальных зеркал (`smotret-anime.online`, `smotret-anime.app` — рабочее зеркало для РФ, `smotret-anime.org`, `anime365.ru`, `anime-365.ru`). По умолчанию библиотека пробует их все по очереди при сетевых сбоях — см. «Зеркала и fallback» ниже.

## Конструктор

```typescript
new SmotretAnimeAPI(options?: {
  baseUrl?: string | string[]; // по умолчанию DEFAULT_MIRRORS (все известные зеркала)
  userAgent?: string;          // по умолчанию 'Anime365Wrapper/2.0'
  accessToken?: string;        // если токен уже известен
  timeoutMs?: number;          // таймаут запроса, по умолчанию не ограничен
})
```

## Зеркала и fallback

По умолчанию (`baseUrl` не указан) используется список `DEFAULT_MIRRORS` — все известные домены anime365 в порядке приоритета. При сетевом сбое (недоступный домен, DNS, таймаут) библиотека автоматически пробует следующее зеркало из списка; ошибки самого API (`AnimeApiError`, например 404 или неверный пароль) fallback не запускают — домен ответил, значит проблема не в нём. Зеркало, на котором прошёл последний успешный запрос, запоминается и используется первым в следующий раз.

```typescript
import { SmotretAnimeAPI, DEFAULT_MIRRORS } from 'anime365wrapper';

console.log(DEFAULT_MIRRORS); // ['https://smotret-anime.online/api', 'https://smotret-anime.app/api', ...]

const api = new SmotretAnimeAPI(); // fallback по всем зеркалам сразу из коробки
console.log(api.activeBaseUrl); // текущее рабочее зеркало

// baseUrl строкой — фиксированный домен без fallback (поведение как раньше)
const pinned = new SmotretAnimeAPI({ baseUrl: 'https://smotret-anime.online/api' });

// свой список зеркал
const custom = new SmotretAnimeAPI({ baseUrl: ['https://smotret-anime.app/api', 'https://anime365.ru/api'] });
```

## Авторизация

```typescript
import { SmotretAnimeAPI } from 'anime365wrapper';

const api = new SmotretAnimeAPI({ userAgent: 'MyApp/1.0' });

const token = await api.login('user@example.com', 'password'); // сохраняется в this
const user = await api.getCurrentUser(); // требует токен

// либо переиспользовать уже полученный токен
api.setAccessToken(token);
```

Получить `access_token` также можно вручную на сайте: `api.socialLoginUrl` (вход по email/паролю или через соцсети) и `api.accessTokenPageUrl` (страница с готовым токеном для авторизованного пользователя).

### UserSession

Тонкая обёртка, которая запоминает токен после `login()` и проксирует остальные методы `SmotretAnimeAPI` без дублирования его при каждом вызове:

```typescript
import { UserSession } from 'anime365wrapper';

const session = new UserSession({ userAgent: 'MyApp/1.0' });
await session.login('user@example.com', 'password');

const translations = await session.getTranslations({ feed: 'recent' });
const user = await session.getCurrentUser();

// доступ к нижележащему клиенту, если нужен метод, не проксируемый UserSession
session.client.getAccessToken();
```

## Методы SmotretAnimeAPI

### Переводы

```typescript
getTranslations(query?: {
  feed?: 'recent' | 'id' | 'all'; // recent — последние добавленные онгоинги, id/all — полный список (all включает неактивные)
  afterId?: number;               // для постраничного сканирования feed=id/all
  seriesId?: number;
  episodeId?: number;
  fields?: string | string[];     // ограничить набор полей ответа
  limit?: number;
  offset?: number;
}): Promise<Translation[]>

getTranslationById(id: number): Promise<Translation>

getTranslationEmbed(id: number): Promise<EmbedTranslation> // ссылки на видео/субтитры, требует авторизации
```

### Аниме (series)

```typescript
getSeriesList(query?: {
  fields?: string | string[];
  chips?: string | Chip[];   // расширенный фильтр каталога, см. buildChips() ниже
  myAnimeListId?: number;
  query?: string;            // поиск по названию
  pretty?: number;
  limit?: number;
  offset?: number;
}): Promise<Series[]>

getSeriesById(id: number): Promise<Series>
```

### Эпизоды

```typescript
getEpisodeById(id: number): Promise<Episode>
```

### Пользователь

```typescript
getCurrentUser(): Promise<User> // требует access_token
```

## Расширенный фильтр каталога (`chips`)

Список допустимых полей и операторов сам API не публикует — их видно только на сайте (вкладка фильтров каталога) или в `site.ccsData` исходного кода страницы `/catalog`. `buildChips()` лишь механически собирает строку в формате, который использует сайт, ничего не проверяя:

```typescript
import { SmotretAnimeAPI, buildChips } from 'anime365wrapper';

const chips = buildChips([
  { field: 'genre', operator: '@=', value: [8, 35] },
  'genre_op=and',
]);
// chips === 'genre@=8,35;genre_op=and'

const api = new SmotretAnimeAPI();
const results = await api.getSeriesList({ chips });
```

## Обработка ошибок

```typescript
import { SmotretAnimeAPI, AnimeApiError, AnimeApiNetworkError } from 'anime365wrapper';

const api = new SmotretAnimeAPI();

try {
  await api.getSeriesById(999999999);
} catch (error) {
  if (error instanceof AnimeApiError) {
    console.error(`API вернул ошибку ${error.code}: ${error.message}`); // 404: Series not found.
  } else if (error instanceof AnimeApiNetworkError) {
    console.error('Сеть недоступна или ответ не удалось разобрать:', error.message);
  } else {
    throw error;
  }
}
```

## Типы

Экспортируются все модели ответов API:

```typescript
import type {
  Translation,
  DownloadOption,
  StreamOption,
  EmbedTranslation,
  Series,
  Episode,
  User,
  LoginResponse,
  ApiResponse,
} from 'anime365wrapper';
```

## Примеры

В каталоге [`examples/`](./examples) — рабочие скрипты: поиск аниме, лента последних переводов, полное сканирование по `afterId`, авторизация + получение embed-данных, расширенный фильтр через `buildChips()`. Запуск после сборки:

```bash
npm run build
npx tsx examples/search-series.ts gate
```

## Разработка

```bash
git clone https://github.com/thedvxch/anime365wrapper.git
cd anime365wrapper
npm install
npm run build
npm test
```
