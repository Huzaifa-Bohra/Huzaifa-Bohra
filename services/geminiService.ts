import { GoogleGenAI, Modality, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { AspectRatio, ImageStyle, ReferenceImage, HistoryItem } from '../types';
import { STYLE_MODIFIERS, CONSISTENCY_PROMPT } from '../constants';

const getGenAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const videoProgressMessages = [
    "Warming up the pixels...",
    "Choreographing the digital actors...",
    "Rendering the first few frames...",
    "Applying cinematic magic...",
    "Almost at the director's cut...",
    "Finalizing the special effects...",
    "Adding the final polish...",
];

const checkApiKey = async () => {
    const hasApiKey = await window.aistudio.hasSelectedApiKey();
    if (!hasApiKey) {
        await window.aistudio.openSelectKey();
    }
};

const handleApiError = async (error: any) => {
    if (error.message.includes("Requested entity was not found.")) {
        await window.aistudio.openSelectKey();
        throw new Error("API Key selection failed or was invalid. Please select a valid API key and try again.");
    }
    throw error;
};

export const generateImages = async (
  prompts: string[],
  style: ImageStyle,
  aspectRatio: AspectRatio,
  maintainConsistency: boolean,
  numberOfImages: number,
): Promise<{ prompt: string; base64: string; mimeType: string }[]> => {
  const ai = getGenAI();
  
  const imagePromises = prompts.map(async (prompt) => {
    let fullPrompt = `${prompt}, ${STYLE_MODIFIERS[style]}`;
    if (maintainConsistency) {
        fullPrompt += `. ${CONSISTENCY_PROMPT}`;
    }
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: numberOfImages,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map(image => ({
        prompt,
        base64: image.image.imageBytes,
        mimeType: 'image/jpeg'
      }));
    }
    return [];
  });

  const allGeneratedImages = await Promise.all(imagePromises);
  return allGeneratedImages.flat();
};

export const editImages = async (
  prompts: string[],
  referenceImage: ReferenceImage,
): Promise<{ prompt: string; base64: string; mimeType: string }[]> => {
  const ai = getGenAI();
  
  const editPromises = prompts.map(async (prompt) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: referenceImage.base64,
                        mimeType: referenceImage.mimeType,
                    },
                },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagesForPrompt: { prompt: string; base64: string; mimeType: string }[] = [];
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            imagesForPrompt.push({
              prompt,
              base64: part.inlineData.data,
              mimeType: part.inlineData.mimeType,
            });
        }
    }
    return imagesForPrompt;
  });

  const allEditedImages = await Promise.all(editPromises);
  return allEditedImages.flat();
};

export const upscaleImage = async (
  referenceImage: ReferenceImage,
): Promise<{ base64: string; mimeType: string }> => {
  const ai = getGenAI();
  const prompt = "Upscale this image to the highest possible resolution, enhancing details and clarity without altering the original composition or subject. Make it 4K.";

  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
          parts: [
              {
                  inlineData: {
                      data: referenceImage.base64,
                      mimeType: referenceImage.mimeType,
                  },
              },
              { text: prompt },
          ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
  } else {
      throw new Error('Image upscaling failed to return an image.');
  }
};

export const generateVideos = async (
  prompts: string[],
  aspectRatio: AspectRatio,
  referenceImage?: ReferenceImage,
  onProgress?: (index: number, prompt: string, message: string) => void,
): Promise<{ prompt: string; url: string; base64: string; videoObject: any }[]> => {
  if (!referenceImage && aspectRatio !== '16:9' && aspectRatio !== '9:16') {
    throw new Error('Invalid aspect ratio for video generation. Only 16:9 and 9:16 are supported.');
  }

  await checkApiKey();
  
  const videoPromises = prompts.map(async (prompt, index) => {
    try {
      const ai = getGenAI();
      const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
        }
      };
      
      if (referenceImage) {
        payload.image = {
            imageBytes: referenceImage.base64,
            mimeType: referenceImage.mimeType,
        };
        payload.config.aspectRatio = aspectRatio === '9:16' ? '9:16' : '16:9';
      } else {
        payload.config.aspectRatio = aspectRatio;
      }
      
      let operation = await ai.models.generateVideos(payload);

      let progressIndex = 0;
      onProgress?.(index, prompt, videoProgressMessages[progressIndex % videoProgressMessages.length]);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        progressIndex++;
        onProgress?.(index, prompt, videoProgressMessages[progressIndex % videoProgressMessages.length]);
      }
      
      onProgress?.(index, prompt, "Video is ready! Preparing for download...");

      const videoData = operation.response?.generatedVideos?.[0]?.video;
      if (videoData?.uri) {
        const downloadLink = videoData.uri;
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
                if (reader.result) {
                    resolve((reader.result as string).split(',')[1]);
                } else {
                    reject('Failed to read blob as base64');
                }
            };
            reader.onerror = reject;
        });
        reader.readAsDataURL(videoBlob);
        const base64 = await base64Promise;

        return { prompt, url: videoUrl, base64: base64, videoObject: videoData };
      } else {
          throw new Error(`Video generation for prompt "${prompt}" failed to return a video.`);
      }
    } catch (error: any) {
        await handleApiError(error);
        throw error; // Propagate error to Promise.all
    }
  });

  const allGeneratedVideos = await Promise.all(videoPromises);
  
  return allGeneratedVideos;
};

export const extendVideo = async (
    previousVideo: any,
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onProgress?: (message: string) => void,
): Promise<{ prompt: string; url: string; base64: string; videoObject: any }> => {
    await checkApiKey();

    try {
        const ai = getGenAI();
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt: prompt,
            video: previousVideo,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        });

        let progressIndex = 0;
        onProgress?.(videoProgressMessages[progressIndex % videoProgressMessages.length]);
        
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            progressIndex++;
            onProgress?.(videoProgressMessages[progressIndex % videoProgressMessages.length]);
        }
        
        onProgress?.("Video extension is ready! Preparing for download...");

        const videoData = operation.response?.generatedVideos?.[0]?.video;
        if (videoData?.uri) {
            const downloadLink = videoData.uri;
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);

            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onloadend = () => reader.result ? resolve((reader.result as string).split(',')[1]) : reject('Failed to read blob');
                reader.onerror = reject;
            });
            reader.readAsDataURL(videoBlob);
            const base64 = await base64Promise;

            return { prompt, url: videoUrl, base64, videoObject: videoData };
        } else {
            throw new Error('Video extension did not return a valid video URI.');
        }
    } catch (error) {
        await handleApiError(error);
        // This line will not be reached if handleApiError throws, but it's good practice for other errors.
        throw error;
    }
};

export const createAnimationFromImages = async (
  referenceImages: ReferenceImage[],
  prompt: string,
  onProgress?: (message: string) => void,
): Promise<{ prompt: string; url: string; base64: string; videoObject: any }> => {
  if (referenceImages.length < 2 || referenceImages.length > 3) {
      throw new Error("Animation requires between 2 and 3 reference images.");
  }
  await checkApiKey();

  try {
      const ai = getGenAI();
      
      const referenceImagesPayload: VideoGenerationReferenceImage[] = referenceImages.map(img => ({
          image: {
              imageBytes: img.base64,
              mimeType: img.mimeType,
          },
          referenceType: VideoGenerationReferenceType.ASSET,
      }));

      let operation = await ai.models.generateVideos({
          model: 'veo-3.1-generate-preview',
          prompt: prompt,
          config: {
              numberOfVideos: 1,
              referenceImages: referenceImagesPayload,
              resolution: '720p',
              aspectRatio: '16:9'
          }
      });

      let progressIndex = 0;
      onProgress?.(videoProgressMessages[progressIndex % videoProgressMessages.length]);
      
      while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation: operation });
          progressIndex++;
          onProgress?.(videoProgressMessages[progressIndex % videoProgressMessages.length]);
      }
      
      onProgress?.("Animation is ready! Preparing for download...");

      const videoData = operation.response?.generatedVideos?.[0]?.video;
      if (videoData?.uri) {
          const downloadLink = videoData.uri;
          const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
          const videoBlob = await videoResponse.blob();
          const videoUrl = URL.createObjectURL(videoBlob);

          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onloadend = () => reader.result ? resolve((reader.result as string).split(',')[1]) : reject('Failed to read blob');
              reader.onerror = reject;
          });
          reader.readAsDataURL(videoBlob);
          const base64 = await base64Promise;

          return { prompt: `Animation: ${prompt}`, url: videoUrl, base64, videoObject: videoData };
      } else {
          throw new Error('Animation generation did not return a valid video URI.');
      }
  } catch (error) {
      await handleApiError(error);
      throw error;
  }
};

// --- History Service ---
const HISTORY_KEY = 'generationHistory';
const MAX_HISTORY_ITEMS = 20;

export const getHistory = (): HistoryItem[] => {
    try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
        console.error('Failed to load history from localStorage', error);
        localStorage.removeItem(HISTORY_KEY);
        return [];
    }
};

export const addHistoryItem = (item: Omit<HistoryItem, 'id'>) => {
    try {
        const newHistoryItem: HistoryItem = { ...item, id: Date.now() };
        const currentHistory = getHistory();
        const updatedHistory = [newHistoryItem, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Failed to save history to localStorage', error);
    }
};

export const clearHistory = () => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Failed to clear history from localStorage', error);
    }
};
