#!/usr/bin/env node

/**
 * This script initializes necessary directories and configurations for the application.
 * It's intended to be run at application startup.
 */

const fs = require('fs');
const path = require('path');

// Ensure the tmp directory exists
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  console.log(`Creating tmp directory at: ${tmpDir}`);
  fs.mkdirSync(tmpDir);
}

// Ensure the uploads directory exists
const uploadsDir = path.join(tmpDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory at: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir);
}

console.log('Initialization completed successfully.'); 