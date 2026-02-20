# Excalidraw UI

A **real-time collaborative drawing application** built on [Excalidraw](https://excalidraw.com/), integrated as part of
the **Juki Judge** platform - an educational platform designed to improve programming skills.

## Overview

Excalidraw UI provides a digital whiteboard where multiple users can collaborate simultaneously on diagrams, sketches,
and visual notes with instant synchronization.

## Features

- **Real-time Collaboration** - Instant synchronization of changes between users
- **Cursor Tracking** - See where other collaborators are drawing
- **Member Presence** - View connected collaborators with avatars and names
- **Persistence** - Drawings are saved and synced with the Juki server
- **Dynamic Routes** - Each drawing has its own URL (`/[excalidrawKey]`)

## Tech Stack

| Category         | Technology            |
|------------------|-----------------------|
| Framework        | Next.js 16 + React 19 |
| Language         | TypeScript 5          |
| Drawing Editor   | Excalidraw            |
| Real-time        | Ably + @ably/spaces   |
| Base UI          | @juki-team/base-ui    |
| State Management | Zustand               |

## Project Structure

```
src/
├── app/                          # Routes and layouts (Next.js App Router)
│   ├── (bare)/                   # Route group without main layout
│   │   └── [excalidrawKey]/      # Dynamic page for each drawing
│   │       ├── page.tsx          # Main page (server component)
│   │       ├── ExcalidrawViewPage.tsx  # Editor component (client component)
│   │       └── ExcalidrawNotFoundCard.tsx
│   └── api/
│       └── version/              # Version endpoint
├── components/                   # Reusable React components
│   ├── layout/                   # Layouts
│   ├── commons/                  # Common components
│   ├── styles/                   # Style components
│   └── server/                   # Server-side components
├── config/                       # App configuration
│   └── constants/
│       ├── routes.ts             # Metadata definitions
│       ├── commons.ts            # Common constants
│       └── settings.ts
├── hooks/                        # Custom hooks
│   ├── useRouter.ts
│   └── useSearchParams.ts
├── helpers/                      # Utility functions
├── types/                        # TypeScript type definitions
└── public/                       # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn

### Installation

```bash
# Install dependencies
yarn install
```

### Development

```bash
# Start development server (port 3075)
yarn dev
```

Open [http://localhost:3075](http://localhost:3075) with your browser to see the result.

### Production

```bash
# Build for production
yarn build

# Start production server
yarn start
```

## Available Scripts

| Script       | Description                           |
|--------------|---------------------------------------|
| `yarn dev`   | Start development server on port 3075 |
| `yarn build` | Build the application for production  |
| `yarn start` | Start the production server           |
| `yarn lint`  | Run ESLint                            |

## Architecture

### Real-time Collaboration

The application uses **Ably** for real-time communication:

- **LiveObjects** - Synchronize drawing elements between users
- **Spaces** - Manage collaborative spaces with cursor tracking
- **Presence** - Track connected members in each drawing session

### State Management

- **Zustand stores** - Global state management
- **Custom hooks** - UI, router, user, and Ably hooks
- **Refs** - Performance optimization for frequently changing data

## Version

**v0.1.4**

## Related Projects

- [Juki](http://juki.app/) - Main Juki platform
- [Juki Judge](https://judge.juki.app) - Platform for online programming competitions where users can benchmark their
  skills and compete with fellow programmers
- [Juki Coach](https://coach.juki.app/) - AI-powered programming coach with personalized learning paths for programmers
  at every skill level
- [Juki Utils](https://utils.juki.app/) - Development utilities as test case generator, url shortener, excalidraw
  creation
- [Juki IDE](https://ide.juki.app/) - Online code editor supporting C, C++, Java, JavaScript, and Python
- [Juki URL Shortener](http://juki.ly/) - URL shortening service for creating concise, shareable links
- [@juki-team/base-ui](https://www.npmjs.com/package/@juki-team/base-ui) - Juki team UI components

## License

This project is part of the Juki ecosystem.
