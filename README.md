# War Rooms Y

Multi-room wargaming chat application built with React, TypeScript, and XMPP.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build all packages
npm run build --workspaces
```

Visit `http://localhost:5173` and login as `commander.red` / `any` (pre-populated).

## Documentation

- **[TESTING.md](./TESTING.md)** - Testing guide (Storybook, Jest, Playwright)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide (PR previews, GitHub Pages)

## Project Structure

```
packages/
├── chat-ui/          # React frontend (Vite + MUI)
├── admin-ui/         # Admin console (React-Admin)
├── state/            # Jotai state management
├── xmpp/             # XMPP protocol helpers
├── openfire-rest/    # Openfire REST client
├── backend-mock/     # Mock XMPP backend (localStorage)
└── shared/           # Shared utilities

e2e/                  # Playwright E2E tests
.storybook/           # Storybook configuration
```

## Features

- Multi-room chat with force-based access control
- Flexible layout with resizable room columns
- Schema-driven message forms (RJSF)
- Game metadata via XMPP PubSub
- Mock backend for offline development
- Comprehensive test coverage (Jest, Playwright, Storybook)
