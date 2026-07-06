import type { DownloadOption, StreamOption } from './Translation.js';

export interface EmbedTranslation {
  embedUrl: string;
  download: DownloadOption[];
  stream: StreamOption[];
  subtitlesUrl: string;
  subtitlesVttUrl: string;
}
