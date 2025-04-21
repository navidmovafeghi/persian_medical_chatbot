// This file is a workaround for Tesseract.js worker path issues in Next.js

// We're predefining these to use CDN paths instead of file paths
if (typeof window !== 'undefined') {
  // Browser environment
  window.TesseractWorkerOptions = {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core.wasm.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0'
  };
} else {
  // Node.js environment (for server-side)
  global.TesseractWorkerOptions = {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core.wasm.js',
    langPath: 'https://tessdata.projectnaptha.com/4.0.0'
  };
}

// Export the options for direct import
export const tesseractWorkerOptions = {
  workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
  corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core.wasm.js',
  langPath: 'https://tessdata.projectnaptha.com/4.0.0'
}; 