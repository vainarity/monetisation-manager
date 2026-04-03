# Roblox Monetisation Manager

Free, open-source Roblox utility for managing gamepasses & developer products in bulk. Runs locally with your own Open Cloud API key — nothing leaves your machine.

## Features

- Bulk create, edit, and manage gamepasses & developer products
- Drag & drop icon uploads
- Multi-select with bulk toggle for-sale / regional pricing
- Search, sort, filter, list/grid views
- Export data
- Save multiple experiences

## Quick Start

Requires [Node.js](https://nodejs.org/) 18+. Unzip the project first!

```bash
cd path/to/monetisation-manager-main
npm install
npm run dev:full
```

Open [http://localhost:5173](http://localhost:5173), enter your **API key** and **Universe ID**.

> API key permissions needed on [Creator Hub](https://create.roblox.com/dashboard/credentials):
> - `universe.game-pass` — Read + Write
> - `universe.developer-product` — Read + Write

## Scripts

| Command | Description |
|---|---|
| `npm run dev:full` | Frontend + proxy **(recommended)** |
| `npm run dev` | Frontend only |
| `npm run build` | Production build |
| `npm start` | Production server |

## How It Works

```
Browser → Vite (:5173) → Express proxy (:3001) → Roblox API
```

The Express proxy avoids CORS. API keys stay in localStorage — nothing is sent to third parties.

## Tech Stack

React 19, TypeScript, Vite, Tailwind, Radix UI, Express

## License

[MIT](LICENSE)
