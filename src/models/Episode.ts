import type { Translation } from './Translation.js';

export interface Episode {
  id: number;
  episodeFull: string;
  episodeInt: string;
  episodeTitle: string;
  episodeType: string;
  firstUploadedDateTime: string;
  isActive: number;
  isFirstUploaded: number;
  seriesId: number;
  translations?: Translation[];
}
