// Tesseract.js configuration for consistent worker setup across different environments
import { createWorker } from 'tesseract.js';

// Define Tesseract worker options with CDN paths to ensure it works in serverless environments
export const tesseractWorkerOptions = {
  workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
  corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm.js',
  langPath: 'https://tessdata.projectnaptha.com/4.0.0'
};

// Function to create a consistent Tesseract worker across different environments
export async function createTesseractWorker(options: any = {}): Promise<any> {
  const worker = await createWorker({
    ...tesseractWorkerOptions,
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.floor(m.progress * 100)}%`);
      } else {
        console.log(`OCR Status: ${m.status}`);
      }
    },
    ...options
  });
  
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  
  return worker;
}

// Initialize Tesseract preload (if needed for specific environments)
export function initTesseractPreload() {
  console.log('Tesseract preload initialized');
  return {
    workerOptions: tesseractWorkerOptions,
    createWorker: createTesseractWorker
  };
}

export default {
  tesseractWorkerOptions,
  createTesseractWorker,
  initTesseractPreload
}; 