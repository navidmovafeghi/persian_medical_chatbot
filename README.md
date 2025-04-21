This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploying to Netlify

To deploy this application to Netlify, follow these steps:

1. Push your code to a GitHub repository

2. Sign up for a [Netlify account](https://www.netlify.com/) if you don't have one

3. Connect your GitHub repository to Netlify
   - From the Netlify dashboard, click "Add new site" > "Import an existing project"
   - Choose "GitHub" as your Git provider
   - Select your repository

4. Configure the build settings
   - Build command: `npm run build`
   - Publish directory: `.next`
   
5. Set up environment variables in Netlify:
   - Go to Site settings > Environment variables
   - Add the following variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `NEXTAUTH_SECRET`: A secure random string for NextAuth
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `CRON_API_KEY`: A secure random string to protect cron job endpoints
     - `NEXTAUTH_URL`: Set to your Netlify site URL

6. Deploy the site
   - Netlify will automatically build and deploy your site when you push to the main branch

7. Set up a cron job service to call your pill reminder endpoints
   - Use a service like [Cron-job.org](https://cron-job.org/) or [GitHub Actions](https://github.com/features/actions) 
   - Create a job that calls `https://your-site.netlify.app/api/pills/reminders` with the `x-api-key` header
   - Schedule it to run every hour
   - Create another job for `https://your-site.netlify.app/api/pills/reminders/reset` to run at midnight
