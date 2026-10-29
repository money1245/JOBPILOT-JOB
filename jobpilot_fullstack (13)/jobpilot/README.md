# JobPilot

JobPilot is a full-stack job-search assistant starter: resume builder, application tracker, AI-assisted cover letters and resume feedback, and interview practice.

## Included features

- Editable CV/resume builder with live preview and browser print / Save as PDF.
- Job application tracker with status stages, search, notes, deadlines, and summary metrics.
- AI cover letter generation from a resume and job description.
- AI resume-to-job feedback.
- Interview practice questions and AI answer feedback.
- Local demo mode: resume and job tracker data persist in this browser via localStorage.
- Optional Supabase authentication and cloud persistence.
- Server-side OpenAI integration; the secret API key is never sent to the browser.

## Run locally

1. Install Node.js 20 or later.
2. In this folder run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run dev` and open http://localhost:3000.

The app runs in local demo mode if Supabase is not configured. AI features require `OPENAI_API_KEY`.

## Configure AI

Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Restart `npm run dev`. Keep the key private and do not prefix it with `NEXT_PUBLIC_`.

## Enable accounts and cloud storage

1. Create a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
3. Run `supabase/schema.sql` in the Supabase SQL Editor.
4. In Supabase Authentication settings, enable your preferred sign-in method and set the local site URL to `http://localhost:3000`.

The current UI is usable in local demo mode. Supabase schema and client helpers are included for cloud persistence integration; the bundled UI does not yet implement sign-in screens or sync the demo-mode localStorage data to Supabase automatically.

## Deploy

Deploy the project to a Node-compatible host such as Vercel. Configure the same environment variables in the host dashboard. Never commit `.env.local`.

## Important

- This is a starter application, not a deployed public service.
- Sample jobs and CV content are demo data.
- AI output can be wrong; review every application before sending.
- Do not paste sensitive personal data unless you are comfortable sending it to the configured AI provider.
