import type { Episode } from './Episode.js';
import type { Series } from './Series.js';

export interface Translation {
  id: number;
  addedDateTime: string;
  activeDateTime: string;
  authorsList: string[];
  fansubsTranslationId: number;
  isActive: number;
  priority: number;
  qualityType: string;
  type: string;
  typeKind: string;
  typeLang: string;
  updatedDateTime: string;
  title: string;
  seriesId: number;
  episodeId: number;
  url: string;
  embedUrl: string;
  authorsSummary: string;
  episode?: Episode;
  series?: Series;
  duration?: string;
  width?: number;
  height?: number;
}

export interface DownloadOption {
  height: number;
  url: string;
}

export interface StreamOption {
  height: number;
  urls: string[];
}
