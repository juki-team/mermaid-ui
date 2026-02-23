# Juki Mermaid

A **diagram editor** built on [Mermaid](https://mermaid.js.org/), integrated as part of the **Juki** platform. Create,
edit, and share diagrams with an AI assistant.

## Overview

Juki Mermaid provides a browser-based editor where you can write Mermaid diagram code and see a live preview. An AI
assistant (powered by Claude) helps you generate and fix diagrams from natural language descriptions.

## Features

- **Live Preview** - Instant rendering of Mermaid diagrams as you type
- **AI Assistant** - Generate or fix diagrams by describing them in natural language
- **Multiple Diagram Types** - Flowcharts, sequence diagrams, class diagrams, Gantt charts, ER diagrams, and more
- **Themes** - Switch between Default, Dark, Forest, Neutral, and Base themes
- **Export** - Download diagrams as SVG or PNG
- **Templates** - Start from pre-built diagram templates
- **Persistence** - Diagrams are saved and synced with the Juki server
- **Sharing** - Share diagrams via link or invite collaborators
- **Dynamic Routes** - Each diagram has its own URL (`/[mermaidKey]`)

## Tech Stack

| Category        | Technology                    |
|-----------------|-------------------------------|
| Framework       | Next.js 16 + React 19         |
| Language        | TypeScript 5                  |
| Diagram Engine  | Mermaid                       |
| AI              | Claude (Anthropic) via AI SDK |
| Base UI         | @juki-team/base-ui            |
| Package Manager | pnpm                          |

## Project Structure

```
src/
├── app/                          # Routes and layouts (Next.js App Router)
│   ├── (bare)/                   # Route group without main layout
│   │   ├── page.tsx              # Landing page
│   │   └── [mermaidKey]/         # Dynamic page for each diagram
│   │       ├── page.tsx          # Server component
│   │       ├── MermaidViewPage.tsx    # Main editor (client component)
│   │       ├── MermaidAiChat.tsx      # AI chat panel
│   │       ├── GraphicToolbar.tsx     # Zoom/export toolbar
│   │       └── mermaid-templates.ts  # Built-in templates
│   └── api/
│       └── chat/mermaid/         # AI chat endpoint (Claude)
├── components/                   # Reusable React components
│   ├── commons/                  # Common components
│   └── server/                   # Server-side components
├── config/                       # App configuration
├── hooks/                        # Custom hooks
├── helpers/                      # Utility functions
├── types/                        # TypeScript type definitions
└── public/                       # Static assets
```

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
# Start development server (port 3076)
pnpm dev
```

Open [http://localhost:3076](http://localhost:3076) with your browser.

### Production

```bash
pnpm build
pnpm start
```

## Available Scripts

| Script       | Description                            |
|--------------|----------------------------------------|
| `pnpm dev`   | Start development server on port 3076  |
| `pnpm build` | Build the application for production   |
| `pnpm start` | Start the production server            |
| `pnpm lint`  | Run ESLint                             |
| `pnpm pull`  | Update `@juki-team` packages to latest |

## Version

**v0.1.4**

## Related Projects

- [Juki](http://juki.app/) - Main Juki platform
- [Juki Judge](https://judge.juki.app) - Platform for online programming competitions
- [Juki Coach](https://coach.juki.app/) - AI-powered programming coach
- [Juki Utils](https://utils.juki.app/) - Development utilities
- [Juki IDE](https://ide.juki.app/) - Online code editor
- [Juki Excalidraw](https://excalidraw.juki.app/) - Online excalidraw
- [@juki-team/base-ui](https://www.npmjs.com/package/@juki-team/base-ui) - Juki team UI components

## License

This project is part of the Juki ecosystem.
