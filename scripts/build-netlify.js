const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check for PostgreSQL DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Please set DATABASE_URL to a valid PostgreSQL connection string.');
  process.exit(1);
}

// Make sure the DATABASE_URL is for PostgreSQL
if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
  console.error('ERROR: DATABASE_URL must be a PostgreSQL connection string.');
  console.error('Current DATABASE_URL does not start with postgresql://');
  process.exit(1);
}

// Add PostgreSQL adapter if missing
try {
  console.log('Installing PostgreSQL adapter if needed...');
  execSync('npm install pg --save', { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: Could not install pg package:', error.message);
  // Continue anyway as it might already be installed
}

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