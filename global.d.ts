// FIX: Resolved TypeScript errors by using the existing global 'AIStudio' type for 'window.aistudio'.
// The previous inlined type was conflicting with the one provided by the execution environment.
declare global {
  interface Window {
    // FIX: Removed readonly modifier to resolve declaration conflict with the execution environment's typings.
    aistudio: AIStudio;
    JSZip: any;
  }
}

// Ensures this file is treated as a module, which is required by the `isolatedModules` tsconfig option.
export {};