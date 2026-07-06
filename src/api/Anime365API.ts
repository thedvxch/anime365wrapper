import type { ApiResponse } from '../models/ApiResponse.js';
import type { Translation } from '../models/Translation.js';
import type { EmbedTranslation } from '../models/EmbedTranslation.js';
import type { Episode } from '../models/Episode.js';
import type { Series } from '../models/Series.js';
import type { User, LoginResponse } from '../models/User.js';
import { AnimeApiError, AnimeApiNetworkError } from '../errors/AnimeApiError.js';
import { toSearchParams } from '../utils/query.js';
import { buildChips, type Chip } from '../utils/chips.js';

/**
 * Известные домены-зеркала anime365 (smotret-anime.app официально числится
 * рабочим зеркалом для РФ). Пробуются по порядку при сетевых сбоях.
 */
export const DEFAULT_MIRRORS: readonly string[] = [
  'https://smotret-anime.online/api',
  'https://smotret-anime.app/api',
  'https://smotret-anime.org/api',
  'https://anime365.ru/api',
  'https://anime-365.ru/api',
];

export interface Anime365APIOptions {
  /**
   * Базовый URL API. Строка — фиксированный домен без fallback (как раньше).
   * Массив — список зеркал в порядке приоритета: при сетевом сбое (не при
   * ошибке самого API) автоматически пробуется следующий домен из списка.
   * По умолчанию используется DEFAULT_MIRRORS.
   */
  baseUrl?: string | string[];
  /** Название сайта или программы — API просит указывать его в User-Agent. */
  userAgent?: string;
  /** access_token, если уже известен (например, сохранён с прошлого запуска). */
  accessToken?: string;
  /** Таймаут запроса в миллисекундах. По умолчанию не ограничен. */
  timeoutMs?: number;
}

/** @deprecated Переименовано в {@link Anime365APIOptions} под имя пакета — алиас будет удалён в 3.0. */
export type SmotretAnimeAPIOptions = Anime365APIOptions;

export interface TranslationsQuery {
  /** Готовая лента: последние добавленные / онгоинги / полный список по id / все (включая неактивные). */
  feed?: 'recent' | 'id' | 'all';
  /** Для полного сканирования ленты `id`/`all` — id, начиная с которого выбирать следующие записи. */
  afterId?: number;
  seriesId?: number;
  episodeId?: number;
  /** Список полей через запятую либо массив имён полей. */
  fields?: string | string[];
  limit?: number;
  offset?: number;
}

export interface SeriesListQuery {
  /** Список полей через запятую либо массив имён полей. */
  fields?: string | string[];
  /** Расширенный фильтр каталога — готовая строка либо список условий для buildChips(). */
  chips?: string | Chip[];
  myAnimeListId?: number;
  query?: string;
  pretty?: number;
  limit?: number;
  offset?: number;
}

/** Обёртка над API anime365 (домены smotret-anime.online / anime365.ru и их зеркала). */
export class Anime365API {
  private mirrors: string[];
  private activeMirrorIndex = 0;
  private accessToken?: string;
  private userAgent: string;
  private timeoutMs?: number;

  constructor(options: Anime365APIOptions = {}) {
    const raw = options.baseUrl ?? DEFAULT_MIRRORS;
    this.mirrors = (Array.isArray(raw) ? raw : [raw]).map((url) => url.replace(/\/+$/, ''));
    if (this.mirrors.length === 0) {
      throw new Error('baseUrl: список зеркал не может быть пустым');
    }
    this.userAgent = options.userAgent ?? 'Anime365Wrapper/2.0';
    this.accessToken = options.accessToken;
    this.timeoutMs = options.timeoutMs;
  }

  /** Домен, на котором обслужен последний успешный запрос (baseUrl обычно оканчивается на `/api`). */
  private get baseUrl(): string {
    return this.mirrors[this.activeMirrorIndex]!;
  }

  private get siteUrl(): string {
    return this.baseUrl.replace(/\/api$/, '');
  }

  /** Зеркало, использованное последним успешным запросом (или первое из списка, если запросов ещё не было). */
  get activeBaseUrl(): string {
    return this.baseUrl;
  }

  /** Полный список зеркал в порядке приоритета. */
  get availableMirrors(): readonly string[] {
    return [...this.mirrors];
  }

  /** Страница входа через email/пароль или соцсети — там же можно получить access_token вручную. */
  get socialLoginUrl(): string {
    return `${this.siteUrl}/users/login`;
  }

  /** Страница, где авторизованный пользователь может посмотреть свой access_token. */
  get accessTokenPageUrl(): string {
    return `${this.siteUrl}/api/accessToken?app=universal`;
  }

  /** Устанавливает access_token для текущего экземпляра. */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | undefined {
    return this.accessToken;
  }

  private buildUrl(mirror: string, path: string, params?: object): URL {
    const url = new URL(`${mirror}${path}`);
    if (params) {
      for (const [key, value] of toSearchParams(params)) {
        url.searchParams.set(key, value);
      }
    }
    if (this.accessToken) {
      url.searchParams.set('access_token', this.accessToken);
    }
    return url;
  }

  /** Порядок опроса зеркал для текущего запроса: начиная с последнего успешного, по кругу. */
  private mirrorOrder(): string[] {
    return [...this.mirrors.slice(this.activeMirrorIndex), ...this.mirrors.slice(0, this.activeMirrorIndex)];
  }

  /**
   * Универсальный метод для выполнения запросов.
   * API smotret-anime.online (и его зеркала) всегда отвечает HTTP 200 и кодирует
   * ошибки в теле как `{ error: { code, message } }`, поэтому итог разбирается из
   * тела ответа, а не из статуса.
   *
   * При сетевом сбое (недоступный домен, DNS, таймаут) автоматически пробует
   * следующее зеркало из списка; ошибки самого API (`AnimeApiError`) не приводят
   * к переключению домена — домен ответил, значит проблема не в нём.
   */
  private async request<T>(path: string, params?: object, init: RequestInit = {}): Promise<T> {
    const order = this.mirrorOrder();
    let lastNetworkError: AnimeApiNetworkError | undefined;
    const failedMirrors: string[] = [];

    for (const mirror of order) {
      try {
        const result = await this.requestOnce<T>(mirror, path, params, init);
        this.activeMirrorIndex = this.mirrors.indexOf(mirror);
        return result;
      } catch (err) {
        if (err instanceof AnimeApiNetworkError) {
          lastNetworkError = err;
          failedMirrors.push(mirror);
          continue;
        }
        throw err;
      }
    }

    throw new AnimeApiNetworkError(
      `Не удалось подключиться ни к одному из зеркал API (${failedMirrors.join(', ')}): ${lastNetworkError?.message}`,
      { cause: lastNetworkError }
    );
  }

  private async requestOnce<T>(
    mirror: string,
    path: string,
    params: object | undefined,
    init: RequestInit
  ): Promise<T> {
    const url = this.buildUrl(mirror, path, params);

    const headers: RequestInit['headers'] = {
      'User-Agent': this.userAgent,
      Accept: 'application/json',
      ...init.headers,
    };

    const signal = init.signal ?? (this.timeoutMs ? AbortSignal.timeout(this.timeoutMs) : undefined);

    let response: Response;
    try {
      response = await fetch(url, { ...init, headers, signal });
    } catch (cause) {
      throw new AnimeApiNetworkError(
        `Не удалось выполнить запрос к ${url}: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause }
      );
    }

    let json: ApiResponse<T> | { error: { code: number; message: string } };
    try {
      json = (await response.json()) as ApiResponse<T> | { error: { code: number; message: string } };
    } catch (cause) {
      throw new AnimeApiNetworkError(
        `Не удалось разобрать ответ API (${response.status} ${response.statusText})`,
        { cause }
      );
    }

    if ('error' in json) {
      throw new AnimeApiError(json.error.code, json.error.message);
    }
    if (!response.ok) {
      throw new AnimeApiError(response.status, response.statusText);
    }
    return json.data;
  }

  /**
   * Авторизация по email и паролю.
   * При успешном логине access_token сохраняется для данного экземпляра.
   */
  async login(email: string, password: string): Promise<string> {
    const data = await this.request<LoginResponse>('/login', { app: 'universal', email, password });
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  // ===== Переводы =====

  async getTranslations(query: TranslationsQuery = {}): Promise<Translation[]> {
    return this.request<Translation[]>('/translations/', query);
  }

  async getTranslationById(id: number): Promise<Translation> {
    return this.request<Translation>(`/translations/${id}`);
  }

  async getTranslationEmbed(id: number): Promise<EmbedTranslation> {
    const embed = await this.request<EmbedTranslation>(`/translations/embed/${id}`);
    return {
      ...embed,
      subtitlesUrl: new URL(embed.subtitlesUrl, this.siteUrl).toString(),
    };
  }

  // ===== Аниме (series) =====

  async getSeriesList(query: SeriesListQuery = {}): Promise<Series[]> {
    const { chips, ...rest } = query;
    return this.request<Series[]>('/series/', {
      ...rest,
      chips: chips === undefined || typeof chips === 'string' ? chips : buildChips(chips),
    });
  }

  async getSeriesById(id: number): Promise<Series> {
    return this.request<Series>(`/series/${id}`);
  }

  // ===== Эпизоды =====

  async getEpisodeById(id: number): Promise<Episode> {
    return this.request<Episode>(`/episodes/${id}`);
  }

  // ===== Пользователь =====

  async getCurrentUser(): Promise<User> {
    if (!this.accessToken) {
      throw new Error('Требуется авторизация для получения информации о пользователе');
    }
    return this.request<User>('/me');
  }
}

/** @deprecated Переименован в {@link Anime365API} под имя пакета — алиас будет удалён в 3.0. */
export { Anime365API as SmotretAnimeAPI };
