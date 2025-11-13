

// FIX: Implemented the main App component.
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ControlsPanel from './components/ControlsPanel';
import OutputGrid from './components/OutputGrid';
import Spinner from './components/Spinner';
import { generateImages, generateVideos, editImages, extendVideo, createAnimationFromImages, upscaleImage, addHistoryItem, getHistory, clearHistory, generatePromptSuggestions } from './services/geminiService';
import { AspectRatio, GeneratedAsset, ImageStyle, OutputType, TemplatePreset, ReferenceImage, HistoryItem, HistoryAsset } from './types';
import { TEMPLATE_PROMPTS } from './constants';


interface HistoryPanelProps {
  isOpen: boolean;
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, history, onLoadHistory, onClearHistory, onClose }) => {
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all generation history? This action cannot be undone.')) {
      onClearHistory();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end ${isOpen ? '' : 'pointer-events-none'}`} role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
      
      {/* Panel */}
      <aside className={`relative flex flex-col w-full max-w-md bg-base-200 shadow-xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between p-4 border-b border-base-300 flex-shrink-0">
          <h2 className="text-xl font-bold text-text-primary">Generation History</h2>
          <button onClick={onClose} className="p-1 rounded-full text-2xl leading-none text-text-secondary hover:bg-base-300 hover:rotate-90 transition-all duration-300" aria-label="Close history panel">&times;</button>
        </header>
        
        {history.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.map(item => (
                <article key={item.id} onClick={() => onLoadHistory(item)} className="bg-base-100 p-3 rounded-lg cursor-pointer hover:ring-2 hover:ring-brand-secondary hover:-translate-y-1 hover:shadow-xl transition-all flex gap-4 items-center group duration-300">
                  <div className="w-20 h-20 flex-shrink-0">
                    {item.assets[0].type === 'Image' ? (
                      <img src={`data:${item.assets[0].mimeType};base64,${item.assets[0].base64}`} alt="History preview" className="w-full h-full object-cover rounded-md bg-base-300" />
                    ) : (
                      <div className="w-full h-full object-cover rounded-md bg-base-300 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-semibold truncate text-text-primary group-hover:text-brand-light transition-colors">{item.settings.prompts.split('\n')[0] || 'Untitled'}</p>
                    <p className="text-sm text-text-secondary">{new Date(item.id).toLocaleString()}</p>
                    <p className="text-xs text-text-secondary mt-1">{item.assets.length} asset{item.assets.length > 1 ? 's' : ''}</p>
                  </div>
                </article>
              ))}
            </div>
            <footer className="p-4 border-t border-base-300 flex-shrink-0">
              <button onClick={handleClear} className="w-full py-2 px-3 bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded-md hover:scale-105 transform transition-all font-semibold duration-300">Clear History</button>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-lg font-semibold">No history yet.</p>
            <p className="text-sm">Your generated assets will appear here.</p>
          </div>
        )}
      </aside>
    </div>
  );
};

interface PromptIdeationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (theme: string) => void;
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  onUsePrompt: (prompt: string) => void;
  onAddPrompt: (prompt: string) => void;
  outputType: OutputType;
}

const PromptIdeationModal: React.FC<PromptIdeationModalProps> = ({
  isOpen, onClose, onGenerate, suggestions, isLoading, error, onUsePrompt, onAddPrompt, outputType
}) => {
  const [theme, setTheme] = useState('');

  const handleGenerateClick = () => {
    if (theme.trim()) {
      onGenerate(theme);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerateClick();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'pointer-events-none'}`} role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">
      <div 
        className={`fixed inset-0 bg-black/70 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      <div className={`relative w-full max-w-2xl bg-base-200 shadow-xl rounded-lg transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
        <header className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 id="prompt-modal-title" className="text-xl font-bold text-text-primary">
            Prompt Idea Generator
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-2xl leading-none text-text-secondary hover:bg-base-300 hover:rotate-90 transition-all duration-300" 
            aria-label="Close prompt ideation modal"
          >&times;</button>
        </header>
        
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="theme-input" className="block text-md font-semibold text-text-primary mb-2">
              Enter a basic idea or theme for your {outputType.toLowerCase()}:
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                id="theme-input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., a futuristic city at night"
                className="flex-grow p-2 bg-base-300 text-text-primary rounded-md border border-base-100 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
                disabled={isLoading}
              />
              <button
                onClick={handleGenerateClick}
                disabled={isLoading || !theme.trim()}
                className="py-2 px-4 bg-brand-secondary hover:bg-brand-primary text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:bg-base-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Thinking...' : 'Generate'}
              </button>
            </div>
          </div>

          <div className="min-h-[200px] bg-base-100 rounded-lg p-4 flex flex-col">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary m-auto">
                <Spinner />
                <p className="mt-2">Generating creative ideas...</p>
              </div>
            )}
            {error && !isLoading && (
              <div className="flex items-center justify-center h-full text-red-400 m-auto">
                <p>Error: {error}</p>
              </div>
            )}
            {!isLoading && !error && suggestions.length === 0 && (
                <div className="flex items-center justify-center h-full text-text-secondary text-center m-auto">
                    <p>Your generated prompt suggestions will appear here.</p>
                </div>
            )}
            {!isLoading && suggestions.length > 0 && (
              <ul className="space-y-3 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="bg-base-300 p-3 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 animate-fade-in">
                    <p className="text-text-primary flex-1">{suggestion}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => onAddPrompt(suggestion)}
                        className="px-3 py-1 text-xs font-semibold bg-brand-light/10 text-brand-light rounded-md hover:bg-brand-light/20 transition-all"
                      >
                        + Add
                      </button>
                      <button
                        onClick={() => onUsePrompt(suggestion)}
                        className="px-3 py-1 text-xs font-semibold bg-brand-secondary/80 text-white rounded-md hover:bg-brand-secondary transition-all"
                      >
                        Use
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [outputType, setOutputType] = useState<OutputType>('Image');
  const [prompts, setPrompts] = useState<string>('Cinematic sunrise over a still ocean, golden light spreading across waves, light mist, calm atmosphere, ultra-realistic.');
  const [style, setStyle] = useState<ImageStyle>('Retro');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [template, setTemplate] = useState<TemplatePreset>('Custom');
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [maintainConsistency, setMaintainConsistency] = useState<boolean>(false);
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  // FIX: Changed state to use Record<string, ...> to fix type inference issues with Object.entries.
  const [videoLoadingProgress, setVideoLoadingProgress] = useState<Record<string, { prompt: string; message: string }> | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssetIndices, setSelectedAssetIndices] = useState<Set<number>>(new Set());
  const [upscalingIndex, setUpscalingIndex] = useState<number | null>(null);
  const [isBulkUpscaling, setIsBulkUpscaling] = useState<boolean>(false);
  const [bulkUpscalingProgress, setBulkUpscalingProgress] = useState<{current: number, total: number} | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

  const [isPromptModalOpen, setIsPromptModalOpen] = useState<boolean>(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleTemplateChange = (newTemplate: TemplatePreset) => {
    setTemplate(newTemplate);
    if (newTemplate !== 'Custom') {
      setPrompts(TEMPLATE_PROMPTS[newTemplate]);
      if (newTemplate === 'Wallpaper Pack') {
        setAspectRatio('16:9');
        setStyle('Fantasy');
      } else if (newTemplate === 'Product Mockup') {
        setStyle('Realistic');
        setAspectRatio('4:3');
      } else if (newTemplate === 'Character Sheet') {
        setStyle('Concept Art');
        setMaintainConsistency(true);
      }
    }
  };

  const handlePromptsChange = (newPrompts: string) => {
    setPrompts(newPrompts);
    setTemplate('Custom');
  };

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setReferenceImage({ base64, mimeType: file.type });
    };
    reader.onerror = () => {
      setError("Failed to read the uploaded image.");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    const promptList = prompts.split('\n').filter(p => p.trim() !== '');
    if (promptList.length === 0) {
      setError('Please enter at least one prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedAssets([]);
    setSelectedAssetIndices(new Set());
    setVideoLoadingProgress(null);

    let createdAssets: GeneratedAsset[] = [];

    try {
      if (outputType === 'Image') {
        if (referenceImage) {
          setLoadingMessage('Editing image with your prompts...');
          const images = await editImages(promptList, referenceImage);
          createdAssets = images.map(({ prompt, base64, mimeType }) => ({
            type: 'Image',
            url: `data:${mimeType};base64,${base64}`,
            prompt,
            base64,
            mimeType,
          }));
        } else {
          setLoadingMessage('Generating images...');
          const images = await generateImages(promptList, style, aspectRatio, maintainConsistency, numberOfImages);
          createdAssets = images.map(({ prompt, base64, mimeType }) => ({
            type: 'Image',
            url: `data:${mimeType};base64,${base64}`,
            prompt,
            base64,
            mimeType,
          }));
        }
      } else { // Video generation
        if (referenceImage) {
            setLoadingMessage('Generating video from your image...');
        } else {
            setLoadingMessage(promptList.length > 1
              ? `Generating ${promptList.length} videos in parallel...`
              : 'Generating video...');
        }
        
        const onProgress = (index: number, prompt: string, message: string) => {
          setVideoLoadingProgress(prev => ({
            ...prev,
            [index]: { prompt, message },
          }));
        };
        
        const videos = await generateVideos(promptList, aspectRatio, referenceImage ?? undefined, onProgress);
        createdAssets = videos.map(({ prompt, url, base64, videoObject }) => ({
          type: 'Video',
          url,
          prompt,
          base64,
          videoObject,
          mimeType: 'video/mp4',
        }));
      }

      setGeneratedAssets(createdAssets);

      // Add to history on success
      const historyAssets: HistoryAsset[] = createdAssets.map(asset => ({
        type: asset.type,
        prompt: asset.prompt,
        base64: asset.base64,
        mimeType: asset.mimeType,
        isUpscaled: asset.isUpscaled,
      }));
      
      addHistoryItem({
        settings: {
          outputType, prompts, style, aspectRatio, template, 
          referenceImage, maintainConsistency, numberOfImages
        },
        assets: historyAssets
      });
      setHistory(getHistory());

    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(err.message || 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setVideoLoadingProgress(null);
    }
  };

  const handleExtendVideo = async (assetIndex: number, extensionPrompt: string) => {
    const assetToExtend = generatedAssets[assetIndex];
    if (!assetToExtend || assetToExtend.type !== 'Video' || !assetToExtend.videoObject) {
      setError('Cannot extend this asset. Original video data is missing or it was loaded from history.');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`Extending video...`);
    setError(null);
    setVideoLoadingProgress(null);

    try {
      const previousVideo = assetToExtend.videoObject;
      const onProgress = (message: string) => {
        setVideoLoadingProgress({
          0: { prompt: `Extending: "${extensionPrompt}"`, message }
        });
      };
      const newVideo = await extendVideo(previousVideo, extensionPrompt, previousVideo.aspectRatio, onProgress);
      
      const newAsset: GeneratedAsset = {
        type: 'Video',
        url: newVideo.url,
        prompt: `Extension: "${extensionPrompt}" (Original: ${assetToExtend.prompt})`,
        base64: newVideo.base64,
        videoObject: newVideo.videoObject,
        mimeType: 'video/mp4',
      };

      const newAssets = [...generatedAssets];
      newAssets.splice(assetIndex + 1, 0, newAsset);
      setGeneratedAssets(newAssets);

      // Add to history
      const historyAsset: HistoryAsset = {
        type: newAsset.type,
        prompt: newAsset.prompt,
        base64: newAsset.base64,
        mimeType: newAsset.mimeType,
      };
      
      addHistoryItem({
        settings: {
          outputType: 'Video',
          prompts: newAsset.prompt,
          style: 'Realistic', // Not applicable for video extension, provide a default
          aspectRatio: assetToExtend.videoObject.aspectRatio,
          template: 'Custom',
          referenceImage: null,
          maintainConsistency: false,
          numberOfImages: 1,
        },
        assets: [historyAsset]
      });
      setHistory(getHistory());

    } catch (err: any) {
      console.error('Video extension failed:', err);
      setError(err.message || 'An unknown error occurred during video extension.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setVideoLoadingProgress(null);
    }
  };
  
  const handleDownloadAll = async () => {
    if (generatedAssets.length === 0) return;
    setIsZipping(true);
    try {
      const JSZip = window.JSZip;
      const zip = new JSZip();
      
      generatedAssets.forEach((asset, index) => {
        const extension = asset.type === 'Image' ? 'jpg' : 'mp4';
        const fileName = `${asset.prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '_') || `asset_${index}`}.${extension}`;
        zip.file(fileName, asset.base64, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `generated_assets_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to create zip file:', err);
      setError('Failed to create zip file.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleAssetSelect = (index: number) => {
    setSelectedAssetIndices(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(index)) {
        newSelection.delete(index);
      } else {
        if (generatedAssets[index].type === 'Image' && newSelection.size < 3) {
            newSelection.add(index);
        }
      }
      return newSelection;
    });
  };
  
  const handleCreateAnimation = async (animationPrompt: string) => {
    if (selectedAssetIndices.size < 2) {
      setError('Please select 2 or 3 images to create an animation.');
      return;
    }

    const selectedAssets = Array.from(selectedAssetIndices).map(i => generatedAssets[i]);
    const referenceImages: ReferenceImage[] = selectedAssets.map(asset => ({
        base64: asset.base64,
        mimeType: asset.mimeType,
    }));

    setIsLoading(true);
    setLoadingMessage('Crafting your animation...');
    setError(null);
    setVideoLoadingProgress(null);

    try {
        const onProgress = (message: string) => {
            setVideoLoadingProgress({
              0: { prompt: `Animation: "${animationPrompt}"`, message }
            });
        };
        const newVideo = await createAnimationFromImages(referenceImages, animationPrompt, onProgress);
        const newAsset: GeneratedAsset = {
            type: 'Video',
            url: newVideo.url,
            prompt: newVideo.prompt,
            base64: newVideo.base64,
            videoObject: newVideo.videoObject,
            mimeType: 'video/mp4',
        };
        setGeneratedAssets(prev => [...prev, newAsset]);
        setSelectedAssetIndices(new Set());

        // Add to history
        const historyAsset: HistoryAsset = {
          type: newAsset.type,
          prompt: newAsset.prompt,
          base64: newAsset.base64,
          mimeType: newAsset.mimeType,
        };

        const referenceImageForHistory = referenceImages.length > 0 ? referenceImages[0] : null;
        
        addHistoryItem({
          settings: {
            outputType: 'Video',
            prompts: newAsset.prompt,
            style: 'Realistic', // Not applicable for animation, provide a default
            aspectRatio: '16:9',
            template: 'Custom',
            referenceImage: referenceImageForHistory,
            maintainConsistency: false,
            numberOfImages: 1,
          },
          assets: [historyAsset]
        });
        setHistory(getHistory());
    } catch (err: any) {
        console.error('Animation creation failed:', err);
        setError(err.message || 'An unknown error occurred during animation creation.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
        setVideoLoadingProgress(null);
    }
  };
  
  const handleUpscaleImage = async (assetIndex: number) => {
    const assetToUpscale = generatedAssets[assetIndex];
    if (!assetToUpscale || assetToUpscale.type !== 'Image') {
        setError('Only images can be upscaled.');
        return;
    }

    setUpscalingIndex(assetIndex);
    setError(null);

    try {
        const upscaledImage = await upscaleImage({
            base64: assetToUpscale.base64,
            mimeType: assetToUpscale.mimeType,
        });

        const newAsset: GeneratedAsset = {
            ...assetToUpscale,
            base64: upscaledImage.base64,
            mimeType: upscaledImage.mimeType,
            url: `data:${upscaledImage.mimeType};base64,${upscaledImage.base64}`,
            prompt: `(Upscaled) ${assetToUpscale.prompt}`,
            isUpscaled: true,
        };

        const newAssets = [...generatedAssets];
        newAssets[assetIndex] = newAsset;
        setGeneratedAssets(newAssets);

    } catch (err: any) {
        console.error('Image upscaling failed:', err);
        setError(err.message || 'An unknown error occurred during image upscaling.');
    } finally {
        setUpscalingIndex(null);
    }
  };

  const handleBulkUpscale = async () => {
    const upscalableAssets = Array.from(selectedAssetIndices)
        .map(index => ({ asset: generatedAssets[index], index }))
        .filter(({ asset }) => asset.type === 'Image' && !asset.isUpscaled);

    if (upscalableAssets.length === 0) {
        setError("No images selected for upscaling or selected images are already upscaled.");
        return;
    }

    setIsBulkUpscaling(true);
    setBulkUpscalingProgress({ current: 0, total: upscalableAssets.length });
    setError(null);

    const newAssets = [...generatedAssets];
    let completedCount = 0;

    for (const { asset, index } of upscalableAssets) {
        try {
            const upscaledImage = await upscaleImage({
                base64: asset.base64,
                mimeType: asset.mimeType,
            });

            const newAsset: GeneratedAsset = {
                ...asset,
                base64: upscaledImage.base64,
                mimeType: upscaledImage.mimeType,
                url: `data:${upscaledImage.mimeType};base64,${upscaledImage.base64}`,
                prompt: `(Upscaled) ${asset.prompt}`,
                isUpscaled: true,
            };
            newAssets[index] = newAsset;
        } catch (err: any) {
            console.error(`Failed to upscale image at index ${index}:`, err);
            setError(`Failed to upscale one or more images. Check console for details.`);
        } finally {
            completedCount++;
            setBulkUpscalingProgress({ current: completedCount, total: upscalableAssets.length });
            setGeneratedAssets([...newAssets]); 
        }
    }

    setIsBulkUpscaling(false);
    setBulkUpscalingProgress(null);
    setSelectedAssetIndices(new Set());
  };

  const handleLoadHistory = (item: HistoryItem) => {
    const { settings, assets } = item;
    setOutputType(settings.outputType);
    setPrompts(settings.prompts);
    setStyle(settings.style);
    setAspectRatio(settings.aspectRatio);
    setTemplate(settings.template);
    setReferenceImage(settings.referenceImage);
    setMaintainConsistency(settings.maintainConsistency);
    setNumberOfImages(settings.numberOfImages);

    const loadedAssets: GeneratedAsset[] = assets.map(asset => {
      let url: string;
      if (asset.type === 'Video') {
        const byteCharacters = atob(asset.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: asset.mimeType });
        url = URL.createObjectURL(blob);
      } else {
        url = `data:${asset.mimeType};base64,${asset.base64}`;
      }
      return {
        ...asset,
        url,
        videoObject: undefined, // Not stored in history
      };
    });
    setGeneratedAssets(loadedAssets);
    setError(null);
    setSelectedAssetIndices(new Set());
    setIsHistoryPanelOpen(false);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleGenerateSuggestions = async (theme: string) => {
    setIsGeneratingSuggestions(true);
    setSuggestionError(null);
    setPromptSuggestions([]);
    try {
        const suggestions = await generatePromptSuggestions(theme, outputType);
        setPromptSuggestions(suggestions);
    } catch (err: any) {
        console.error("Failed to get prompt suggestions:", err);
        setSuggestionError(err.message || "An error occurred while fetching suggestions.");
    } finally {
        setIsGeneratingSuggestions(false);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
      setPrompts(suggestion);
      setTemplate('Custom');
      setIsPromptModalOpen(false);
  };

  const handleAddSuggestion = (suggestion: string) => {
      setPrompts(prev => (prev.trim() ? `${prev}\n${suggestion}` : suggestion));
      setTemplate('Custom');
  };

  return (
    <div className="bg-base-100 min-h-screen text-text-primary font-sans">
      <Header outputType={outputType} onToggleHistory={() => setIsHistoryPanelOpen(p => !p)} />
      <HistoryPanel 
        isOpen={isHistoryPanelOpen}
        history={history}
        onLoadHistory={handleLoadHistory}
        onClearHistory={handleClearHistory}
        onClose={() => setIsHistoryPanelOpen(false)}
      />
      <PromptIdeationModal 
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onGenerate={handleGenerateSuggestions}
        suggestions={promptSuggestions}
        isLoading={isGeneratingSuggestions}
        error={suggestionError}
        onUsePrompt={handleUseSuggestion}
        onAddPrompt={handleAddSuggestion}
        outputType={outputType}
      />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <ControlsPanel
            prompts={prompts}
            setPrompts={handlePromptsChange}
            style={style}
            setStyle={setStyle}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            outputType={outputType}
            setOutputType={setOutputType}
            template={template}
            setTemplate={handleTemplateChange}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            referenceImage={referenceImage}
            onImageUpload={handleImageUpload}
            onImageRemove={() => setReferenceImage(null)}
            maintainConsistency={maintainConsistency}
            setMaintainConsistency={setMaintainConsistency}
            numberOfImages={numberOfImages}
            setNumberOfImages={setNumberOfImages}
            onOpenPromptModal={() => {
                setIsPromptModalOpen(true);
                setPromptSuggestions([]);
                setSuggestionError(null);
            }}
          />

          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <Spinner />
              <p className="text-text-secondary text-center">{loadingMessage}</p>
              {videoLoadingProgress && (
                <div className="mt-4 w-full max-w-2xl mx-auto p-4 bg-base-200 rounded-lg shadow-inner">
                  <p className="text-lg font-semibold text-brand-light text-center">Patience is a virtue!</p>
                  <p className="text-text-secondary mt-1 text-center">Video generation can take a few minutes. Here's an update on your batch:</p>
                  <div className="mt-4 space-y-2">
                    {/* FIX: Replaced Object.keys with Object.entries for better type safety and code clarity, resolving an indexing error. */}
                    {/* FIX: Simplified destructuring in map to avoid type inference issues. */}
                    {/* FIX: Explicitly typed map parameters to resolve 'unknown' type error for 'progress'. */}
                    {Object.entries(videoLoadingProgress)
                      .sort(([a], [b]) => Number(a) - Number(b)) // Keep order
                      .map(([index, progress]: [string, { prompt: string; message: string }]) => (
                          <div key={index} className="text-text-primary font-mono bg-base-300 p-3 rounded-md text-sm">
                            <p className="font-bold truncate" title={progress.prompt}>
                              <span className="text-brand-light">Video {Number(index) + 1}:</span> {progress.prompt.length > 50 ? `${progress.prompt.substring(0, 50)}...` : progress.prompt}
                            </p>
                            <p className="opacity-80 animate-pulse pt-1">{progress.message}</p>
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

          {generatedAssets.length > 0 && !isLoading && (
            <OutputGrid
              assets={generatedAssets}
              onDownloadAll={handleDownloadAll}
              isZipping={isZipping}
              onExtendVideo={handleExtendVideo}
              isLoading={isLoading}
              selectedAssetIndices={selectedAssetIndices}
              onAssetSelect={handleAssetSelect}
              onCreateAnimation={handleCreateAnimation}
              onUpscaleImage={handleUpscaleImage}
              upscalingIndex={upscalingIndex}
              onBulkUpscale={handleBulkUpscale}
              isBulkUpscaling={isBulkUpscaling}
              bulkUpscalingProgress={bulkUpscalingProgress}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;