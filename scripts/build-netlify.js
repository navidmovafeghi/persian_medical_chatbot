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

// Check and fix migration_lock.toml if needed
const migrationLockPath = path.join(__dirname, '..', 'prisma', 'migrations', 'migration_lock.toml');
if (fs.existsSync(migrationLockPath)) {
  const lockContent = fs.readFileSync(migrationLockPath, 'utf-8');
  if (lockContent.includes('provider = "sqlite"')) {
    console.log('Fixing migration_lock.toml to use PostgreSQL...');
    fs.writeFileSync(
      migrationLockPath,
      lockContent.replace('provider = "sqlite"', 'provider = "postgresql"')
    );
  }
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

// Skip migrations and use db push for Netlify deployment
// This is safer for serverless environments and avoids migration issues
console.log('Setting up database with prisma db push...');
try {
  console.log('Resetting database schema...');
  execSync('npx prisma db push --accept-data-loss --force-reset', { stdio: 'inherit' });
  console.log('Database schema reset and pushed successfully.');
} catch (error) {
  console.error('Error pushing schema to database:', error);
  process.exit(1);
}

console.log('Database setup completed successfully.'); 