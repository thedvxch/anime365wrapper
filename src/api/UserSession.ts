import { SmotretAnimeAPI, type SmotretAnimeAPIOptions, type TranslationsQuery, type SeriesListQuery } from './SmotretAnimeAPI.js';
import type { Translation } from '../models/Translation.js';
import type { EmbedTranslation } from '../models/EmbedTranslation.js';
import type { Episode } from '../models/Episode.js';
import type { Series } from '../models/Series.js';
import type { User } from '../models/User.js';

/** Тонкая обёртка над SmotretAnimeAPI, которая запоминает access_token после логина. */
export class UserSession {
  private api: SmotretAnimeAPI;

  constructor(options: SmotretAnimeAPIOptions = {}) {
    this.api = new SmotretAnimeAPI(options);
  }

  /** Прямой доступ к нижележащему клиенту API, если нужны методы, не проксируемые здесь. */
  get client(): SmotretAnimeAPI {
    return this.api;
  }

  setAccessToken(token: string): void {
    this.api.setAccessToken(token);
  }

  getAccessToken(): string | undefined {
    return this.api.getAccessToken();
  }

  async login(email: string, password: string): Promise<string> {
    return this.api.login(email, password);
  }

  getTranslations(query?: TranslationsQuery): Promise<Translation[]> {
    return this.api.getTranslations(query);
  }

  getTranslationById(id: number): Promise<Translation> {
    return this.api.getTranslationById(id);
  }

  getTranslationEmbed(id: number): Promise<EmbedTranslation> {
    return this.api.getTranslationEmbed(id);
  }

  getSeriesList(query?: SeriesListQuery): Promise<Series[]> {
    return this.api.getSeriesList(query);
  }

  getSeriesById(id: number): Promise<Series> {
    return this.api.getSeriesById(id);
  }

  getEpisodeById(id: number): Promise<Episode> {
    return this.api.getEpisodeById(id);
  }

  getCurrentUser(): Promise<User> {
    return this.api.getCurrentUser();
  }
}
