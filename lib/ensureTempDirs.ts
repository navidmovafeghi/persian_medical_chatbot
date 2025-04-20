import { mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Ensures that all necessary temporary directories exist for the application
 * This should be called during application initialization
 */
export async function ensureTempDirectories() {
  try {
    // Ensure the temporary uploads directory exists
    const uploadDir = join(process.cwd(), 'tmp', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    console.log(`Initialized temp upload directory at: ${uploadDir}`);
    
    // Add other temporary directories as needed
    
    return { success: true };
  } catch (error) {
    console.error('Failed to initialize temporary directories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 