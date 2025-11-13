import React, { useCallback } from 'react';
import { ASPECT_RATIO_OPTIONS, STYLE_OPTIONS, TEMPLATE_PRESETS_OPTIONS } from '../constants';
import { AspectRatio, ImageStyle, OutputType, TemplatePreset, ReferenceImage } from '../types';
import { useDropzone } from 'react-dropzone';

interface ControlsPanelProps {
  prompts: string;
  setPrompts: (prompts: string) => void;
  style: ImageStyle;
  setStyle: (style: ImageStyle) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  outputType: OutputType;
  setOutputType: (type: OutputType) => void;
  template: TemplatePreset;
  setTemplate: (template: TemplatePreset) => void;
  onGenerate: () => void;
  isLoading: boolean;
  referenceImage: ReferenceImage | null;
  onImageUpload: (file: File) => void;
  onImageRemove: () => void;
  maintainConsistency: boolean;
  setMaintainConsistency: (value: boolean) => void;
  numberOfImages: number;
  setNumberOfImages: (value: number) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  prompts, setPrompts, style, setStyle, aspectRatio, setAspectRatio,
  outputType, setOutputType, template, setTemplate, onGenerate, isLoading,
  referenceImage, onImageUpload, onImageRemove, maintainConsistency, setMaintainConsistency,
  numberOfImages, setNumberOfImages
}) => {
  const videoAspectRatioOptions = ASPECT_RATIO_OPTIONS.filter(
    (option) => option.value === '16:9' || option.value === '9:16'
  );

  const handleOutputTypeChange = (type: OutputType) => {
    setOutputType(type);
    if (type === 'Video' && aspectRatio !== '16:9' && aspectRatio !== '9:16') {
      setAspectRatio('16:9');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'] },
    multiple: false,
  });
  
  const getPromptLabel = () => {
    if (referenceImage) {
      return outputType === 'Image' ? 'Editing Prompts (one per line)' : 'Video Prompt (describe the motion)';
    }
    return 'Prompts (one per line)';
  };

  const getPromptPlaceholder = () => {
    if (referenceImage) {
      return outputType === 'Image'
        ? 'e.g.\nAdd a retro filter\nMake the background black and white'
        : 'e.g.\nA slow zoom into the main subject';
    }
    return 'e.g.\nA majestic lion in a futuristic city\nA tranquil forest scene at sunrise';
  }

  return (
    <div className="bg-base-200 p-6 rounded-lg shadow-lg space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-lg font-semibold text-text-primary">Output Type:</label>
          <div className="flex rounded-md shadow-sm mt-2">
            <button
              onClick={() => handleOutputTypeChange('Image')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md transition-all w-full transform hover:-translate-y-px ${outputType === 'Image' ? 'bg-brand-primary text-white' : 'bg-base-300 text-text-secondary hover:bg-base-100'}`}
            >Image</button>
            <button
              onClick={() => handleOutputTypeChange('Video')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md transition-all w-full transform hover:-translate-y-px ${outputType === 'Video' ? 'bg-brand-primary text-white' : 'bg-base-300 text-text-secondary hover:bg-base-100'}`}
            >Video</button>
          </div>
        </div>
        <div>
          <label htmlFor="template" className="block text-lg font-semibold text-text-primary mb-2">Template Presets</label>
          <select
            id="template"
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplatePreset)}
            className="w-full p-2 bg-base-300 text-text-primary rounded-md border border-base-100 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
            disabled={isLoading || !!referenceImage}
          >
            {TEMPLATE_PRESETS_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-lg font-semibold text-text-primary mb-2">Reference Image (Optional)</label>
        {referenceImage ? (
          <div className="relative group">
            <img src={`data:${referenceImage.mimeType};base64,${referenceImage.base64}`} alt="Reference" className="w-full max-h-60 object-contain rounded-md bg-base-300 p-2" />
            <button
              onClick={onImageRemove}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >&times;</button>
          </div>
        ) : (
          <div {...getRootProps()} className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'border-brand-primary bg-brand-primary/10' : 'border-base-300 hover:border-brand-light hover:bg-base-300/50'}`}>
            <input {...getInputProps()} />
            <p className="text-center text-text-secondary">{isDragActive ? "Drop the image here..." : "Drag & drop an image here, or click to select"}</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="prompts" className="block text-lg font-semibold text-text-primary mb-2">{getPromptLabel()}</label>
        <textarea
          id="prompts"
          value={prompts}
          onChange={(e) => setPrompts(e.target.value)}
          rows={6}
          className="w-full p-3 bg-base-300 text-text-primary rounded-md border border-base-100 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
          placeholder={getPromptPlaceholder()}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {outputType === 'Image' && (
          <div>
            <label htmlFor="style" className="block text-lg font-semibold text-text-primary mb-2">Style</label>
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value as ImageStyle)}
              className="w-full p-3 bg-base-300 text-text-primary rounded-md border border-base-100 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
              disabled={isLoading || !!referenceImage}
            >
              {STYLE_OPTIONS.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
            </select>
          </div>
        )}

        {outputType === 'Image' && (
            <div>
                <label htmlFor="number-of-images" className="block text-lg font-semibold text-text-primary mb-2">Images per Prompt</label>
                <input
                   type="number"
                   id="number-of-images"
                   value={numberOfImages}
                   onChange={(e) => {
                       const val = e.target.valueAsNumber;
                       if (isNaN(val)) return;
                       if (val >= 1 && val <= 8) {
                           setNumberOfImages(val);
                       }
                   }}
                   min="1"
                   max="8"
                   className="w-full p-3 bg-base-300 text-text-primary rounded-md border border-base-100 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
                   disabled={isLoading || !!referenceImage}
                 />
            </div>
        )}
        
        <div>
          <label htmlFor="aspect-ratio" className="block text-lg font-semibold text-text-primary mb-2">Aspect Ratio</label>
          <select
            id="aspect-ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full p-3 bg-base-300 text-text-primary rounded-md border border-base-100 focus:ring-2 focus:ring-brand-light focus:border-brand-light transition"
            disabled={isLoading || !!referenceImage}
          >
            {(outputType === 'Image' ? ASPECT_RATIO_OPTIONS : videoAspectRatioOptions).map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
        </div>
      </div>

      {outputType === 'Image' && !referenceImage && (
        <div className="flex items-center justify-between bg-base-300/50 p-4 rounded-lg">
            <div>
                <label htmlFor="consistency-toggle" className="font-semibold text-text-primary text-lg">
                    Maintain Visual Consistency
                </label>
                <p className="text-sm text-text-secondary">
                    Keeps character and style the same across all generated images.
                </p>
            </div>
            <button
                type="button"
                id="consistency-toggle"
                onClick={() => setMaintainConsistency(!maintainConsistency)}
                disabled={isLoading}
                className={`${
                    maintainConsistency ? 'bg-brand-secondary' : 'bg-base-100'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 focus:ring-offset-base-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                role="switch"
                aria-checked={maintainConsistency}
            >
                <span
                    aria-hidden="true"
                    className={`${
                        maintainConsistency ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </button>
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isLoading || !prompts.trim()}
        className="w-full py-3 px-4 bg-brand-secondary hover:bg-brand-primary text-white font-bold rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:bg-base-300 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center transform hover:-translate-y-1 disabled:transform-none hover:shadow-xl"
      >
        {isLoading ? 'Generating...' : `Generate ${outputType}s`}
      </button>
    </div>
  );
};

export default ControlsPanel;