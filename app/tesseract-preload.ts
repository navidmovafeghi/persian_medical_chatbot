// Tesseract.js preload configuration
// This file configures Tesseract.js to use CDN paths for workers

import { createWorker, Worker } from 'tesseract.js';

// Configuration to use CDN URLs instead of local files
export const tesseractWorkerOptions = {
  workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/worker.min.js',
  corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4.0.4/tesseract-core.wasm.js',
  langPath: 'https://tessdata.projectnaptha.com/4.0.0',
};

// Function to initialize Tesseract with our pre-configured options
export async function initializeTesseract() {
  // Dynamically import tesseract.js
  const Tesseract = await import('tesseract.js');
  return Tesseract;
}

// Helper function to create a worker with the correct configuration
export async function createTesseractWorker(
  language = 'fas',
  logger?: (log: any) => void
): Promise<Worker> {
  const Tesseract = await initializeTesseract();
  return Tesseract.createWorker(language, undefined, {
    ...tesseractWorkerOptions,
    logger: logger || (m => console.log('[Tesseract]', m))
  });
}

// Preload Tesseract.js configuration
// We don't await this as it's just meant to run in the background
initializeTesseract().catch(console.error); 