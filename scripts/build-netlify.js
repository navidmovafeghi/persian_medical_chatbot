const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create directories if they don't exist
const prismaDir = path.join(__dirname, '..', 'prisma');
if (!fs.existsSync(prismaDir)) {
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Ensure the SQLite database file exists
const dbPath = path.join(prismaDir, 'prod.db');
if (!fs.existsSync(dbPath)) {
  console.log('Creating empty SQLite database file...');
  fs.writeFileSync(dbPath, ''); // Create empty file
}

// Set environment variables for the build
process.env.DATABASE_URL = `file:./prisma/prod.db`;

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('Error generating Prisma client:', error);
  process.exit(1);
}

// Run Prisma migrations
console.log('Running Prisma migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running Prisma migrations:', error);
  process.exit(1);
}

console.log('Database setup completed successfully.'); 