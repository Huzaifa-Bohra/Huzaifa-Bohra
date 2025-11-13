// FIX: Implemented missing type definitions.
export type OutputType = 'Image' | 'Video';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type ImageStyle =
  | 'Realistic'
  | 'Cinematic'
  | 'Anime'
  | 'Photographic'
  | 'Fantasy'
  | 'Watercolor'
  | 'Low Poly'
  | 'Concept Art'
  | 'Retro';

export type TemplatePreset = 'Custom' | 'Product Mockup' | 'YouTube Thumbnail' | 'Character Sheet' | 'Wallpaper Pack';

export interface GeneratedAsset {
  type: OutputType;
  url: string;
  prompt: string;
  base64: string;
  mimeType: string;
  videoObject?: any;
  isUpscaled?: boolean;
}

export interface ReferenceImage {
  base64: string;
  mimeType: string;
}

export interface HistoryAsset {
  type: OutputType;
  prompt: string;
  base64: string;
  mimeType: string;
  isUpscaled?: boolean;
}

export interface HistoryItem {
  id: number;
  settings: {
    outputType: OutputType;
    prompts: string;
    style: ImageStyle;
    aspectRatio: AspectRatio;
    template: TemplatePreset;
    referenceImage: ReferenceImage | null;
    maintainConsistency: boolean;
    numberOfImages: number;
  };
  assets: HistoryAsset[];
}
