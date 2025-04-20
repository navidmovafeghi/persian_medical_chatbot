# Database Setup for Netlify Deployment

To fix the authentication issues on Netlify, you need to set up a cloud-hosted PostgreSQL database. The application has been configured to use PostgreSQL instead of SQLite because Netlify's serverless functions cannot use file-based databases effectively.

## Step 1: Create a PostgreSQL Database

Choose one of these free options:

### Option A: Neon (Recommended)
1. Go to [Neon.tech](https://neon.tech/) and sign up for a free account
2. Create a new project
3. Once your database is created, click on "Connection Details"
4. Copy the connection string that looks like: `postgresql://user:password@endpoint/database`

### Option B: Railway
1. Go to [Railway.app](https://railway.app/) and sign up
2. Create a new project and select PostgreSQL
3. Go to "Connect" tab to find your connection string

### Option C: Supabase
1. Go to [Supabase.com](https://supabase.com/) and sign up
2. Create a new project
3. Go to Settings > Database to find your connection string

## Step 2: Set Environment Variables in Netlify

1. Go to your Netlify dashboard
2. Navigate to your site's settings
3. Go to "Environment variables"
4. Add the following variables:
   - `DATABASE_URL` - paste your PostgreSQL connection string
   - Ensure `NEXTAUTH_URL` is set to your Netlify site URL
   - Ensure `NEXTAUTH_SECRET` is set (use the same value as in your local .env file)

## Step 3: Redeploy Your Site

1. After setting the environment variables, trigger a new deployment:
   - Go to the "Deploys" tab in your Netlify dashboard
   - Click "Trigger deploy" > "Deploy site"

Your authentication system should now work correctly with the cloud database!

## Testing Locally with the New Database

To test locally with the new database, update your `.env.local` file:

```
DATABASE_URL="your_postgresql_connection_string"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret"
```

Then run:
```
npx prisma migrate reset
npm run dev
``` 