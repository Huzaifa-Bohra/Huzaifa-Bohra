import React, { useState } from 'react';
import { GeneratedAsset } from '../types';

interface OutputGridProps {
  assets: GeneratedAsset[];
  onDownloadAll: () => void;
  isZipping: boolean;
  onExtendVideo: (index: number, prompt: string) => Promise<void>;
  isLoading: boolean;
  selectedAssetIndices: Set<number>;
  onAssetSelect: (index: number) => void;
  onCreateAnimation: (prompt: string) => Promise<void>;
  onUpscaleImage: (index: number) => Promise<void>;
  upscalingIndex: number | null;
  onBulkUpscale: () => Promise<void>;
  isBulkUpscaling: boolean;
  bulkUpscalingProgress: { current: number; total: number } | null;
}

const OutputGrid: React.FC<OutputGridProps> = ({ assets, onDownloadAll, isZipping, onExtendVideo, isLoading, selectedAssetIndices, onAssetSelect, onCreateAnimation, onUpscaleImage, upscalingIndex, onBulkUpscale, isBulkUpscaling, bulkUpscalingProgress }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [extensionPrompt, setExtensionPrompt] = useState<string>('');
  const [isExtending, setIsExtending] = useState<false | number>(false);
  const [animationPrompt, setAnimationPrompt] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const handleExtendClick = async (index: number) => {
    if (!extensionPrompt.trim()) return;
    setIsExtending(index);
    await onExtendVideo(index, extensionPrompt);
    setIsExtending(false);
    setEditingIndex(null);
    setExtensionPrompt('');
  };

  const handleAnimationClick = async () => {
    if (!animationPrompt.trim()) return;
    setIsAnimating(true);
    await onCreateAnimation(animationPrompt);
    setIsAnimating(false);
    setAnimationPrompt('');
  };

  const selectedCount = selectedAssetIndices.size;
  const canAnimate = selectedCount >= 2 && selectedCount <= 3;
  
  // FIX: Refactored to use Array.prototype.filter for selecting assets. This is more idiomatic and avoids potential issues with direct indexing.
  const selectedAssets = assets.filter((_, index) => selectedAssetIndices.has(index));
  const allSelectedAreImages = selectedAssets.every(a => a.type === 'Image');
  const upscalableSelectedCount = selectedAssets.filter(asset => asset.type === 'Image' && !asset.isUpscaled).length;
  const showBulkUpscaleButton = allSelectedAreImages && upscalableSelectedCount > 0;
  const someSelectedAlreadyUpscaled = allSelectedAreImages && selectedAssets.some(asset => asset.type === 'Image' && asset.isUpscaled);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Generated Assets</h2>
        <button
          onClick={onDownloadAll}
          disabled={isZipping || isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-secondary hover:bg-brand-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light disabled:bg-base-300 disabled:cursor-not-allowed transform hover:-translate-y-1 disabled:transform-none transition-all duration-300"
        >
          {isZipping ? 'Zipping...' : 'Download All (.zip)'}
        </button>
      </div>
      
      {selectedCount > 0 && allSelectedAreImages && (
          <div className="bg-base-300 p-4 rounded-lg space-y-3 transition-all shadow-inner">
              <h3 className="text-lg font-semibold text-text-primary">{selectedCount} image{selectedCount > 1 ? 's' : ''} selected.</h3>
              
              {showBulkUpscaleButton && (
                  <div className="space-y-2 border-b border-base-100 pb-3">
                      <button
                          onClick={onBulkUpscale}
                          disabled={isLoading || isBulkUpscaling || isAnimating}
                          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:bg-base-200 disabled:cursor-not-allowed"
                      >
                          {isBulkUpscaling 
                              ? `Upscaling... (${bulkUpscalingProgress?.current}/${bulkUpscalingProgress?.total})`
                              : `Upscale ${upscalableSelectedCount} Image${upscalableSelectedCount > 1 ? 's' : ''} to 4K`
                          }
                      </button>
                      {someSelectedAlreadyUpscaled && (
                          <p className="text-xs text-text-secondary text-center pt-1">Note: Already upscaled images will be skipped.</p>
                      )}
                  </div>
              )}

              <div className="pt-2">
                  <p className="text-sm text-text-secondary">
                      {canAnimate ? "You can also create an animation from your selection." : "Select 2 to 3 images to create a short video."}
                  </p>
                  {canAnimate && (
                      <div className="space-y-2 pt-2">
                          <textarea
                              placeholder="Describe the animation (e.g., a smooth zoom-in)"
                              value={animationPrompt}
                              onChange={e => setAnimationPrompt(e.target.value)}
                              rows={2}
                              className="w-full p-2 bg-base-100 text-text-primary rounded-md border border-base-200 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
                              disabled={isLoading || isAnimating || isBulkUpscaling}
                          />
                          <button
                              onClick={handleAnimationClick}
                              disabled={!animationPrompt.trim() || isLoading || isAnimating || isBulkUpscaling}
                              className="w-full py-2 px-3 bg-brand-secondary hover:bg-brand-primary text-white font-bold rounded-md transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:bg-base-200 disabled:cursor-not-allowed"
                          >
                              {isAnimating ? 'Animating...' : 'Create Animation'}
                          </button>
                          <p className="text-xs text-text-secondary text-center pt-1">Note: The output will be a 16:9 video.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {assets.map((asset, index) => {
          const isSelected = selectedAssetIndices.has(index);
          const canSelect = asset.type === 'Image' && (isSelected || selectedCount < 3);

          return (
          <div key={index} className={`bg-base-200 rounded-lg shadow-lg overflow-hidden group relative transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl ${isSelected ? 'ring-2 ring-brand-secondary' : ''}`}>
            {asset.type === 'Image' && (
                 <div className="absolute top-2 left-2 z-10">
                     <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onAssetSelect(index)}
                        disabled={!canSelect || isLoading}
                        className="h-6 w-6 rounded border-gray-400 text-brand-secondary focus:ring-brand-light bg-base-300/50 backdrop-blur-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110"
                        aria-label={`Select image ${index + 1}`}
                     />
                 </div>
            )}
            {asset.isUpscaled && (
                <span className="absolute top-2 right-2 z-10 bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    4K
                </span>
            )}
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-black flex items-center justify-center">
              {asset.type === 'Image' ? (
                <img 
                    src={asset.url} 
                    alt={asset.prompt} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <video
                  src={asset.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm text-text-secondary truncate" title={asset.prompt}>{asset.prompt}</p>
              
              {asset.type === 'Image' && !asset.isUpscaled && (
                <button
                  onClick={() => onUpscaleImage(index)}
                  disabled={isLoading || isZipping || upscalingIndex !== null || asset.isUpscaled || isBulkUpscaling}
                  className="w-full py-2 px-3 bg-brand-light/10 hover:bg-brand-light/20 text-brand-light font-semibold text-sm rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                >
                  {upscalingIndex === index ? 'Upscaling...' : 'Upscale to 4K'}
                </button>
              )}
              
              {asset.type === 'Video' && (
                <>
                  {editingIndex !== index ? (
                    <button
                      onClick={() => { setEditingIndex(index); setExtensionPrompt(''); }}
                      disabled={isLoading || isZipping || isExtending !== false}
                      className="w-full py-2 px-3 bg-brand-light/10 hover:bg-brand-light/20 text-brand-light font-semibold text-sm rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                    >
                      Extend Video
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        placeholder="What should happen next?"
                        value={extensionPrompt}
                        onChange={e => setExtensionPrompt(e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-base-300 text-text-primary rounded-md border border-base-100 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleExtendClick(index)}
                          disabled={!extensionPrompt.trim() || isExtending === index}
                          className="flex-1 py-2 px-3 bg-brand-secondary hover:bg-brand-primary text-white font-bold rounded-md transition-all duration-300 disabled:bg-base-300 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                        >
                          {isExtending === index ? 'Generating...' : 'Generate Extension'}
                        </button>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="py-2 px-3 bg-base-300 hover:bg-base-100 text-text-secondary font-medium rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default OutputGrid;