import type { Episode } from './Episode.js';

export interface Link {
  title: string;
  url: string;
}

export interface Description {
  source: string;
  value: string;
  updatedDateTime?: string;
}

export interface Titles {
  romaji?: string;
  ru?: string;
  en?: string;
  ja?: string;
}

export interface Genre {
  id: number;
  title: string;
  url: string;
}

export interface Series {
  id: number;
  aniDbId: number;
  animeNewsNetworkId: number;
  fansubsId: number;
  imdbId: number;
  worldArtId: number;
  isActive: number;
  isAiring: number;
  isHentai: number;
  links: Link[];
  myAnimeListId: number;
  anilistId?: number;
  myAnimeListScore?: string;
  worldArtScore?: string;
  worldArtTopPlace?: string | null;
  numberOfEpisodes: number;
  season: string;
  year: number;
  type: string;
  typeTitle: string;
  titles: Titles;
  posterUrl: string;
  posterUrlSmall: string;
  titleLines: string[];
  allTitles: string[];
  title: string;
  url: string;
  descriptions?: Description[];
  episodes?: Episode[];
  genres?: Genre[];
}
