import { ApiResponse } from '../models/ApiResponse';
import { Translation } from '../models/Translation';
import { EmbedTranslation } from '../models/EmbedTranslation';
import { Episode } from '../models/Episode';
import { Series } from '../models/Series';
import { User, LoginResponse } from '../models/User';

export class SmotretAnimeAPI {
  private baseUrl: string;
  private accessToken?: string;
  private userAgent: string;

  /**
   * @param baseUrl Базовый URL API (при необходимости можно сменить домен)
   * @param userAgent Название сайта или программы, которое будет отправляться в заголовке User-Agent
   * @param accessToken (опционально) access_token, если уже известен
   */
  constructor(
    baseUrl: string = 'https://smotret-anime.online/api',
    userAgent: string = 'Anime365Wrapper/1.0',
    accessToken?: string
  ) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
    if (accessToken) {
      this.accessToken = accessToken;
    }
  }

  /**
   * Устанавливает access_token для текущего экземпляра
   * @param token Токен авторизации
   */
  public setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Универсальный метод для выполнения запросов.
   * Добавляет access_token, если он установлен, и заголовок User-Agent.
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;

    if (this.accessToken && !url.includes('access_token=')) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}access_token=${this.accessToken}`;
    }

    const headers: HeadersInit = {
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
    }
    const json = await response.json() as ApiResponse<T>;
    return json.data;
  }

  /**
   * Авторизация по email и паролю.
   * При успешном логине access_token сохраняется для данного экземпляра.
   */
  async login(email: string, password: string): Promise<string> {
    const endpoint = `/login?app=universal&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    try {
      const data = await this.request<LoginResponse>(endpoint);
      if (data && data.access_token) {
        this.accessToken = data.access_token;
        return this.accessToken;
      } else {
        throw new Error('Не удалось получить access_token');
      }
    } catch (error) {
      throw new Error(`Ошибка авторизации: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // ===== Методы для работы с переводами =====

  async getTranslations(feed: 'recent' | 'id' | 'all' = 'recent', afterId?: number): Promise<Translation[]> {
    let endpoint = `/translations/?feed=${feed}`;
    if (afterId !== undefined) {
      endpoint += `&afterId=${afterId}`;
    }
    return this.request<Translation[]>(endpoint);
  }

  async getTranslationById(id: number): Promise<Translation> {
    return this.request<Translation>(`/translations/${id}`);
  }

  async getTranslationEmbed(id: number): Promise<EmbedTranslation> {
    return this.request<EmbedTranslation>(`/translations/embed/${id}`);
  }

  // ===== Методы для работы со списком аниме (series) =====

  async getSeriesList(params?: {
    fields?: string;
    chips?: string;
    myAnimeListId?: number;
    query?: string;
    pretty?: number;
    limit?: number;
    offset?: number;
  }): Promise<Series[]> {
    let endpoint = '/series/';
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]: [string, any]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      endpoint += `?${queryParams.toString()}`;
    }
    return this.request<Series[]>(endpoint);
  }

  async getSeriesById(id: number): Promise<Series> {
    return this.request<Series>(`/series/${id}`);
  }

  // ===== Методы для работы с эпизодами =====

  async getEpisodeById(id: number): Promise<Episode> {
    return this.request<Episode>(`/episodes/${id}`);
  }

  // ===== Методы для работы с пользователем =====

  async getCurrentUser(): Promise<User> {
    if (!this.accessToken) {
      throw new Error('Требуется авторизация для получения информации о пользователе');
    }
    return this.request<User>('/me');
  }
}
