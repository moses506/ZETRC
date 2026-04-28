# ZETRC Web

A modern Vite + React + TypeScript starter scaffold for the Zambia Environmental Training and Research Center web application. This structure is designed for a large system with separate feature areas, shared utilities, hooks, and layout composition.

## Project structure

- `src/`
  - `components/` reusable UI components
  - `pages/` page-level views
  - `layout/` shared page layouts
  - `hooks/` custom React hooks
  - `utils/` shared helper functions
  - `assets/` static image and design assets
  - `styles/` global and design system styles

## Available commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your local env file:
   ```bash
   cp .env.example .env
   ```
3. Set `VITE_API_BASE_URL` in `.env` to the backend URL you want to use.
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173` in your browser.

## Notes

- The application entry is `src/main.tsx`.
- The root layout is defined in `src/layout/RootLayout.tsx`.
- Pages are modular and added under `src/pages/`.
- Shared UI patterns belong under `src/components/`.
