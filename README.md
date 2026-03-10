# Nexto - Your Connected Workspace

Nexto is a comprehensive, Notion-inspired workspace built with Next.js, React, Tailwind CSS, and Drizzle ORM. Designed to be performant, customizable, and capable, Nexto empowers you to write notes, organize workspaces, and build complex databases—all within a single app.

## Features

- **Rich Text Editor**: Write beautifully rich text notes and documents powered by BlockNote.
- **Nested Documents**: Organize your documents infinitely with nested pages, just like Notion.
- **Dynamic Databases**: Create custom database tables within pages featuring text, number, date, and customizable dropdown Select column types.
- **Sidepeek View**: Hover over any database row's title and click "OPEN" to view and edit its detailed properties in a sliding sidepeek panel.
- **Workspaces**: Collaborate across multiple workspaces or keep things private with Personal workspaces.
- **Soft Deletion & Trash**: Safely remove documents to an integrated Trash bin and restore them whenever needed.
- **Dark Mode**: Comes with a sleek Dark Mode aesthetic out of the box.
- **Responsive Navigation**: Includes a collapsible desktop sidebar and a bottom-sheet mobile menu.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React Server Components)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Editor**: [BlockNote](https://www.blocknotejs.org/)
- **Database**: [Neon Serverless Postgres](https://neon.tech/) & [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Clerk](https://clerk.com/)
- **File Uploads**: [UploadThing](https://uploadthing.com/)

## Getting Started

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   # or yarn / pnpm
   ```
3. Set up your `.env` file with exactly the required environment properties (e.g., Clerk Auth keys, Neon DB URI, and Uploadthing keys).
4. Run schema migrations via Drizzle.
5. Launch the local development server:
   ```bash
   npm run dev
   ```
6. Open your browser to [http://localhost:3000](http://localhost:3000) to see Nexto in action!

## Deployment

Deploy this app effortlessly on [Vercel](https://vercel.com/) or any other Next.js compatible hosting provider. Be sure to configure the same environment variables within your hosting dashboard as you did locally.
