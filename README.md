# gitProfileStats

gitProfileStats is a minimalist GitHub analytics dashboard built with React, TypeScript, and Vite. Enter any public GitHub username to view profile details, repository insights, language distribution, top repositories by stars, and summary metrics in a clean monochrome interface.

## Overview

gitProfileStats fetches public GitHub user data and repository data directly from the GitHub REST API, then computes useful analytics such as:

- Total stars across public repositories
- Average stars per repository
- Most used language
- Most recently updated repository
- Most starred repositories
- Language distribution

The design stays intentionally black, white, and grayscale for a premium product-style dashboard feel.

## Stack

- React 18
- TypeScript
- Vite
- Recharts
- GitHub REST API
- GitHub Pages

## Features

- Search by GitHub username
- Profile summary with avatar and public account information
- Repository analytics derived from public repo data
- Monochrome charts for languages, top repositories, and summary metrics
- Responsive layout for mobile, tablet, and desktop
- Loading, empty-state, rate-limit, not-found, and network error handling
- Smooth scroll to results after a successful analysis
- SVG logo component built in React

## Project Structure

```text
.
├── .github
│   └── workflows
│       └── deploy.yml
├── .gitignore
├── README.md
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── vite-env.d.ts
    ├── components
    │   ├── ChartsSection.tsx
    │   ├── Footer.tsx
    │   ├── Header.tsx
    │   ├── Hero.tsx
    │   ├── Logo.tsx
    │   ├── ProfileCard.tsx
    │   ├── RepoList.tsx
    │   ├── SearchForm.tsx
    │   └── StatsGrid.tsx
    ├── services
    │   └── githubApi.ts
    ├── types
    │   └── github.ts
    └── utils
        ├── analytics.ts
        └── format.ts
```

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL shown by Vite in your terminal.

## Build Instructions

Create a production build with:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## GitHub Pages Deployment

gitProfileStats includes two deployment paths:

- Manual deployment with the `gh-pages` package
- Automatic deployment with GitHub Actions via `.github/workflows/deploy.yml`

### Option 1: Manual deployment

1. Push the repository to GitHub.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Deploy:

   ```bash
   npm run deploy
   ```

4. In GitHub, open `Settings -> Pages`.
5. Set the source to the `gh-pages` branch if GitHub does not auto-detect it.

### Option 2: GitHub Actions deployment

1. Push the repository to the `main` branch.
2. In GitHub, open `Settings -> Pages`.
3. Set the source to `GitHub Actions`.
4. The included workflow will build and deploy the `dist` folder automatically on each push to `main`.

## Environment Notes

gitProfileStats works without authentication, but GitHub's unauthenticated API is rate-limited. If you want a higher limit during local development, create a GitHub personal access token and add it to a local `.env` file:

```bash
VITE_GITHUB_TOKEN=your_github_token_here
```

This environment variable is optional and is only used client-side at build/runtime in the browser. Do not commit it, and do not treat it as a secure server-side secret in a public deployment.

## GitHub API Rate Limits

- Unauthenticated requests are typically limited to 60 requests per hour per IP.
- Authenticated requests have a much higher limit.
- gitProfileStats detects rate-limit responses and shows a friendly message to the user.

## Scripts

- `npm run dev` - start the local development server
- `npm run build` - create the production build
- `npm run preview` - preview the production build
- `npm run deploy` - build and publish to GitHub Pages using `gh-pages`

## Notes

- The app uses a relative Vite base path so it can be deployed cleanly to GitHub Pages without hardcoding a repository name.
- All analytics are derived from public repositories returned by the GitHub API.
- Repositories with no detected language are grouped under `Unknown`.
