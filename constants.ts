// FIX: Added missing constant definitions.
import { AspectRatio, ImageStyle, TemplatePreset } from './types';

export const ASPECT_RATIO_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:4', label: 'Tall (3:4)' },
];

export const STYLE_OPTIONS: { value: ImageStyle; label: string }[] = [
  { value: 'Realistic', label: 'Realistic' },
  { value: 'Cinematic', label: 'Cinematic' },
  { value: 'Anime', label: 'Anime' },
  { value: 'Photographic', label: 'Photographic' },
  { value: 'Fantasy', label: 'Fantasy' },
  { value: 'Watercolor', label: 'Watercolor' },
  { value: 'Low Poly', label: 'Low Poly' },
  { value: 'Concept Art', label: 'Concept Art' },
  { value: 'Retro', label: 'Retro' },
];

export const STYLE_MODIFIERS: Record<ImageStyle, string> = {
  Realistic: 'realistic, photorealistic, high detail, sharp focus',
  Cinematic: 'cinematic, dramatic lighting, wide-angle, movie still',
  Anime: 'anime style, vibrant colors, cel shading, detailed background',
  Photographic: 'photographic, high resolution, professional photo',
  Fantasy: 'fantasy art, epic, magical, intricate details, mythical',
  Watercolor: 'watercolor painting style, soft edges, blended colors',
  'Low Poly': 'low poly, geometric, stylized, minimalist',
  'Concept Art': 'concept art, detailed sketches, world-building, character design, environmental design',
  Retro: 'retro aesthetic, vintage photo, film grain, faded colors, light leaks, 1970s photography style',
};

export const TEMPLATE_PRESETS_OPTIONS: { value: TemplatePreset; label: string }[] = [
    { value: 'Custom', label: 'Custom Prompts' },
    { value: 'Product Mockup', label: 'Product Mockup' },
    { value: 'YouTube Thumbnail', label: 'YouTube Thumbnail' },
    { value: 'Character Sheet', label: 'Character Sheet' },
    { value: 'Wallpaper Pack', label: 'Wallpaper Pack' },
];

export const TEMPLATE_PROMPTS: Record<Exclude<TemplatePreset, 'Custom'>, string> = {
    'Product Mockup': `A modern smartwatch on a sleek display stand, studio lighting, clean background
A bottle of craft beer with a custom label, condensation droplets, on a rustic wooden table
A pair of designer sunglasses on a white marble surface, soft shadows`,
    'YouTube Thumbnail': `An expressive gamer with a headset reacting with excitement, vibrant neon background, high contrast
A person pointing at a shocking headline with a red arrow, exaggerated expression
A dramatic before-and-after comparison shot, split screen, bold text`,
    'Character Sheet': `Full body concept art of a futuristic sci-fi soldier, neutral standing pose
Headshot of the sci-fi soldier, smiling expression
Action pose of the sci-fi soldier, firing a laser rifle`,
    'Wallpaper Pack': `A breathtaking 4K wallpaper of a serene Japanese garden with a cherry blossom tree
A vibrant abstract digital art wallpaper with flowing neon lines
A fantasy landscape wallpaper of a castle in the clouds at sunset, 4K HD`
};

export const CONSISTENCY_PROMPT = `Maintain strong visual consistency across all generations. Preserve the same subject design, proportions, facial structure, and key visual identity. Keep identical lighting direction, color palette, tone, and camera angle for each generation. Ensure the art style, rendering quality, and level of detail remain consistent. Reproduce materials, costume, environment, and color harmony from the reference image. Do not alter the face, body shape, or camera composition between outputs. Use a consistent cinematic concept art style, same lens and lighting setup for all images. Negative: no variations in face, body, lighting, or composition; no inconsistent background or costume changes.`;
